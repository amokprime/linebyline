"""
LineByLine – hotkeys.py
Maps configured key strings to action names and emits them as signals.
Uses QShortcut for global-window shortcuts; rebuilds when cfg changes.
"""

from PySide6.QtCore import QObject, Signal
from PySide6.QtGui import QKeySequence, QShortcut
from PySide6.QtWidgets import QWidget

from config import DEFAULT_CFG


class HotkeyManager(QObject):
    """
    Owns all QShortcut objects for the main window.
    Emits action_triggered(str) when a shortcut fires.
    Call rebuild() after cfg["hotkeys"] changes.
    """

    action_triggered = Signal(str)   # action key string, e.g. "play_pause"

    def __init__(self, cfg: dict, state, parent: QWidget) -> None:
        super().__init__(parent)
        self.cfg   = cfg
        self.state = state
        self._window = parent          # QWidget that owns the shortcuts
        self._shortcuts: dict[str, QShortcut] = {}   # action -> shortcut
        self.rebuild()

    # ── Public ────────────────────────────────────────────────────────────────

    def rebuild(self) -> None:
        """Delete existing shortcuts and recreate from current cfg["hotkeys"]."""
        for sc in self._shortcuts.values():
            sc.setEnabled(False)
            sc.deleteLater()
        self._shortcuts.clear()

        hk = self.cfg.get("hotkeys", {})
        for action, key_str in hk.items():
            if not key_str:
                continue
            self._add(action, key_str)

        # Hard-coded Ctrl+M (mute) — not in cfg
        self._add("_mute", "Ctrl+M")

    # ── Internal ─────────────────────────────────────────────────────────────

    def _add(self, action: str, key_str: str) -> None:
        qt_seq = _to_qt_sequence(key_str)
        if not qt_seq:
            return
        sc = QShortcut(QKeySequence(qt_seq), self._window)
        sc.setContext(Qt.ShortcutContext.ApplicationShortcut)
        # Capture action in closure
        sc.activated.connect(lambda a=action: self._fire(a))
        self._shortcuts[action] = sc

    def _fire(self, action: str) -> None:
        # Typing-mode actions that should not fire from global shortcut
        # when focus is in a text field — let the text field handle them.
        # (play_pause_alt = Ctrl+Space is fine anywhere)
        from config import DEFAULT_CFG  # avoid circular at module level
        HOTKEY_ONLY = {
            "play_pause", "sync", "end_line", "prev_line", "next_line",
            "replay_only", "replay_line", "replay_end",
            "ts_back_tiny", "ts_fwd_tiny", "ts_back_small", "ts_fwd_small",
            "ts_back_medium", "ts_fwd_medium", "ts_back_large", "ts_fwd_large",
            "clear_sel", "offset_mode_toggle",
        }
        if action in HOTKEY_ONLY and not self.state.hotkey_mode:
            return
        self.action_triggered.emit(action)


# ── Key string conversion ─────────────────────────────────────────────────────

# Map from LBL key names → Qt key names (where they differ)
_KEY_MAP: dict[str, str] = {
    "Space":      "Space",
    "Escape":     "Escape",
    "Tab":        "Tab",
    "Enter":      "Return",
    "ArrowUp":    "Up",
    "ArrowDown":  "Down",
    "ArrowLeft":  "Left",
    "ArrowRight": "Right",
    "`":          "`",
    ",":          ",",
    ".":          ".",
    ";":          ";",
    "/":          "/",
}

# Qt shortcut context import
try:
    from PySide6.QtCore import Qt
except ImportError:
    pass


def _to_qt_sequence(key_str: str) -> str:
    """
    Convert an LBL key string (e.g. ``'Ctrl+ArrowLeft'``, ``'Shift+R'``,
    ``'Space'``) to a Qt key-sequence string (e.g. ``'Ctrl+Left'``).
    Returns empty string if conversion fails.
    """
    if not key_str:
        return ""
    parts = key_str.split("+")
    # Last part is the actual key; leading parts are modifiers
    key   = parts[-1]
    mods  = parts[:-1]

    # Translate known mappings
    qt_key = _KEY_MAP.get(key, key)

    result = "+".join(mods + [qt_key])
    # Validate by trying to construct a QKeySequence
    try:
        qs = QKeySequence(result)
        if qs.isEmpty():
            return ""
        return result
    except Exception:
        return ""
