#!/usr/bin/env python3
"""Split overlong bullet lines in a markdown file at natural break points.

Splits lines >400 chars that start with '- ' or '  - ' by inserting sub-bullets
at natural break points: after '; ', after '. ' (when followed by a capital),
or after ', ' before a '**bold**' marker.

Only splits if the result has at least 2 bullets each under 400 chars.
Otherwise leaves the line as-is (the linter will keep warning).
"""
import re
import sys
from pathlib import Path

THRESHOLD = 400

def split_bullet(line: str) -> list[str]:
    """Try to split a bullet line into multiple sub-bullets. Returns the split
    lines if successful, or [line] if no good split point was found."""
    if len(line.rstrip()) <= THRESHOLD:
        return [line]

    # Determine indentation + bullet marker
    stripped = line.lstrip()
    indent = line[:len(line) - len(stripped)]
    if stripped.startswith('- '):
        bullet = '- '
        content = stripped[2:]
    elif stripped.startswith('  - '):
        # Already a sub-bullet — split into sub-sub-bullets with deeper indent
        indent = line[:line.index('- ')]
        bullet = '- '
        content = stripped[2:]
    else:
        return [line]

    # Try splitting at '; ' boundaries
    parts = re.split(r'; (?=[A-Z`*])', content)
    if len(parts) > 1:
        result = [indent + bullet + parts[0].rstrip() + ';']
        for p in parts[1:-1]:
            result.append(indent + '  - ' + p.rstrip() + ';')
        result.append(indent + '  - ' + parts[-1].rstrip())
        if all(len(r.rstrip()) <= THRESHOLD for r in result):
            return result

    # Try splitting at '. ' boundaries (sentence end)
    parts = re.split(r'\. (?=[A-Z`*])', content)
    if len(parts) > 1:
        result = [indent + bullet + parts[0].rstrip() + '.']
        for p in parts[1:-1]:
            result.append(indent + '  - ' + p.rstrip() + '.')
        result.append(indent + '  - ' + parts[-1].rstrip())
        if all(len(r.rstrip()) <= THRESHOLD for r in result):
            return result

    # Try splitting at '**...**' bold markers (new sub-topic)
    parts = re.split(r'(?=\*\*)', content)
    if len(parts) > 1:
        # First part is the intro, rest are bold-led sub-bullets
        intro = parts[0].rstrip()
        if len(intro) > 10:  # meaningful intro
            result = [indent + bullet + intro]
            for p in parts[1:]:
                p = p.rstrip()
                if p:
                    result.append(indent + '  - ' + p)
            if all(len(r.rstrip()) <= THRESHOLD for r in result):
                return result

    # Try splitting at ', ' before a backtick-quoted token (new item)
    parts = re.split(r', (?=`)', content)
    if len(parts) > 1:
        result = [indent + bullet + parts[0].rstrip() + ',']
        for p in parts[1:-1]:
            result.append(indent + '  - ' + p.rstrip() + ',')
        result.append(indent + '  - ' + parts[-1].rstrip())
        if all(len(r.rstrip()) <= THRESHOLD for r in result):
            return result

    # Couldn't find a good split point
    return [line]


def main():
    if len(sys.argv) < 2:
        print("Usage: split_bullets.py <file.md>", file=sys.stderr)
        return 1

    path = Path(sys.argv[1])
    lines = path.read_text(encoding='utf-8').splitlines(keepends=True)

    new_lines: list[str] = []
    split_count = 0
    remaining = 0

    for line in lines:
        stripped = line.rstrip('\n')
        is_bullet = stripped.lstrip().startswith('- ') or '  - ' in stripped[:10]
        if is_bullet and len(stripped) > THRESHOLD:
            split = split_bullet(stripped)
            if len(split) > 1:
                new_lines.extend(s + '\n' for s in split)
                split_count += 1
            else:
                new_lines.append(line)
                remaining += 1
        else:
            new_lines.append(line)

    path.write_text(''.join(new_lines), encoding='utf-8')
    print(f"Split {split_count} overlong bullets. {remaining} remain (no natural break point found).")
    return 0 if remaining == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
