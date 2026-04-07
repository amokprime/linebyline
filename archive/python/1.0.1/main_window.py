"""
LineByLine – main_window.py
Top-level window.  Owns AppState and cfg; assembles panels; routes all signals.
"""

import re
from PySide6.QtWidgets import (
    QMainWindow, QWidget, QHBoxLayout, QSplitter,
    QToolBar, QMessageBox, QFileDialog,
)
from PySide6.QtCore import Qt, QTimer, QByteArray
from PySide6.QtGui import QKeySequence, QAction

from config import DEFAULT_CFG
from state import AppState
from persistence import load_cfg, save_cfg, load_session, save_session, clear_session

from controls_panel  import ControlsPanel
from editor_panel    import EditorPanel
from settings_dialog import SettingsDialog
from help_dialog     import HelpDialog
from hotkeys         import HotkeyManager
from audio_player    import AudioPlayer
from import_export   import ImportExport

from lrc import (
    ts_to_ms, sync_line, insert_end_line, adjust_ts, sync_file,
    mark_as_translation, merge_translations, get_main_lyric_lines,
    has_trailing_timestamp, first_lyric_index, last_lyric_index,
    extract_title_artist, set_title_in_text,
    apply_genius_meta, extract_genius_meta, mark_genius_source,
    META_RE,
)


class MainWindow(QMainWindow):
    def __init__(self) -> None:
        super().__init__()
        self.setWindowTitle("LineByLine")
        self.resize(1200, 700)

        self.cfg   = load_cfg()
        self.state = AppState(
            master_volume=self.cfg.get("vol", 1.0),
            master_muted=self.cfg.get("muted", False),
        )

        self._autosave_timer = QTimer(self)
        self._autosave_timer.setSingleShot(True)
        self._autosave_timer.timeout.connect(self._autosave)

        self._build_ui()
        self._connect_signals()
        self._restore_session()

    # ── UI assembly ───────────────────────────────────────────────────────────

    def _build_ui(self) -> None:
        # ── Toolbar ───────────────────────────────────────────────────────────
        tb = QToolBar()
        tb.setMovable(False)
        tb.setToolButtonStyle(Qt.ToolButtonStyle.ToolButtonTextOnly)
        self.addToolBar(tb)

        def _act(label: str, tip: str, slot) -> QAction:
            a = QAction(label, self)
            a.setToolTip(tip)
            a.triggered.connect(slot)
            return a

        self._act_open     = _act("📂", "Open",             self._do_import)
        self._act_save     = _act("💾", "Save",             self._do_save)
        self._act_reset    = _act("🗑", "Reset (clear song and lyrics)", self._do_reset)
        self._act_undo     = _act("↩", "Undo",             self._do_undo)
        self._act_redo     = _act("↪", "Redo",             self._do_redo)
        self._act_addsec   = _act("Add field",   "Add secondary field",        self._do_add_sec)
        self._act_rmsec    = _act("Hide field",  "Hide last secondary field",   self._do_rm_sec)
        self._act_merge    = _act("Merge fields","Merge fields",                self._do_merge)
        self._act_settings = _act("⚙️", "Settings",         self._open_settings)
        self._act_theme    = _act("🌗", "Toggle theme",     self._toggle_theme)
        self._act_help     = _act("?",  "Help",             self._open_help)

        for a in (self._act_open, self._act_save, self._act_reset, None,
                  self._act_undo, self._act_redo, None,
                  self._act_addsec, self._act_rmsec, self._act_merge, None,
                  self._act_settings, self._act_theme, self._act_help):
            if a is None:
                tb.addSeparator()
            else:
                tb.addAction(a)

        self._act_rmsec.setEnabled(False)
        self._act_merge.setEnabled(False)

        # ── Splitter ──────────────────────────────────────────────────────────
        splitter = QSplitter(Qt.Orientation.Horizontal)

        self.controls = ControlsPanel(self.cfg, self.state, parent=self)
        self.editor   = EditorPanel(self.cfg, self.state, parent=self)

        splitter.addWidget(self.controls)
        splitter.addWidget(self.editor)
        splitter.setStretchFactor(0, 0)
        splitter.setStretchFactor(1, 1)
        splitter.setSizes([310, 900])
        self.setCentralWidget(splitter)

        # ── Dialogs ───────────────────────────────────────────────────────────
        self.settings_dialog = SettingsDialog(self.cfg, self.state, parent=self)
        self.settings_dialog.settings_changed.connect(self._on_settings_changed)
        self.help_dialog     = HelpDialog(parent=self)

        # ── Subsystems ────────────────────────────────────────────────────────
        self.audio   = AudioPlayer(self.cfg, self.state, parent=self)
        self.audio.set_text_supplier(self.editor.get_main_text)

        self.hk_mgr  = HotkeyManager(self.cfg, self.state, parent=self)
        self.io      = ImportExport(self.cfg, self.state, parent=self)

    # ── Signal wiring ─────────────────────────────────────────────────────────

    def _connect_signals(self) -> None:
        # Audio → controls
        self.audio.position_changed.connect(self.controls.update_position)
        self.audio.playing_changed.connect(self.controls.update_playing)
        self.audio.playing_changed.connect(lambda _: self.controls.rebuild_hk_grid())
        self.audio.title_ready.connect(self._on_audio_title_ready)
        self.audio.active_line_changed.connect(self._on_active_line_changed)

        # Controls → audio / state
        self.controls.action_triggered.connect(self._dispatch_action)
        self.controls.seek_offset_changed.connect(self._on_seek_offset_changed)
        self.controls.speed_changed.connect(lambda v: self._set_speed_direct(v))
        self.controls.volume_changed.connect(lambda v: self._set_volume(v))
        self.controls.mute_toggled.connect(lambda: self._dispatch_action("_mute"))
        self.controls.seek_bar_clicked.connect(self.audio.seek_to_pct)
        self.controls.seek_bar_scrolled.connect(
            lambda d: self.audio.seek_back() if d < 0 else self.audio.seek_fwd()
        )

        # Editor → title display
        self.editor.text_changed.connect(self._schedule_autosave)
        self.editor.title_changed.connect(
            lambda t, a: self.controls.update_title(t or "Unknown Title", a or "Unknown Artist")
        )
        self.editor.line_counts_changed.connect(self._update_merge_btn)
        self.editor.genius_pasted.connect(self._on_genius_pasted)
        self.editor.line_play_requested.connect(self._on_line_play_requested)

        # Hotkeys
        self.hk_mgr.action_triggered.connect(self._dispatch_action)

        # Import/export
        self.io.audio_loaded.connect(self._on_audio_loaded)
        self.io.lrc_loaded.connect(self._on_lrc_loaded)
        self.io.both_loaded.connect(self._on_both_loaded)

    # ── Session / persistence ─────────────────────────────────────────────────

    def _restore_session(self) -> None:
        session = load_session()
        if session:
            text = session.get("main", self.cfg.get("default_meta", ""))
            self.editor.set_main_text(text, push_undo=False)
            pool = session.get("pool_texts", [])
            vis  = session.get("visible_count", 0)
            self.editor.set_secondary_texts(pool, vis)
        else:
            self.editor.set_main_text(self.cfg.get("default_meta", ""), push_undo=False)

        # Seed undo stack with initial state
        self.state.undo_stack = [
            self.state.take_snapshot(self.editor.get_main_text(), [])
        ]
        self.state.redo_stack = []

        # Sync controls
        self.controls.update_seek_offset(self.cfg.get("seek_offset", -600))
        self.controls.update_volume(self.state.master_volume, self.state.master_muted)
        # Apply saved theme
        theme = self.cfg.get("theme", "light")
        _apply_theme(self, theme)
        self._act_theme.setText("☀️" if theme == "dark" else "🌙")
        # Restore window geometry
        geom = self.cfg.get("_geometry")
        if geom:
            self.restoreGeometry(QByteArray.fromBase64(geom.encode()))
        # Focus the line renderer (not the speed spinbox)
        self.editor.setFocus()

    def _autosave(self) -> None:
        save_session(
            main_text=self.editor.get_main_text(),
            secondary_texts=self.editor.secondary_texts(),
            visible_count=self.editor.visible_secondary_count(),
            audio_path=self.state.saved_audio_path,
        )

    def _schedule_autosave(self) -> None:
        self._autosave_timer.start(500)

    # ── Action dispatcher ─────────────────────────────────────────────────────

    def _dispatch_action(self, action: str) -> None:  # noqa: C901
        a = action
        cfg = self.cfg
        state = self.state

        # ── Menu ──────────────────────────────────────────────────────────────
        if a == "open":             self._do_import(); return
        if a == "save":             self._do_save();   return
        if a == "undo":             self._do_undo();   return
        if a == "redo":             self._do_redo();   return
        if a == "settings":         self._open_settings(); return
        if a == "help":             self._open_help(); return
        if a == "theme_toggle":     self._toggle_theme(); return
        if a == "add_field":        self._do_add_sec(); return
        if a == "remove_field":     self._do_rm_sec(); return
        if a == "merge_fields":     self._do_merge(); return
        if a == "reset":            self._do_reset(); return

        # ── Mode ──────────────────────────────────────────────────────────────
        if a == "toggle_mode":
            state.hotkey_mode = not state.hotkey_mode
            self.editor.apply_mode()
            self.controls.rebuild_hk_grid()
            return
        if a == "offset_mode_toggle":
            state.offset_seek_mode = not state.offset_seek_mode
            self.controls.rebuild_hk_grid()
            return

        # ── Playback ──────────────────────────────────────────────────────────
        if a in ("play_pause", "play_pause_alt"):
            self.audio.toggle_play(); return
        if a == "seek_back":    self.audio.seek_back(); return
        if a == "seek_fwd":     self.audio.seek_fwd();  return
        if a == "speed_down":   self._change_speed(-1); return
        if a == "speed_up":     self._change_speed(1);  return
        if a == "speed_reset":  self._change_speed(0);  return
        if a == "_mute":
            self.audio.toggle_mute()
            self.controls.update_volume(state.master_volume, state.master_muted)
            return

        # ── Sync / navigation ─────────────────────────────────────────────────
        if a in ("sync", "replay_line"):    self._sync_line(); return
        if a == "end_line":     self._insert_end_line(); return
        if a == "prev_line":    self._seek_prev(); return
        if a == "next_line":    self._seek_next(); return
        if a == "replay_only":  self.audio.replay_active(False); return
        if a == "replay_end":   self.audio.replay_active(True);  return
        if a == "clear_sel":
            state.selected_lines.clear()
            self.editor.refresh_lines()
            return
        if a == "sync_file":    self._do_sync_file(); return

        # ── Timestamp adjustments ─────────────────────────────────────────────
        _DELTA_MAP = {
            "ts_back_tiny":   -cfg.get("tiny_ms",   100),
            "ts_fwd_tiny":    +cfg.get("tiny_ms",   100),
            "ts_back_small":  -cfg.get("small_ms",  200),
            "ts_fwd_small":   +cfg.get("small_ms",  200),
            "ts_back_medium": -cfg.get("medium_ms", 400),
            "ts_fwd_medium":  +cfg.get("medium_ms", 400),
            "ts_back_large":  -cfg.get("large_ms", 1000),
            "ts_fwd_large":   +cfg.get("large_ms", 1000),
        }
        if a in _DELTA_MAP:
            delta = _DELTA_MAP[a]
            if state.offset_seek_mode:
                self._tick_seek_offset(delta)
            else:
                self._adjust_ts(delta)
            return

        if a == "mark_translation":
            self._mark_translation()
            return

    # ── Playback helpers ──────────────────────────────────────────────────────

    def _change_speed(self, direction: int) -> None:
        speed = self.audio.change_speed(direction)
        self.controls.update_speed(speed)

    def _set_speed_direct(self, value: float) -> None:
        speed = self.audio.set_speed(value)
        self.controls.update_speed(speed)

    def _set_volume(self, vol: float) -> None:
        self.audio.set_volume(vol)
        self.controls.update_volume(self.state.master_volume, self.state.master_muted)

    # ── Seek offset ───────────────────────────────────────────────────────────

    def _on_seek_offset_changed(self, ms: int) -> None:
        self.cfg["seek_offset"] = ms
        save_cfg(self.cfg)
        if self.cfg.get("replay_after_offset"):
            self.audio.replay_active(False)

    def _tick_seek_offset(self, delta: int) -> None:
        tick = self.cfg.get("seek_offset_tick", 1000)
        # delta already in ms here; tick is a magnitude multiplier for the ▲▼ buttons
        # but for hotkey adjustments we use the actual interval values directly
        new_val = self.cfg.get("seek_offset", 0) + delta
        self.cfg["seek_offset"] = new_val
        self.controls.update_seek_offset(new_val)
        save_cfg(self.cfg)
        if self.cfg.get("replay_after_offset"):
            self.audio.replay_active(False)

    # ── Sync / navigation helpers ─────────────────────────────────────────────

    def _sync_line(self) -> None:
        if self.state.active_line < 0:
            return
        text = self.editor.get_main_text()
        new_text = sync_line(text, self.state.active_line, self.audio.current_ms())
        self._set_main(new_text)
        if self.cfg.get("replay_after_sync"):
            self.audio.replay_active(False)
        else:
            # Advance to next non-meta line
            lines = new_text.split("\n")
            nxt = self.state.active_line + 1
            while nxt < len(lines) and META_RE.match(lines[nxt]):
                nxt += 1
            if nxt < len(lines):
                self.state.active_line = nxt
                self.audio.suppress_auto_line(1500)
                self.editor.refresh_lines()
                self.editor.set_active_line(nxt)

    def _insert_end_line(self) -> None:
        text = self.editor.get_main_text()
        new_text, new_idx = insert_end_line(text, self.state.active_line, self.audio.current_ms())
        self.state.active_line = new_idx
        self._set_main(new_text)

    def _seek_prev(self) -> None:
        lines = self.editor.get_main_text().split("\n")
        first = first_lyric_index(lines)
        if self.state.active_line >= 0 and self.state.active_line == first:
            return
        for i in range(self.state.active_line - 1, -1, -1):
            if not META_RE.match(lines[i]):
                self.state.active_line = i
                self.audio.suppress_auto_line(1500)
                ms = ts_to_ms(lines[i])
                if ms is not None and self.cfg.get("replay_prev_line"):
                    self.audio.replay_active(False)
                self.editor.set_active_line(i)
                return

    def _seek_next(self) -> None:
        lines = self.editor.get_main_text().split("\n")
        last = last_lyric_index(lines)
        if self.state.active_line >= 0 and self.state.active_line == last:
            return
        for i in range(self.state.active_line + 1, len(lines)):
            if not META_RE.match(lines[i]):
                self.state.active_line = i
                self.audio.suppress_auto_line(1500)
                ms = ts_to_ms(lines[i])
                if ms is not None and self.cfg.get("replay_next_line"):
                    self.audio.replay_active(False)
                self.editor.set_active_line(i)
                return

    def _adjust_ts(self, delta: int) -> None:
        text = self.editor.get_main_text()
        targets = (
            list(self.state.selected_lines)
            if self.state.selected_lines
            else [self.state.active_line]
        )
        new_text, changed = adjust_ts(text, targets, delta)
        if changed:
            self._set_main(new_text)
            if self.cfg.get("replay_after_ts"):
                self.audio.replay_active(False)

    def _do_sync_file(self) -> None:
        offset = self.cfg.get("seek_offset", 0)
        if not offset:
            return
        text = self.editor.get_main_text()
        new_text = sync_file(text, offset)
        self.cfg["seek_offset"] = 0
        self.controls.update_seek_offset(0)
        save_cfg(self.cfg)
        self._set_main(new_text)

    def _mark_translation(self) -> None:
        text = self.editor.get_main_text()
        use_parens = self.editor.get_paren_checked()
        new_text, changed = mark_as_translation(text, self.state.active_line, use_parens)
        if changed:
            self._set_main(new_text)

    # ── Import / export ───────────────────────────────────────────────────────

    def _do_import(self) -> None:
        self.io.do_import()

    def _do_save(self) -> None:
        text = self.editor.get_main_text()
        title, _ = extract_title_artist(text)
        stem = title if title and title.lower() != "unknown" else self.state.last_import_stem
        self.io.do_save(text, stem)

    def _on_audio_loaded(self, path) -> None:
        self.audio.load(path)
        self.state.saved_audio_path = str(path)
        self.state.last_import_stem = path.stem
        # Reset Now Playing display
        self.controls.update_title(path.stem, "")
        self.controls.update_position(0.0, 0.0)
        self.controls.update_playing(False)
        # Update [ti:] if blank/unknown
        text = self.editor.get_main_text()
        new_text = set_title_in_text(text, path.stem)
        if new_text != text:
            self._set_main(new_text, push_undo=False)
        self._schedule_autosave()

    def _do_reset(self) -> None:
        """Clear song and lyrics, restore default metadata."""
        r = QMessageBox.question(
            self, "Reset",
            "Clear the current song and lyrics?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
        )
        if r != QMessageBox.StandardButton.Yes:
            return
        # Stop audio
        self.audio._player.stop()
        self.audio._player.setSource("")  # type: ignore[attr-defined]
        self.state.playing = False
        self.controls.update_playing(False)
        self.controls.update_title("Unknown Title", "Unknown Artist")
        self.controls.update_position(0.0, 0.0)
        self.state.saved_audio_path = None
        self.state.last_import_stem = ""
        self.state.genius_detected = False
        # Reset editor
        default = self.cfg.get("default_meta", "")
        self.state.active_line = -1
        self.state.selected_lines.clear()
        self.state.merge_done = False
        self._set_main(default, push_undo=False)
        self.state.undo_stack = [self.state.take_snapshot(default, [])]
        self.state.redo_stack = []
        self._update_merge_btn()
        clear_session()

    def mousePressEvent(self, e) -> None:
        if e.button() == Qt.MouseButton.MiddleButton:
            self._do_import()
        super().mousePressEvent(e)

    def _on_lrc_loaded(self, text: str, stem: str) -> None:
        self.editor.set_main_text(text, push_undo=False)
        self.state.undo_stack = [self.state.take_snapshot(text, [])]
        self.state.redo_stack = []
        self.state.last_import_stem = stem
        self._find_first_active()
        self._schedule_autosave()

    def _on_both_loaded(self, audio_path, lrc_text: str, stem: str) -> None:
        # Reset editor state
        self.state.selected_lines.clear()
        self.state.active_line = -1
        self.state.merge_done = False
        # Load audio
        self.audio.load(audio_path)
        self.state.saved_audio_path = str(audio_path)
        self.state.last_import_stem = audio_path.stem
        # Load LRC
        self.editor.set_main_text(lrc_text, push_undo=False)
        self.state.undo_stack = [self.state.take_snapshot(lrc_text, [])]
        self.state.redo_stack = []
        self._find_first_active()
        self._update_merge_btn()
        self._schedule_autosave()

    def _find_first_active(self) -> None:
        lines = self.editor.get_main_text().split("\n")
        idx = first_lyric_index(lines)
        if idx >= 0:
            self.state.active_line = idx
            self.editor.refresh_lines()

    # ── Genius paste handling ─────────────────────────────────────────────────

    def _on_genius_pasted(self, raw: str) -> None:
        if not self.state.genius_detected:
            self.state.genius_detected = True
            text = mark_genius_source(self.editor.get_main_text())
            self._set_main(text, push_undo=False)
        title, artist, album = extract_genius_meta(raw)
        text = apply_genius_meta(self.editor.get_main_text(), title, artist, album)
        if text != self.editor.get_main_text():
            self._set_main(text, push_undo=False)

    # ── Audio callbacks ───────────────────────────────────────────────────────

    def _on_audio_title_ready(self, stem: str) -> None:
        self.state.last_import_stem = stem

    def _on_active_line_changed(self, idx: int) -> None:
        self.editor.set_active_line(idx)

    def _on_line_play_requested(self, idx: int) -> None:
        """User clicked a line in hotkey mode — seek and play."""
        lines = self.editor.get_main_text().split("\n")
        if idx >= len(lines):
            return
        ms = ts_to_ms(lines[idx])
        if ms is None:
            # No timestamp — just suppress auto-line scroll briefly
            self.audio.suppress_auto_line(1500)
            return
        is_current = idx == self.state.last_playing_line
        off = self.cfg.get("seek_offset", -600)
        if is_current and self.cfg.get("replay_resume_current"):
            self.audio._seek_ms(max(0, ms + off))
        elif not is_current and self.cfg.get("replay_play_other"):
            self.audio._seek_ms(max(0, ms + off))
        else:
            self.audio._seek_ms(ms)
        self.audio._apply_volume()
        if not self.state.playing:
            self.audio._player.play()
            self.state.last_playing_line = idx

    # ── Merge button state ────────────────────────────────────────────────────

    def _update_merge_btn(self) -> None:
        self._act_rmsec.setEnabled(self.editor.secondary_count() > 0)
        if self.state.merge_done:
            self._act_merge.setEnabled(False)
            return
        text = self.editor.get_main_text()
        n = len(get_main_lyric_lines(text))
        sec_lists = self.editor.get_secondary_line_lists()
        ok = (
            bool(sec_lists)
            and all(len(s) == n for s in sec_lists)
            and has_trailing_timestamp(text)
        )
        self._act_merge.setEnabled(ok)

    # ── Secondary fields ──────────────────────────────────────────────────────

    def _do_add_sec(self) -> None:
        self.editor.add_secondary()
        self._update_merge_btn()

    def _do_rm_sec(self) -> None:
        self.editor.remove_secondary()
        self._update_merge_btn()

    def _do_merge(self) -> None:
        text = self.editor.get_main_text()
        sec_lists = self.editor.get_secondary_line_lists()
        if not has_trailing_timestamp(text):
            r = QMessageBox.question(
                self, "No trailing timestamp",
                "No trailing end timestamp found. Final secondary lines may not display correctly. Continue?",
                QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
            )
            if r != QMessageBox.StandardButton.Yes:
                return
        result = merge_translations(text, sec_lists)
        if result:
            self.state.merge_done = True
            self._set_main(result)
        self._update_merge_btn()

    # ── Undo / redo ───────────────────────────────────────────────────────────

    def _do_undo(self) -> None:
        self.editor.do_undo()

    def _do_redo(self) -> None:
        self.editor.do_redo()

    # ── Settings / help / theme ───────────────────────────────────────────────

    def _open_settings(self) -> None:
        self.settings_dialog.exec()

    def _open_help(self) -> None:
        self.help_dialog.exec()

    def _toggle_theme(self) -> None:
        themes = ["light", "dark"]
        current = self.cfg.get("theme", "light")
        new_theme = themes[(themes.index(current) + 1) % 2]
        self.cfg["theme"] = new_theme
        save_cfg(self.cfg)
        _apply_theme(self, new_theme)
        self._act_theme.setText("☀️" if new_theme == "dark" else "🌙")

    def _on_settings_changed(self) -> None:
        """Called after any settings save — rebuild hotkeys and controls grid."""
        self.hk_mgr.rebuild()
        self.controls.rebuild_hk_grid()
        self.controls.update_seek_offset(self.cfg.get("seek_offset", -600))

    # ── Shared text setter ────────────────────────────────────────────────────

    def _set_main(self, text: str, push_undo: bool = True) -> None:
        self.editor.set_main_text(text, push_undo=push_undo)
        self._schedule_autosave()

    # ── Keyboard navigation (hotkey mode) ────────────────────────────────────

    def keyPressEvent(self, e) -> None:
        """Handle Up/Down/Page/Home/End navigation in hotkey mode."""
        if not self.state.hotkey_mode:
            super().keyPressEvent(e)
            return

        key = e.key()
        shift = bool(e.modifiers() & Qt.KeyboardModifier.ShiftModifier)
        ctrl  = bool(e.modifiers() & Qt.KeyboardModifier.ControlModifier)

        lines = self.editor.get_main_text().split("\n")
        non_meta = [i for i, l in enumerate(lines) if not META_RE.match(l) and l.strip()]

        if not non_meta:
            super().keyPressEvent(e)
            return

        cur = self.state.active_line

        if key in (Qt.Key.Key_Home,):
            e.accept()
            self.state.selected_lines.clear()
            self.state.active_line = non_meta[0]
            self.editor.set_active_line(non_meta[0])
            return

        if key == Qt.Key.Key_End:
            e.accept()
            self.state.selected_lines.clear()
            self.state.active_line = non_meta[-1]
            self.editor.set_active_line(non_meta[-1])
            return

        if key in (Qt.Key.Key_Up, Qt.Key.Key_Down):
            e.accept()
            is_up = key == Qt.Key.Key_Up
            # Boundary guard
            if is_up and cur >= 0 and cur == non_meta[0]:
                return
            if not is_up and cur >= 0 and cur == non_meta[-1]:
                return

            direction = -1 if is_up else 1
            candidate = cur + direction if cur >= 0 else (non_meta[0] if is_up else non_meta[-1])
            while 0 <= candidate < len(lines):
                if not META_RE.match(lines[candidate]):
                    break
                candidate += direction
            else:
                return

            if shift:
                if not self.state.selected_lines and cur >= 0:
                    self.state.selected_lines.add(cur)
                self.state.selected_lines.add(candidate)
                self.state.active_line = candidate
            elif ctrl:
                self.state.active_line = candidate
            else:
                self.state.selected_lines.clear()
                self.state.active_line = candidate

            self.audio.suppress_auto_line(1500)
            self.editor.set_active_line(candidate)
            return

        if key in (Qt.Key.Key_PageUp, Qt.Key.Key_PageDown):
            e.accept()
            is_up = key == Qt.Key.Key_PageUp
            # Estimate page size from editor height and line height (~20px)
            page = max(1, self.editor.height() // 20 - 1)
            cur_pos = non_meta.index(cur) if cur in non_meta else 0
            target_pos = max(0, cur_pos - page) if is_up else min(len(non_meta) - 1, cur_pos + page)
            target = non_meta[target_pos]
            self.state.selected_lines.clear()
            self.state.active_line = target
            self.audio.suppress_auto_line(1500)
            self.editor.set_active_line(target)
            return

        super().keyPressEvent(e)

    # ── Close guard ──────────────────────────────────────────────────────────

    def closeEvent(self, event) -> None:
        # Save window geometry
        self.cfg["_geometry"] = self.saveGeometry().toBase64().data().decode()
        save_cfg(self.cfg)
        text = self.editor.get_main_text()
        default = self.cfg.get("default_meta", "")
        if text.strip() and text.strip() != default.strip():
            r = QMessageBox.question(
                self, "Unsaved changes",
                "Progress will not be saved. Are you sure?",
                QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
            )
            if r != QMessageBox.StandardButton.Yes:
                event.ignore()
                return
        clear_session()
        event.accept()


# ── Theme helper ──────────────────────────────────────────────────────────────

_LIGHT_QSS = ""  # default Qt style

_DARK_QSS = """
QWidget { background: #0d1117; color: #e6edf3; }
QMainWindow, QDialog { background: #0d1117; }
QToolBar { background: #161b22; border-bottom: 1px solid #30363d; }
QScrollArea, QAbstractScrollArea { background: #0d1117; }
QPlainTextEdit, QTextEdit, QLineEdit {
    background: #0d1117; color: #e6edf3;
    border: 1px solid #30363d; border-radius: 4px;
}
QPushButton {
    background: #161b22; color: #e6edf3;
    border: 1px solid #30363d; border-radius: 4px; padding: 2px 8px;
}
QPushButton:hover { background: #21262d; }
QPushButton:pressed { background: #30363d; }
QCheckBox { color: #e6edf3; }
QSpinBox, QDoubleSpinBox {
    background: #0d1117; color: #e6edf3; border: 1px solid #30363d; border-radius: 4px;
}
QLabel { color: #e6edf3; }
QScrollBar:vertical { background: #161b22; width: 10px; }
QScrollBar::handle:vertical { background: #30363d; border-radius: 4px; min-height: 20px; }
QSlider::groove:horizontal { background: #30363d; height: 4px; border-radius: 2px; }
QSlider::handle:horizontal { background: #58a6ff; width: 12px; height: 12px;
    margin: -4px 0; border-radius: 6px; }
"""


def _apply_theme(window: "MainWindow", theme: str) -> None:
    if theme == "dark":
        window.setStyleSheet(_DARK_QSS)
    else:
        window.setStyleSheet(_LIGHT_QSS)

