"""
LineByLine – state.py
Single mutable runtime state object.  Passed by reference into every module
that needs to read or write app state.  No Qt imports; no business logic.
"""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class AppState:
    # ── Mode flags ────────────────────────────────────────────────────────────
    hotkey_mode: bool        = True   # False = Typing mode
    offset_seek_mode: bool   = False  # True = Controls adjust seek offset

    # ── Playback ──────────────────────────────────────────────────────────────
    playing: bool            = False
    current_speed: float     = 1.0
    master_volume: float     = 1.0
    master_muted: bool       = False
    last_playing_line: int   = -1

    # ── Editor ────────────────────────────────────────────────────────────────
    active_line: int         = -1
    selected_lines: set      = field(default_factory=set)
    suppress_auto_line: bool = False
    merge_done: bool         = False

    # ── Session ───────────────────────────────────────────────────────────────
    last_import_stem: str    = ""
    saved_audio_path: Optional[str] = None
    genius_detected: bool    = False

    # ── Undo ──────────────────────────────────────────────────────────────────
    # Each snapshot: {"main": str, "secondaries": list[str], "merge_done": bool}
    undo_stack: list         = field(default_factory=list)
    redo_stack: list         = field(default_factory=list)

    def take_snapshot(self, main_text: str, secondary_texts: list[str]) -> dict:
        return {
            "main":        main_text,
            "secondaries": list(secondary_texts),
            "merge_done":  self.merge_done,
        }

    def push_snapshot(self, main_text: str, secondary_texts: list[str]) -> None:
        snap = self.take_snapshot(main_text, secondary_texts)
        self.undo_stack.append(snap)
        if len(self.undo_stack) > 100:
            self.undo_stack.pop(0)
        self.redo_stack.clear()

    def undo(self) -> Optional[dict]:
        """Pop top, push to redo, return new top (the state to restore), or None."""
        if len(self.undo_stack) < 2:
            return None
        self.redo_stack.append(self.undo_stack.pop())
        return self.undo_stack[-1]

    def redo(self) -> Optional[dict]:
        """Pop from redo, push to undo, return snapshot to restore, or None."""
        if not self.redo_stack:
            return None
        snap = self.redo_stack.pop()
        self.undo_stack.append(snap)
        return snap
