"""
LineByLine – config.py
Pure data: default settings, hotkey section/label maps, restriction rules.
No imports from other LBL modules; no Qt imports.
"""

import re
import copy

# ── Default metadata template ─────────────────────────────────────────────────

DEFAULT_META = "[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: LineByLine]\n"

# ── Default config ────────────────────────────────────────────────────────────

DEFAULT_CFG: dict = {
    # Timestamp adjustment intervals (ms)
    "tiny_ms": 100,
    "small_ms": 200,
    "medium_ms": 400,
    "large_ms": 1000,
    # Seek
    "seek_offset": -600,
    "seek_offset_tick": 1000,
    "seek_increment_s": 5,
    # Auto-strip on import/paste
    "strip_metadata": False,
    "strip_sections": True,
    "strip_on_lrc": False,
    "strip_on_paste": True,
    "default_meta": DEFAULT_META,
    # Instant-replay triggers
    "replay_prev_line": False,
    "replay_next_line": False,
    "replay_resume_current": False,
    "replay_play_other": False,
    "replay_after_offset": False,
    "replay_after_sync": False,
    "replay_after_ts": False,
    # Undo
    "undo_debounce_ms": 150,
    # Playback
    "speed_ratio": 1.10,
    "vol_increment": 0.1,
    # Hotkeys: action_key -> key string (Qt-style, e.g. "Ctrl+O", "Space", "Alt+A")
    "hotkeys": {
        "toggle_mode":        "Tab",
        "play_pause":         "Space",
        "play_pause_alt":     "Ctrl+Space",
        "sync":               "W",
        "end_line":           "T",
        "prev_line":          "Q",
        "next_line":          "E",
        "ts_back_tiny":       "Z",
        "ts_fwd_tiny":        "V",
        "ts_back_small":      "A",
        "ts_fwd_small":       "F",
        "ts_back_medium":     "S",
        "ts_fwd_medium":      "D",
        "ts_back_large":      "X",
        "ts_fwd_large":       "C",
        "clear_sel":          "Escape",
        "offset_mode_toggle": "`",
        "sync_file":          "Ctrl+`",
        "add_field":          "Ctrl+4",
        "remove_field":       "Ctrl+5",
        "merge_fields":       "Ctrl+6",
        "replay_line":        "Enter",
        "replay_only":        "R",
        "replay_end":         "Shift+R",
        "open":               "Ctrl+O",
        "settings":           "Ctrl+,",
        "undo":               "Ctrl+Z",
        "redo":               "Ctrl+Y",
        "speed_down":         "Ctrl+1",
        "speed_up":           "Ctrl+2",
        "speed_reset":        "Ctrl+3",
        "seek_back":          "Ctrl+A",
        "seek_fwd":           "Ctrl+D",
        "save":               "Ctrl+;",
        "help":               "Ctrl+/",
        "theme_toggle":       "Ctrl+.",
        "mark_translation":   "Ctrl+Left",
    },
}

# ── Hotkey Settings panel groupings ──────────────────────────────────────────

HK_SECTIONS: list[dict] = [
    {"label": "Menu",        "keys": ["open", "save", "theme_toggle", "settings", "help", "undo", "redo"]},
    {"label": "Playback",    "keys": ["play_pause", "play_pause_alt", "speed_down", "speed_up", "speed_reset", "seek_back", "seek_fwd"]},
    {"label": "Sync",        "keys": ["offset_mode_toggle", "sync_file", "sync", "end_line", "prev_line", "next_line", "replay_only", "replay_end"]},
    {"label": "Adjustments", "keys": ["ts_back_tiny", "ts_fwd_tiny", "ts_back_small", "ts_fwd_small", "ts_back_medium", "ts_fwd_medium", "ts_back_large", "ts_fwd_large"]},
    {"label": "Text",        "keys": ["toggle_mode", "add_field", "remove_field", "merge_fields", "mark_translation"]},
]

HK_LABELS: dict[str, str] = {
    "toggle_mode":        "Toggle mode",
    "play_pause":         "Play/pause",
    "play_pause_alt":     "Play/pause (alternate)",
    "sync":               "Sync line start",
    "end_line":           "Sync line end",
    "prev_line":          "Previous line",
    "next_line":          "Next line",
    "replay_only":        "Replay only",
    "replay_end":         "Replay end",
    "ts_back_tiny":       "Back tiny amount",
    "ts_fwd_tiny":        "Forward tiny amount",
    "ts_back_small":      "Back small amount",
    "ts_fwd_small":       "Forward small amount",
    "ts_back_medium":     "Back medium amount",
    "ts_fwd_medium":      "Forward medium amount",
    "ts_back_large":      "Back large amount",
    "ts_fwd_large":       "Forward large amount",
    "offset_mode_toggle": "Toggle offset mode",
    "sync_file":          "Sync file",
    "add_field":          "Add field",
    "remove_field":       "Hide field",
    "merge_fields":       "Merge fields",
    "open":               "Open",
    "save":               "Save",
    "help":               "Help",
    "theme_toggle":       "Toggle theme",
    "settings":           "Settings",
    "undo":               "Undo",
    "redo":               "Redo",
    "speed_down":         "Reduce speed",
    "speed_up":           "Increase speed",
    "speed_reset":        "Reset speed",
    "seek_back":          "Seek back",
    "seek_fwd":           "Seek forward",
    "mark_translation":   "Mark line as translation",
}

# ── Hotkey restriction rules ──────────────────────────────────────────────────
# Compared to the HTML version the browser-specific blocks are removed entirely.
# What remains: OS-level keys that can't be intercepted reliably cross-platform.

RESTRICTED_ALL: frozenset[str] = frozenset([
    # OS / window manager (Windows + KDE Wayland)
    "Alt+F4",           # close window – both platforms
    "Alt+Tab",          # task switcher – both platforms
    "Alt+Shift+Tab",    # reverse task switcher
    "Meta",             # bare Win/Super key
    # Modifier-only strokes (no actual key)
    "Ctrl", "Shift", "Alt",
    # Keys we reserve internally and never allow remapping away
    "Escape",           # always cancels/closes overlays
])

# Keys not allowed for toggle_mode and offset_mode_toggle (need non-alphanum
# so they don't collide with typing in lyric lines).
_ALPHA_NUM_SPACE_RE = re.compile(r"^(([A-Z]|[0-9]|Space)$|Shift\+[A-Z0-9]$)")

# Actions whose defaults are hard-pinned (remapping them elsewhere is allowed,
# but the *new* owner of that combo must not break these meanings).
_PINNED: dict[str, str] = {
    "Ctrl+;":    "save",
    "Ctrl+O":    "open",
    "Ctrl+,":    "settings",
    "Ctrl+.":    "theme_toggle",
    "Ctrl+/":    "help",
    "Ctrl+Left": "mark_translation",
}


def is_restricted_for_all(ks: str) -> str | None:
    """Return an error message if *ks* is globally blocked, else None."""
    if ks in RESTRICTED_ALL:
        return f'"{ks}" is reserved by the OS or this app'
    return None


def is_restricted_for_key(ks: str, action: str) -> str | None:
    """Return an error message if *ks* is blocked for *action*, else None."""
    msg = is_restricted_for_all(ks)
    if msg:
        return msg
    pinned_owner = _PINNED.get(ks)
    if pinned_owner and pinned_owner != action:
        label = HK_LABELS.get(pinned_owner, pinned_owner)
        return f'"{ks}" is reserved for {label}'
    if action in ("toggle_mode", "offset_mode_toggle") and _ALPHA_NUM_SPACE_RE.match(ks):
        return "Letters, numbers, and Space are not allowed for this action"
    return None


# ── Config load / save helpers ────────────────────────────────────────────────

def _deep_defaults(base: dict, defaults: dict) -> dict:
    """Recursively fill missing keys in *base* from *defaults*."""
    result = copy.deepcopy(defaults)
    for k, v in base.items():
        if k == "hotkeys" and isinstance(v, dict):
            result["hotkeys"].update(v)
        else:
            result[k] = v
    return result


def migrate_cfg(raw: dict) -> dict:
    """Apply forward-migrations from old saved configs."""
    cfg = _deep_defaults(raw, DEFAULT_CFG)
    hk = cfg["hotkeys"]

    # Key renames from HTML era
    _renames = {
        "seek_back":     ("Alt+Q",  "Ctrl+A"),
        "seek_fwd":      ("Alt+W",  "Ctrl+D"),
        "save":          ("Ctrl+S", "Ctrl+;"),
        "settings":      ("Alt+`",  "Ctrl+,"),
        "help":          ("F2",     "Ctrl+/"),
        "speed_down":    ("Alt+1",  "Ctrl+1"),
        "speed_up":      ("Alt+2",  "Ctrl+2"),
        "speed_reset":   ("Alt+3",  "Ctrl+3"),
        "add_field":     ("Ctrl+1", "Ctrl+4"),
        "remove_field":  ("Ctrl+2", "Ctrl+5"),
        "merge_fields":  ("Ctrl+3", "Ctrl+6"),
        # HTML used "Ctrl+ArrowLeft"; Qt uses "Ctrl+Left"
        "mark_translation": ("Ctrl+ArrowLeft", "Ctrl+Left"),
    }
    for action, (old, new) in _renames.items():
        if hk.get(action) == old:
            hk[action] = new

    # Remove deprecated keys
    hk.pop("mute", None)

    return cfg
