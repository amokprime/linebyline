"""
LineByLine – lrc.py
Pure logic: LRC timestamp parsing, paste/metadata cleaning, Genius extraction,
sync and timestamp adjustment operations.
No Qt imports; no reference to UI state.
All functions take plain strings/ints and return plain strings/ints.
"""

import re
from typing import Optional

# ── Regex constants ───────────────────────────────────────────────────────────

TS_RE   = re.compile(r"^\[(\d{2}):(\d{2})\.(\d{2})\]")
META_RE = re.compile(r"^\[[a-zA-Z]+:")

# ── Timestamp utilities ───────────────────────────────────────────────────────

def ts_to_ms(line: str) -> Optional[int]:
    """Return timestamp in milliseconds for *line*, or None if no timestamp."""
    m = TS_RE.match(line)
    if not m:
        return None
    return int(m.group(1)) * 60_000 + int(m.group(2)) * 1_000 + int(m.group(3)) * 10


def ms_to_ts(ms: int) -> str:
    """Convert *ms* to LRC timestamp string ``[mm:ss.cc]``."""
    ms = max(0, ms)
    minutes = ms // 60_000
    seconds = (ms % 60_000) // 1_000
    centis  = (ms % 1_000) // 10
    return f"[{minutes:02d}:{seconds:02d}.{centis:02d}]"


def is_end_ts(line: str) -> bool:
    """True if *line* is a bare timestamp with no lyric content (trailing marker)."""
    return bool(TS_RE.match(line)) and TS_RE.sub("", line).strip() == ""


def is_header(line: str) -> bool:
    """True if *line* looks like a Genius section header, e.g. ``[Chorus]``."""
    return (
        line.startswith("[")
        and not META_RE.match(line)
        and not TS_RE.match(line)
    )


def replace_ts(line: str, ms: int) -> str:
    """Replace or prepend a timestamp on *line* with one for *ms*."""
    if TS_RE.match(line):
        return ms_to_ts(ms) + line[10:]
    return ms_to_ts(ms) + " " + line


def strip_sec_line(line: str) -> str:
    """Strip timestamp and leading space from a secondary-field line."""
    return TS_RE.sub("", line).lstrip(" ")


# ── Paste / metadata cleaning ─────────────────────────────────────────────────

def clean_paste(text: str, context: str, cfg: dict) -> str:
    """
    Strip metadata and/or section headers from *text* according to *cfg*.
    *context* is ``'paste'`` or ``'lrc'``.
    """
    is_paste = context == "paste"
    strip_meta = (cfg["strip_on_paste"] if is_paste else cfg["strip_on_lrc"]) and cfg["strip_metadata"]
    strip_sec  = (cfg["strip_on_paste"] if is_paste else cfg["strip_on_lrc"]) and cfg["strip_sections"]
    lines = text.split("\n")
    if strip_meta:
        lines = [l for l in lines if not META_RE.match(l)]
    if strip_sec:
        lines = [l for l in lines if not is_header(l)]
    return "\n".join(lines)


def ensure_linebyline_in_re(text: str) -> str:
    """Append ', LineByLine' to the ``[re:]`` tag if not already present."""
    def _fix(m: re.Match) -> str:
        pre, val, post = m.group(1), m.group(2), m.group(3)
        if re.search("LineByLine", val, re.IGNORECASE):
            return m.group(0)
        return pre + (val.strip() + ", LineByLine" if val.strip() else "LineByLine") + post

    return re.sub(r"^(\[re:\s*)(.*?)(\]\s*)$", _fix, text, flags=re.MULTILINE)


def merge_lrc_meta(lrc_text: str, cfg: dict) -> str:
    """
    Merge metadata from *lrc_text* into the default meta template.
    LRC values override defaults; extra LRC fields are appended.
    """
    default_lines = cfg["default_meta"].split("\n")
    lrc_lines     = lrc_text.split("\n")

    # Parse LRC metadata
    lrc_meta: dict[str, str] = {}
    for l in lrc_lines:
        m = re.match(r"^\[([a-zA-Z]+):\s*(.*)\]$", l)
        if m:
            lrc_meta[m.group(1).lower()] = m.group(2).strip()

    # Overlay onto defaults
    merged: list[str] = []
    for l in default_lines:
        m = re.match(r"^\[([a-zA-Z]+):\s*(.*)\]$", l)
        if not m:
            merged.append(l)
            continue
        key = m.group(1).lower()
        val = lrc_meta.get(key)
        if val:
            merged.append(f"[{m.group(1)}: {val}]")
        else:
            merged.append(l)

    # Append extra fields from LRC not in defaults
    default_keys = set()
    for l in default_lines:
        m = re.match(r"^\[([a-zA-Z]+):", l)
        if m:
            default_keys.add(m.group(1).lower())

    extra: list[str] = []
    for l in lrc_lines:
        m = re.match(r"^\[([a-zA-Z]+):\s*(.*)\]$", l)
        if m and m.group(1).lower() not in default_keys:
            extra.append(l)

    if extra:
        last_meta = -1
        for i, l in enumerate(merged):
            if re.match(r"^\[[a-zA-Z]+:", l):
                last_meta = i
        for j, e in enumerate(extra):
            merged.insert(last_meta + 1 + j, e)

    result = "\n".join(x for x in merged if x is not None)
    return ensure_linebyline_in_re(result)


# ── Genius extraction ─────────────────────────────────────────────────────────

def clean_genius(text: str, cfg: dict) -> Optional[str]:
    """
    Detect and extract clean lyrics from a raw Genius page paste.
    Returns cleaned lyric text, or None if the input doesn't look like Genius.
    """
    lines = text.split("\n")

    has_lyrics_heading = any(re.search(r"Lyrics$", l.strip()) for l in lines)
    has_genius         = any(re.search(r"Genius\.com|genius\.com|ML Genius|Genius is the", l) for l in lines)
    has_read_more      = any(re.search(r"Read More\s*$", l.strip()) for l in lines)

    if not (has_lyrics_heading or has_genius or has_read_more):
        return None

    # Find start
    start = -1
    for i, l in enumerate(lines):
        if re.search(r"Read More\s*$", l.strip()):
            start = i + 1
            break
    if start < 0:
        for i, l in enumerate(lines):
            if re.match(r"^\[[^\]]+\]", l.strip()) and not META_RE.match(l):
                start = i
                break
    if start < 0:
        return None

    # Find end
    end = len(lines)
    for i in range(start, len(lines)):
        t = lines[i].strip()
        if t in ("About", "Song Bio", "Sign Up And Drop Knowledge 🤓"):
            end = i
            break
        if re.match(r"^© \d{4}", t):
            end = i
            break
        if t == "Credits" and i > start + 5:
            end = i
            break

    lyric_lines = lines[start:end]

    # Strip "You might also like" blocks
    pre_filtered: list[str] = []
    in_ymal = False
    for l in lyric_lines:
        t = l.strip()
        if t == "You might also like":
            if pre_filtered and pre_filtered[-1].strip():
                pre_filtered.append("")
            in_ymal = True
            continue
        if in_ymal:
            if t == "" or (re.match(r"^\[[^\]]+\]$", t) and not TS_RE.match(t)):
                in_ymal = False
            else:
                continue
        pre_filtered.append(l)

    lyric_lines = pre_filtered

    # Filter section headers
    lyric_lines = [
        l for l in lyric_lines
        if not (re.match(r"^\[[^\]]+\]$", l.strip()) and not TS_RE.match(l))
        and not (re.match(r"^\[.{2,50}\]$", l.strip()) and not TS_RE.match(l))
    ]

    # Collapse multiple blank lines
    result: list[str] = []
    blanks = 0
    for l in lyric_lines:
        if l.strip() == "":
            blanks += 1
            if blanks <= 1:
                result.append(l)
        else:
            blanks = 0
            result.append(l)

    out = "\n".join(result).strip()
    if not out:
        return None
    return clean_paste(out, "paste", cfg)


def extract_genius_meta(raw: str) -> tuple[str, str, str]:
    """
    Parse title, artist, album from a raw Genius page paste.
    Returns (title, artist, album) — any may be empty string.
    """
    lines = [l.strip() for l in raw.split("\n") if l.strip()]
    head  = lines[:40]
    title = artist = album = ""

    for i, l in enumerate(head):
        m = re.match(r"^Cover art for .+ by (.+)$", l, re.IGNORECASE)
        if m:
            artist = m.group(1).strip()
            break

    for i, l in enumerate(head):
        if re.search(r"\s+Lyrics$", l):
            title = re.sub(r"\s+Lyrics$", "", l).strip()
            if not artist:
                for j in range(i + 1, min(i + 5, len(head))):
                    if re.match(r"^Producer$", head[j], re.IGNORECASE):
                        break
                    if head[j] and len(head[j]) < 60:
                        artist = head[j]
                        break
            break

    for i in range(len(head) - 1):
        if re.match(r"^Track\s+\d+\s+(on|[-–])", head[i], re.IGNORECASE):
            album = head[i + 1].strip()
            break

    return title, artist, album


def apply_genius_meta(text: str, title: str, artist: str, album: str) -> str:
    """
    Set ``[ti:]``, ``[ar:]``, ``[al:]`` in *text* only when the current
    value is blank or 'Unknown'.
    """
    def _replace_if_default(t: str, tag: str, val: str) -> str:
        if not val:
            return t
        def _sub(m: re.Match) -> str:
            cur = m.group(1).strip()
            if cur == "" or cur.lower() == "unknown":
                return f"[{tag}: {val}]"
            return m.group(0)
        return re.sub(rf"^\[{tag}:\s*(.*)\]", _sub, t, flags=re.MULTILINE)

    text = _replace_if_default(text, "ti", title)
    text = _replace_if_default(text, "ar", artist)
    text = _replace_if_default(text, "al", album)
    return text


def mark_genius_source(text: str) -> str:
    """Set ``[re:]`` to 'Genius, LineByLine' in *text*."""
    updated = re.sub(r"^\[re:.*\]", "[re: Genius, LineByLine]", text, flags=re.MULTILINE)
    return ensure_linebyline_in_re(updated)


# ── Lyric line helpers ────────────────────────────────────────────────────────

def get_main_lyric_lines(text: str) -> list[str]:
    """Return non-empty, non-meta, non-trailing-ts lines (used for line count)."""
    return [l for l in text.split("\n") if l.strip() and not META_RE.match(l) and not is_end_ts(l)]


def has_trailing_timestamp(text: str) -> bool:
    """True if the last non-empty non-meta line is a bare end timestamp."""
    for l in reversed(text.split("\n")):
        if l.strip() == "" or META_RE.match(l):
            continue
        return is_end_ts(l)
    return False


def first_lyric_index(lines: list[str]) -> int:
    """Index of first non-meta non-empty line, or -1."""
    for i, l in enumerate(lines):
        if not META_RE.match(l) and l.strip():
            return i
    return -1


def last_lyric_index(lines: list[str]) -> int:
    """Index of last non-meta non-empty line, or -1."""
    for i in range(len(lines) - 1, -1, -1):
        if not META_RE.match(lines[i]) and lines[i].strip():
            return i
    return -1


# ── Sync operations (pure text transforms) ───────────────────────────────────

def sync_line(text: str, active: int, current_ms: int) -> str:
    """Stamp *active* line with *current_ms*. Returns updated text."""
    lines = text.split("\n")
    if 0 <= active < len(lines):
        lines[active] = replace_ts(lines[active], current_ms)
    return "\n".join(lines)


def insert_end_line(text: str, after: int, current_ms: int) -> tuple[str, int]:
    """Insert a bare timestamp line after *after*. Returns (new_text, new_active)."""
    lines = text.split("\n")
    idx = after + 1 if after >= 0 else len(lines)
    lines.insert(idx, ms_to_ts(current_ms))
    return "\n".join(lines), idx


def adjust_ts(text: str, targets: list[int], delta_ms: int) -> tuple[str, bool]:
    """
    Shift timestamps of all lines in *targets* by *delta_ms*.
    Returns (new_text, changed).
    """
    lines = text.split("\n")
    changed = False
    for i in targets:
        if 0 <= i < len(lines):
            ms = ts_to_ms(lines[i])
            if ms is not None:
                lines[i] = replace_ts(lines[i], ms + delta_ms)
                changed = True
    return "\n".join(lines), changed


def sync_file(text: str, offset_ms: int) -> str:
    """Shift every timestamp in *text* by *offset_ms*."""
    lines = text.split("\n")
    return "\n".join(
        replace_ts(l, ts_to_ms(l) + offset_ms) if ts_to_ms(l) is not None else l
        for l in lines
    )


def mark_as_translation(
    text: str,
    target_line: int,
    use_parens: bool,
) -> tuple[str, bool]:
    """
    Offset *target_line* to 10ms before the next timestamp and optionally
    wrap its content in parentheses.
    Returns (new_text, changed).
    """
    lines = text.split("\n")
    if target_line < 0 or target_line >= len(lines):
        return text, False
    if META_RE.match(lines[target_line]):
        return text, False

    next_ms = None
    for j in range(target_line + 1, len(lines)):
        ms = ts_to_ms(lines[j])
        if ms is not None:
            next_ms = ms
            break
    if next_ms is None:
        return text, False

    offset_ms = next_ms - 10
    content = (
        TS_RE.sub("", lines[target_line]).lstrip(" ")
        if TS_RE.match(lines[target_line])
        else lines[target_line]
    )
    if use_parens and content.strip() and not content.strip().startswith("("):
        content = f"({content.strip()})"
    lines[target_line] = ms_to_ts(offset_ms) + (" " + content if content else "")
    return "\n".join(lines), True


def merge_translations(
    text: str,
    secondary_line_lists: list[list[str]],
) -> Optional[str]:
    """
    Interleave secondary lyric lines into *text* at 10ms offsets before each
    next timestamp.  Returns merged text, or None if preconditions fail.
    """
    main_lines = text.split("\n")
    ts_lines = [(i, ts_to_ms(l)) for i, l in enumerate(main_lines) if ts_to_ms(l) is not None]
    if not ts_lines:
        return None

    sec_data = [lines for lines in secondary_line_lists if lines]
    if not sec_data:
        return None

    content_ts = [(i, ms) for i, ms in ts_lines if not is_end_ts(main_lines[i])]
    result = list(main_lines)

    # Work backwards to preserve indices
    for ci in range(len(content_ts) - 1, -1, -1):
        line_idx, _ = content_ts[ci]
        next_ms = None
        for i, ms in ts_lines:
            if i > line_idx:
                next_ms = ms
                break
        if next_ms is None:
            continue

        ins: list[str] = []
        for sec_lines in sec_data:
            if ci < len(sec_lines):
                ins.append(sec_lines[ci])

        n = len(ins)
        for j, t in enumerate(ins):
            offset = ms_to_ts(next_ms - (n - j) * 10)
            result.insert(line_idx + 1 + j, f"{offset} {t}")

    return "\n".join(result)


# ── Title extraction ──────────────────────────────────────────────────────────

def extract_title_artist(text: str) -> tuple[str, str]:
    """Return (title, artist) from LRC metadata in *text*, or empty strings."""
    ti_m = re.search(r"^\[ti:\s*(.+)\]", text, re.MULTILINE)
    ar_m = re.search(r"^\[ar:\s*(.+)\]", text, re.MULTILINE)
    title  = ti_m.group(1).strip() if ti_m else ""
    artist = ar_m.group(1).strip() if ar_m else ""
    return title, artist


def set_title_in_text(text: str, stem: str) -> str:
    """
    Set ``[ti:]`` to *stem* only if the current value is blank or 'Unknown'.
    """
    def _sub(m: re.Match) -> str:
        cur = m.group(1).strip()
        if cur == "" or cur.lower() == "unknown":
            return f"[ti: {stem}]"
        return m.group(0)
    return re.sub(r"^\[ti:\s*(.*)\]", _sub, text, flags=re.MULTILINE)


def collapse_blank_lines(text: str, max_consecutive: int = 1) -> str:
    """Reduce runs of blank lines to at most *max_consecutive*."""
    lines = text.split("\n")
    result: list[str] = []
    blanks = 0
    for l in lines:
        if l.strip() == "":
            blanks += 1
            if blanks <= max_consecutive:
                result.append(l)
        else:
            blanks = 0
            result.append(l)
    return "\n".join(result)
