#!/usr/bin/env python3
"""Lint markdown files for Obsidian prettify issues per AGENTS.md rules.

Auto-fixes:
  1. Bare #identifier outside backticks → wrap in backticks
     (Obsidian renders #id as a tag pill)
  2. Bare [[identifier]] outside backticks → wrap in backticks
     (Obsidian renders [[id]] as a wikilink)
  3. Bare [identifier] outside backticks (not followed by `(`) → wrap in backticks
     (Obsidian renders [id] as a link label with no URL)
  4. Bullet indentation normalized to 4-space steps:
     level 1 = 0 spaces, level 2 = 4 spaces, level 3 = 8 spaces, etc.
     (detects existing indentation depth by counting leading spaces / 2,
     then re-emits with 4 spaces per level)

Warns (does NOT auto-fix):
  5. Bullet lines >400 chars — likely a minified clump, consider splitting

Skips:
  - Text inside inline backtick spans (`...`)
  - Text inside fenced code blocks (``` ... ```)
  - Heading lines (for # check only — [id] and [[id]] are still checked)

Usage:
  python3 lint_markdown.py file1.md [file2.md ...]

Exit codes:
  0 = clean (or all violations auto-fixed; overlong bullets only warn)
  1 = overlong bullets found (need manual splitting)
  2 = usage error
"""
import re
import sys
from pathlib import Path

# Threshold for "minified clump" warning on bullet lines.
OVERLONG_BULLET_THRESHOLD = 400

# Regex for inline backtick spans — `...` (non-greedy, no nested backticks).
BACKTICK_SPAN = re.compile(r'`[^`]*`')

# Regex for fenced code block markers (``` or ~~~ at start of line).
FENCE_RE = re.compile(r'^(\s*)(```|~~~)')

# Regex for markdown headings (1-6 # at start of line).
HEADING_RE = re.compile(r'^\s{0,3}#{1,6}\s')

# Violation patterns (applied to text OUTSIDE backtick spans):
# 1. [[wikilink]] — must be checked BEFORE [link-label] to avoid double-matching.
WIKILINK_RE = re.compile(r'\[\[([^\]]+)\]\]')
# 2. #tag — preceded by non-word, non-backtick, non-slash (to skip URLs).
#    Requires a letter as the first char (so #1, #2 footnote-style refs don't match).
TAG_RE = re.compile(r'(?<![\w`/])#([a-zA-Z][a-zA-Z0-9_-]*)')
# 3. [link-label] — not preceded by [ (to skip [[...]] inner match),
#    not followed by ( (to skip real [text](url) links).
LINK_LABEL_RE = re.compile(r'(?<!\[)\[([^\]\[`]+)\](?!\()')


def split_by_backticks(line: str) -> list[tuple[str, bool]]:
    """Split a line into segments: (text, is_inside_backticks)."""
    segments: list[tuple[str, bool]] = []
    pos = 0
    for m in BACKTICK_SPAN.finditer(line):
        if m.start() > pos:
            segments.append((line[pos:m.start()], False))
        segments.append((m.group(), True))
        pos = m.end()
    if pos < len(line):
        segments.append((line[pos:], False))
    if not segments:
        segments.append(('', False))
    return segments


def fix_wikilink(m: re.Match) -> str:
    return f'`[[{m.group(1)}]]`'


def fix_tag(m: re.Match) -> str:
    return f'`#{m.group(1)}`'


def fix_link_label(m: re.Match) -> str:
    return f'`[{m.group(1)}]`'


def normalize_bullet_indent(line: str) -> tuple[str, bool]:
    """Normalize bullet indentation to 4-space steps.

    Level 1 (base) = 0 spaces, level 2 = 4 spaces, level 3 = 8 spaces, etc.

    Detection is idempotent: if the indent is already a multiple of 4, the
    level is indent // 4 (already normalized). If it's a multiple of 2 but
    not 4 (old-style 2-space indents), the level is indent // 2.

    Examples (first pass converts, second pass is no-op):
      '- foo'           → '- foo'           (level 0, unchanged)
      '  - foo'         → '    - foo'       (2→4, level 1)
      '    - foo'       → '    - foo'       (4, already normalized, level 1)
      '      - foo'     → '            - foo' (6→12, old level 3 → new level 3)
      '        - foo'   → '        - foo'   (8, already normalized, level 2)

    Non-bullet lines are returned unchanged.
    """
    m = re.match(r'^( +)([-*] )', line)
    if not m:
        return line, False

    indent_spaces = len(m.group(1))
    if indent_spaces == 0:
        return line, False

    # Idempotent level detection: 4-space steps are already normalized.
    if indent_spaces % 4 == 0:
        level = indent_spaces // 4
    else:
        # Old-style 2-space indents — convert to 4-space steps.
        level = indent_spaces // 2

    new_indent = '    ' * level
    new_line = new_indent + line[m.start(2):]
    changed = new_line != line
    return new_line, changed


def lint_line(line: str, in_code_block: bool) -> tuple[str, list[str], int]:
    """Lint a single line. Returns (fixed_line, messages, overlong_count)."""
    if in_code_block:
        return line, [], 0

    # Normalize bullet indentation to 4-space steps (runs first — structural).
    line, indent_changed = normalize_bullet_indent(line)

    is_heading = bool(HEADING_RE.match(line))
    segments = split_by_backticks(line)

    fixed_segments: list[str] = []
    messages: list[str] = []
    overlong = 0

    if indent_changed:
        messages.append('normalized bullet indent')

    for text, inside in segments:
        if inside:
            fixed_segments.append(text)
            continue

        new_text = text
        # Auto-fix [[wikilink]] first (before [link-label] to avoid partial match).
        prev = new_text
        new_text = WIKILINK_RE.sub(fix_wikilink, new_text)
        if new_text != prev:
            messages.append(f'fixed wikilink')

        # Auto-fix #tag (skip on heading lines — those are markdown headings).
        if not is_heading:
            prev = new_text
            new_text = TAG_RE.sub(fix_tag, new_text)
            if new_text != prev:
                messages.append(f'fixed tag')

        # Auto-fix [link-label] (not followed by `(`).
        prev = new_text
        new_text = LINK_LABEL_RE.sub(fix_link_label, new_text)
        if new_text != prev:
            messages.append(f'fixed link-label')

        fixed_segments.append(new_text)

    fixed_line = ''.join(fixed_segments)

    # Check for overlong bullets (warn only, no auto-fix).
    stripped = fixed_line.rstrip()
    if stripped.startswith('- ') and len(stripped) > OVERLONG_BULLET_THRESHOLD:
        overlong = 1

    return fixed_line, messages, overlong


def lint_file(path: Path) -> tuple[bool, list[str], int]:
    """Lint a markdown file. Returns (changed, messages, overlong_count)."""
    original = path.read_text(encoding='utf-8')
    lines = original.splitlines(keepends=True)

    in_code_block = False
    new_lines: list[str] = []
    messages: list[str] = []
    overlong_total = 0

    for i, line in enumerate(lines, 1):
        # Track fenced code block state.
        if FENCE_RE.match(line):
            in_code_block = not in_code_block
            new_lines.append(line)
            continue

        fixed, msgs, overlong = lint_line(line, in_code_block)
        new_lines.append(fixed)
        for msg in msgs:
            messages.append(f'{path.name}:{i}: {msg}')
        overlong_total += overlong

    changed = ''.join(new_lines) != original
    if changed:
        path.write_text(''.join(new_lines), encoding='utf-8')

    return changed, messages, overlong_total


def main() -> int:
    if len(sys.argv) < 2:
        print('Usage: lint_markdown.py <file1.md> [file2.md ...]', file=sys.stderr)
        return 2

    any_changed = False
    all_messages: list[str] = []
    total_overlong = 0

    for arg in sys.argv[1:]:
        path = Path(arg)
        if not path.exists():
            print(f'WARN: {path} does not exist — skipping', file=sys.stderr)
            continue
        if path.suffix != '.md':
            continue

        changed, messages, overlong = lint_file(path)
        if changed:
            any_changed = True
            print(f'FIXED: {path}')
        all_messages.extend(messages)
        total_overlong += overlong

    if all_messages:
        print()
        print('=== Lint messages ===')
        for m in all_messages:
            print(f'  {m}')

    if any_changed:
        print()
        print('Auto-fixed bare #id / [id] / [[id]] tokens — wrapped in backticks.')

    if total_overlong > 0:
        print()
        print(f'WARNING: {total_overlong} overlong bullet(s) found (> {OVERLONG_BULLET_THRESHOLD} chars).')
        print('These are likely minified clumps — consider splitting into separate bullets.')
        print('Re-run after splitting to clear this warning.')
        # Exit 0 — warnings don't block prepare.sh. The auto-fixes are already applied.
        # The warning is the JIT reminder; splitting is the agent's responsibility.

    return 0


if __name__ == '__main__':
    sys.exit(main())
