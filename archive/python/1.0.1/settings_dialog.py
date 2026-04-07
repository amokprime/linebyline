"""
LineByLine – settings_dialog.py
Full Settings dialog: checkboxes, interval spinboxes, default-meta textarea,
hotkey capture rows with conflict/restriction/replace/reset, and search.
Autosaves on every change; emits settings_changed for MainWindow to act on.
"""

import copy
from PySide6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QWidget, QLabel, QPushButton,
    QCheckBox, QSpinBox, QDoubleSpinBox, QPlainTextEdit, QLineEdit,
    QScrollArea, QFrame, QSizePolicy,
)
from PySide6.QtCore import Qt, Signal, QTimer
from PySide6.QtGui import QKeySequence, QKeyEvent

from config import (
    DEFAULT_CFG, HK_SECTIONS, HK_LABELS,
    is_restricted_for_key, is_restricted_for_all,
)
from persistence import save_cfg


class SettingsDialog(QDialog):
    settings_changed = Signal()   # emitted after any save; MainWindow rebuilds HK grid etc.

    def __init__(self, cfg: dict, state, parent=None) -> None:
        super().__init__(parent)
        self.cfg, self.state = cfg, state
        self.setWindowTitle("Settings")
        self.setMinimumWidth(500)
        self.resize(520, 640)
        self._build()

    # ── Build ─────────────────────────────────────────────────────────────────

    def _build(self) -> None:
        self._all_rows: list[QWidget] = []
        self._hk_rows: list["_HkRow"] = []
        self._hk_search_mode = False
        root = QVBoxLayout(self)
        root.setContentsMargins(0, 0, 0, 0)
        root.setSpacing(0)

        # ── Title bar ─────────────────────────────────────────────────────────
        tbar = QWidget()
        tbar.setFixedHeight(40)
        tbar.setStyleSheet("background:#f6f8fa;border-bottom:1px solid #d0d7de;")
        tbar_lay = QHBoxLayout(tbar)
        tbar_lay.setContentsMargins(12, 0, 8, 0)
        tbar_lay.setSpacing(8)

        tbar_lay.addWidget(QLabel("<b>Settings</b>"))

        self._conflict_lbl = QLabel()
        self._conflict_lbl.setStyleSheet("color:#7d4e00;font-size:12px;")
        self._conflict_lbl.hide()
        tbar_lay.addWidget(self._conflict_lbl)
        tbar_lay.addStretch()

        # Search field
        self._search = QLineEdit()
        self._search.setPlaceholderText("Search…")
        self._search.setFixedWidth(160)
        self._search.setFixedHeight(26)
        self._search.textChanged.connect(self._apply_filter)
        tbar_lay.addWidget(self._search)

        # Keyboard-search toggle button
        self._kbd_btn = QPushButton("⌨")
        self._kbd_btn.setFixedSize(26, 26)
        self._kbd_btn.setToolTip("Search by hotkey")
        self._kbd_btn.setCheckable(True)
        self._kbd_btn.toggled.connect(self._set_hk_search_mode)
        tbar_lay.addWidget(self._kbd_btn)

        btn_close = QPushButton("✕")
        btn_close.setFixedSize(24, 24)
        btn_close.setStyleSheet("border-radius:12px;border:1px solid #d0d7de;")
        btn_close.clicked.connect(self.close)
        tbar_lay.addWidget(btn_close)

        root.addWidget(tbar)

        # ── Scrollable body ───────────────────────────────────────────────────
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QFrame.Shape.NoFrame)

        body = QWidget()
        self._body_lay = QVBoxLayout(body)
        self._body_lay.setContentsMargins(14, 14, 14, 14)
        self._body_lay.setSpacing(14)

        self._body_lay.addWidget(self._build_section_auto_strip())
        self._body_lay.addWidget(self._build_section_instant_replay())
        self._body_lay.addWidget(self._build_section_intervals())
        self._body_lay.addWidget(self._build_section_default_meta())
        self._build_section_hotkeys()   # appended directly into body_lay
        self._body_lay.addStretch()

        scroll.setWidget(body)
        root.addWidget(scroll, 1)

        # ── Footer ────────────────────────────────────────────────────────────
        footer = QWidget()
        footer.setFixedHeight(46)
        footer.setStyleSheet("border-top:1px solid #d0d7de;background:#f6f8fa;")
        foot_lay = QHBoxLayout(footer)
        foot_lay.setContentsMargins(14, 0, 14, 0)
        btn_reset = QPushButton("Reset defaults")
        btn_reset.clicked.connect(self._reset_defaults)
        foot_lay.addWidget(btn_reset)
        foot_lay.addStretch()
        root.addWidget(footer)

        # Search state
        self._search.installEventFilter(self)

    # ── Section builders ──────────────────────────────────────────────────────

    def _build_section_auto_strip(self) -> QWidget:
        w = _Section("Auto Strip")
        self._chk_strip_meta     = _Chk("Metadata",               self.cfg.get("strip_metadata", False),      w, self._save)
        self._chk_strip_sections = _Chk("Sections",               self.cfg.get("strip_sections", True),       w, self._save)
        self._chk_strip_on_lrc   = _Chk("On .lrc file import",    self.cfg.get("strip_on_lrc", False),        w, self._save)
        self._chk_strip_on_paste = _Chk("On lyrics paste",        self.cfg.get("strip_on_paste", True),       w, self._save)
        self._all_rows += [self._chk_strip_meta, self._chk_strip_sections,
                           self._chk_strip_on_lrc, self._chk_strip_on_paste]
        return w

    def _build_section_instant_replay(self) -> QWidget:
        w = _Section("Instant Replay")
        self._chk_rpl_prev    = _Chk("Moving to previous line",       self.cfg.get("replay_prev_line", False),     w, self._save)
        self._chk_rpl_next    = _Chk("Moving to next line",           self.cfg.get("replay_next_line", False),     w, self._save)
        self._chk_rpl_resume  = _Chk("Resuming currently playing line", self.cfg.get("replay_resume_current", False), w, self._save)
        self._chk_rpl_other   = _Chk("Playing another line",          self.cfg.get("replay_play_other", False),   w, self._save)
        self._chk_rpl_offset  = _Chk("Adjusting seek offset",         self.cfg.get("replay_after_offset", False), w, self._save)
        self._chk_rpl_sync    = _Chk("Syncing line",                  self.cfg.get("replay_after_sync", False),   w, self._save)
        self._chk_rpl_ts      = _Chk("Adjusting timestamp",           self.cfg.get("replay_after_ts", False),     w, self._save)
        self._all_rows += [self._chk_rpl_prev, self._chk_rpl_next, self._chk_rpl_resume,
                           self._chk_rpl_other, self._chk_rpl_offset, self._chk_rpl_sync,
                           self._chk_rpl_ts]
        return w

    def _build_section_intervals(self) -> QWidget:
        w = _Section("Intervals")

        def _spin(lo, hi, val, step=1, decimals=0):
            if decimals:
                s = QDoubleSpinBox()
                s.setDecimals(decimals)
                s.setSingleStep(step)
            else:
                s = QSpinBox()
            s.setRange(lo, hi)
            s.setValue(val)
            s.setFixedWidth(80)
            s.setAlignment(Qt.AlignmentFlag.AlignRight)
            return s

        def _row(label, widget, unit):
            r = _NumRow(label, widget, unit, w)
            self._all_rows.append(r)
            return r

        self._spin_tiny   = _spin(1, 9999, self.cfg.get("tiny_ms", 100))
        self._spin_small  = _spin(1, 9999, self.cfg.get("small_ms", 200))
        self._spin_medium = _spin(1, 9999, self.cfg.get("medium_ms", 400))
        self._spin_large  = _spin(1, 9999, self.cfg.get("large_ms", 1000))
        self._spin_seek   = _spin(1, 600,  self.cfg.get("seek_increment_s", 5))
        self._spin_speed  = _spin(1.01, 2.0, self.cfg.get("speed_ratio", 1.10), 0.01, 2)
        self._spin_vol    = _spin(1, 100, round(self.cfg.get("vol_increment", 0.1) * 100))
        self._spin_undo   = _spin(1, 5000, self.cfg.get("undo_debounce_ms", 150))

        _row("Tiny",           self._spin_tiny,   "ms")
        _row("Small",          self._spin_small,  "ms")
        _row("Medium",         self._spin_medium, "ms")
        _row("Large",          self._spin_large,  "ms")
        _row("Seek increment", self._spin_seek,   "s")
        _row("Speed ratio",    self._spin_speed,  "×")
        _row("Volume increment", self._spin_vol,  "%")
        _row("Undo window",    self._spin_undo,   "ms")

        for sp in (self._spin_tiny, self._spin_small, self._spin_medium, self._spin_large,
                   self._spin_seek, self._spin_speed, self._spin_vol, self._spin_undo):
            sp.editingFinished.connect(self._save)

        return w

    def _build_section_default_meta(self) -> QWidget:
        w = _Section("Default metadata tags")
        self._meta_edit = QPlainTextEdit()
        self._meta_edit.setPlainText(self.cfg.get("default_meta", ""))
        self._meta_edit.setFixedHeight(96)
        self._meta_edit.setStyleSheet("font-family:monospace;font-size:13px;")
        self._meta_edit.textChanged.connect(self._save)
        lay = w.layout()
        lay.addWidget(self._meta_edit)
        self._all_rows.append(self._meta_edit)
        return w

    def _build_section_hotkeys(self) -> None:
        sec_lbl = _SecLabel("Hotkeys")
        self._body_lay.addWidget(sec_lbl)

        self._hk_container = QWidget()
        hk_lay = QVBoxLayout(self._hk_container)
        hk_lay.setContentsMargins(0, 0, 0, 0)
        hk_lay.setSpacing(2)
        self._body_lay.addWidget(self._hk_container)

        self._rebuild_hk_rows()

    def _rebuild_hk_rows(self) -> None:
        lay = self._hk_container.layout()
        # Clear
        while lay.count():
            item = lay.takeAt(0)
            if item.widget():
                item.widget().deleteLater()
        self._hk_rows.clear()

        for section in HK_SECTIONS:
            sub_lbl = QLabel(section["label"])
            sub_lbl.setStyleSheet(
                "font-size:10px;font-weight:600;color:#9198a1;"
                "text-transform:uppercase;letter-spacing:0.05em;"
                "margin-top:6px;"
            )
            lay.addWidget(sub_lbl)

            for key in section["keys"]:
                row = _HkRow(key, self.cfg, self._on_hk_changed, self._set_conflict)
                lay.addWidget(row)
                self._hk_rows.append(row)

    # ── Conflict label ────────────────────────────────────────────────────────

    def _set_conflict(self, msg: str) -> None:
        if msg:
            self._conflict_lbl.setText(msg)
            self._conflict_lbl.show()
        else:
            self._conflict_lbl.hide()

    # ── Save ──────────────────────────────────────────────────────────────────

    def _save(self) -> None:
        cfg = self.cfg
        cfg["strip_metadata"]      = self._chk_strip_meta.isChecked()
        cfg["strip_sections"]      = self._chk_strip_sections.isChecked()
        cfg["strip_on_lrc"]        = self._chk_strip_on_lrc.isChecked()
        cfg["strip_on_paste"]      = self._chk_strip_on_paste.isChecked()
        cfg["replay_prev_line"]    = self._chk_rpl_prev.isChecked()
        cfg["replay_next_line"]    = self._chk_rpl_next.isChecked()
        cfg["replay_resume_current"] = self._chk_rpl_resume.isChecked()
        cfg["replay_play_other"]   = self._chk_rpl_other.isChecked()
        cfg["replay_after_offset"] = self._chk_rpl_offset.isChecked()
        cfg["replay_after_sync"]   = self._chk_rpl_sync.isChecked()
        cfg["replay_after_ts"]     = self._chk_rpl_ts.isChecked()

        cfg["tiny_ms"]          = self._spin_tiny.value()
        cfg["small_ms"]         = self._spin_small.value()
        cfg["medium_ms"]        = self._spin_medium.value()
        cfg["large_ms"]         = self._spin_large.value()
        cfg["seek_increment_s"] = self._spin_seek.value()
        cfg["speed_ratio"]      = round(self._spin_speed.value(), 2)
        cfg["vol_increment"]    = round(self._spin_vol.value() / 100, 2)
        cfg["undo_debounce_ms"] = self._spin_undo.value()
        cfg["default_meta"]     = self._meta_edit.toPlainText()

        save_cfg(cfg)
        self.settings_changed.emit()

    def _on_hk_changed(self) -> None:
        save_cfg(self.cfg)
        self.settings_changed.emit()

    # ── Reset defaults ────────────────────────────────────────────────────────

    def _reset_defaults(self) -> None:
        d = copy.deepcopy(DEFAULT_CFG)
        self.cfg.update({k: v for k, v in d.items() if k != "hotkeys"})
        self.cfg["hotkeys"] = dict(d["hotkeys"])

        # Reload all widgets
        self._chk_strip_meta.setChecked(d["strip_metadata"])
        self._chk_strip_sections.setChecked(d["strip_sections"])
        self._chk_strip_on_lrc.setChecked(d["strip_on_lrc"])
        self._chk_strip_on_paste.setChecked(d["strip_on_paste"])
        self._chk_rpl_prev.setChecked(d["replay_prev_line"])
        self._chk_rpl_next.setChecked(d["replay_next_line"])
        self._chk_rpl_resume.setChecked(d["replay_resume_current"])
        self._chk_rpl_other.setChecked(d["replay_play_other"])
        self._chk_rpl_offset.setChecked(d["replay_after_offset"])
        self._chk_rpl_sync.setChecked(d["replay_after_sync"])
        self._chk_rpl_ts.setChecked(d["replay_after_ts"])
        self._spin_tiny.setValue(d["tiny_ms"])
        self._spin_small.setValue(d["small_ms"])
        self._spin_medium.setValue(d["medium_ms"])
        self._spin_large.setValue(d["large_ms"])
        self._spin_seek.setValue(d["seek_increment_s"])
        self._spin_speed.setValue(d["speed_ratio"])
        self._spin_vol.setValue(round(d["vol_increment"] * 100))
        self._spin_undo.setValue(d["undo_debounce_ms"])
        self._meta_edit.setPlainText(d["default_meta"])
        self._rebuild_hk_rows()
        self._save()

    # ── Search / filter ───────────────────────────────────────────────────────

    def _set_hk_search_mode(self, on: bool) -> None:
        self._hk_search_mode = on
        self._kbd_btn.setChecked(on)
        if on:
            self._search.setPlaceholderText("Press a key…")
            self._search.setStyleSheet("border:1px solid #0969da;background:#ddf4ff;color:#0969da;")
            self._search.clear()
            self._search.setFocus()
        else:
            self._search.setPlaceholderText("Search…")
            self._search.setStyleSheet("")
            self._apply_filter()

    def eventFilter(self, obj, event) -> bool:
        if obj is self._search and event.type() == event.Type.KeyPress:
            e: QKeyEvent = event
            if self._hk_search_mode:
                if e.key() in (Qt.Key.Key_Escape, Qt.Key.Key_Backspace, Qt.Key.Key_Delete):
                    self._set_hk_search_mode(False)
                    self._search.clear()
                    return True
                # Modifier-only: ignore
                if e.key() in (Qt.Key.Key_Control, Qt.Key.Key_Shift, Qt.Key.Key_Alt, Qt.Key.Key_Meta):
                    return True
                ks = _key_event_to_str(e)
                self._search.setText(ks)
                self._apply_filter()
                return True
            else:
                if e.key() == Qt.Key.Key_Escape:
                    if self._search.text():
                        self._search.clear()
                    else:
                        self.close()
                    return True
        return super().eventFilter(obj, event)

    def _apply_filter(self) -> None:
        raw = self._search.text().strip()

        if self._hk_search_mode:
            for row in self._hk_rows:
                stored = self.cfg["hotkeys"].get(row.action, "")
                row.setVisible(stored == raw)
            for w in self._all_rows:
                w.setVisible(False)
            return

        if not raw:
            for w in self._all_rows:
                w.setVisible(True)
            for row in self._hk_rows:
                row.setVisible(True)
            return

        q = raw.lower()
        for w in self._all_rows:
            st = w.property("search_text") or ""
            w.setVisible(bool(q in st))

        for row in self._hk_rows:
            label_text = HK_LABELS.get(row.action, row.action).lower()
            row.setVisible(q in label_text)


# ── Hotkey capture row ────────────────────────────────────────────────────────

class _HkRow(QWidget):
    def __init__(self, action: str, cfg: dict, on_changed, set_conflict, parent=None) -> None:
        super().__init__(parent)
        self.action = action
        self.cfg = cfg
        self._on_changed = on_changed
        self._set_conflict = set_conflict

        self._conflict_action = ""
        self._last_good = ""
        self._skip_blur = False

        self._build()

    def _build(self) -> None:
        lay = QHBoxLayout(self)
        lay.setContentsMargins(0, 2, 0, 2)
        lay.setSpacing(6)

        label_text = HK_LABELS.get(self.action, self.action)
        lbl = QLabel(label_text)
        lbl.setMinimumWidth(180)
        lbl.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        lay.addWidget(lbl)

        # Capture field
        self._capture = _CaptureField()
        stored = self.cfg["hotkeys"].get(self.action, "")
        self._last_good = stored
        self._capture.setText(stored)
        self._capture.focusIn.connect(self._on_focus_in)
        self._capture.focusOut.connect(self._on_focus_out)
        self._capture.keyPressed.connect(self._on_key_pressed)
        self._capture.clearRequested.connect(self._clear)
        lay.addWidget(self._capture)

        # Clear button (✕) — only when field shows "…"
        self._btn_clear = QPushButton("✕")
        self._btn_clear.setFixedSize(22, 22)
        self._btn_clear.setStyleSheet("border-radius:11px;border:1px solid #d0d7de;font-size:10px;")
        self._btn_clear.hide()
        self._btn_clear.clicked.connect(self._clear)
        # Prevent focus-out from firing before click is processed
        self._btn_clear.mousePressEvent = lambda e: (
            setattr(self, '_skip_blur', True),
            QPushButton.mousePressEvent(self._btn_clear, e),
        )
        lay.addWidget(self._btn_clear)

        # Replace button
        self._btn_replace = QPushButton("Replace")
        self._btn_replace.setFixedHeight(26)
        self._btn_replace.setStyleSheet(
            "background:#fff8c5;border:1px solid #d4a72c;color:#7d4e00;font-size:11px;"
        )
        self._btn_replace.hide()
        self._btn_replace.clicked.connect(self._replace)
        lay.addWidget(self._btn_replace)

        # Default button
        self._btn_reset = QPushButton("↺ Default")
        self._btn_reset.setFixedHeight(26)
        self._btn_reset.setStyleSheet("font-size:11px;")
        self._btn_reset.hide()
        self._btn_reset.clicked.connect(self._reset)
        lay.addWidget(self._btn_reset)

        # Restriction warning
        self._warn = QLabel()
        self._warn.setStyleSheet("color:#c0392b;font-size:11px;")
        self._warn.hide()
        lay.addWidget(self._warn)

        self._update_reset_visibility()

    # ── Slot handlers ─────────────────────────────────────────────────────────

    def _on_focus_in(self) -> None:
        self._capture.setText("…")
        self._btn_clear.show()
        self._set_conflict("")
        self._btn_replace.hide()
        self._conflict_action = ""
        self._warn.hide()

    def _on_focus_out(self) -> None:
        if self._skip_blur:
            return
        if self._capture.text() == "…":
            self._capture.setText(self._last_good)
        self._btn_clear.hide()
        self._update_reset_visibility()

    def _on_key_pressed(self, ks: str) -> None:
        """ks is a normalized key string like 'Ctrl+A', 'Space', 'Shift+R'."""
        stored = ks  # already in LBL/Qt format from _CaptureField

        # Check restriction
        msg = is_restricted_for_key(stored, self.action)
        if msg:
            self._warn.setText(f"⚠ {msg}")
            self._warn.show()
            self._update_reset_visibility()
            self._revert_and_exit()
            return
        self._warn.hide()
        self._capture.setText(ks)

        # Check conflict
        conflict = next(
            ((k, v) for k, v in self.cfg["hotkeys"].items()
             if k != self.action and v == stored),
            None,
        )
        if conflict:
            conflict_action, _ = conflict
            conflict_label = HK_LABELS.get(conflict_action, conflict_action)
            self._set_conflict(f"⚠ Used by \"{conflict_label}\"")
            self._conflict_action = conflict_action
            self._btn_replace.show()
            self._update_reset_visibility()
        else:
            self._set_conflict("")
            self._conflict_action = ""
            self._btn_replace.hide()
            self.cfg["hotkeys"][self.action] = stored
            self._last_good = ks
            self._update_reset_visibility()
            self._on_changed()
            self._skip_blur = True
            self._capture.clearFocus()
            self._skip_blur = False
            self._btn_clear.hide()

    def _clear(self) -> None:
        self._skip_blur = True
        self.cfg["hotkeys"][self.action] = ""
        self._last_good = ""
        self._capture.setText("")
        self._capture.clearFocus()
        self._set_conflict("")
        self._conflict_action = ""
        self._btn_replace.hide()
        self._warn.hide()
        self._btn_clear.hide()
        self._update_reset_visibility()
        self._on_changed()
        self._skip_blur = False

    def _replace(self) -> None:
        if not self._conflict_action:
            return
        self.cfg["hotkeys"][self._conflict_action] = ""
        new_val = self._capture.text()
        self.cfg["hotkeys"][self.action] = new_val
        self._last_good = new_val
        self._conflict_action = ""
        self._btn_replace.hide()
        self._set_conflict("")
        self._update_reset_visibility()
        self._on_changed()

    def _reset(self) -> None:
        default = DEFAULT_CFG["hotkeys"].get(self.action, "")
        self.cfg["hotkeys"][self.action] = default
        self._last_good = default
        self._capture.setText(default)
        self._conflict_action = ""
        self._btn_replace.hide()
        self._warn.hide()
        self._set_conflict("")
        self._update_reset_visibility()
        self._on_changed()

    def _revert_and_exit(self) -> None:
        self._skip_blur = True
        self._capture.setText(self._last_good)
        self._capture.clearFocus()
        self._btn_clear.hide()
        self._set_conflict("")
        self._btn_replace.hide()
        self._conflict_action = ""
        self._skip_blur = False
        self._update_reset_visibility()

    def _update_reset_visibility(self) -> None:
        current = self.cfg["hotkeys"].get(self.action, "")
        default = DEFAULT_CFG["hotkeys"].get(self.action, "")
        show = (
            current != default
            or self._warn.isVisible()
            or bool(self._conflict_action)
        )
        self._btn_reset.setVisible(show)


# ── Capture field ─────────────────────────────────────────────────────────────

class _CaptureField(QLineEdit):
    focusIn      = Signal()
    focusOut     = Signal()
    keyPressed   = Signal(str)   # normalized key string
    clearRequested = Signal()

    def __init__(self, parent=None) -> None:
        super().__init__(parent)
        self.setReadOnly(True)
        self.setFixedWidth(110)
        self.setFixedHeight(28)
        self.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.setPlaceholderText("—")

    def focusInEvent(self, e) -> None:
        super().focusInEvent(e)
        self.focusIn.emit()

    def focusOutEvent(self, e) -> None:
        super().focusOutEvent(e)
        self.focusOut.emit()

    def keyPressEvent(self, e: QKeyEvent) -> None:
        e.accept()
        key = e.key()

        if key in (Qt.Key.Key_Backspace, Qt.Key.Key_Delete):
            self.clearRequested.emit()
            return
        if key == Qt.Key.Key_Escape:
            self.clearFocus()
            return
        if key in (Qt.Key.Key_Control, Qt.Key.Key_Shift, Qt.Key.Key_Alt, Qt.Key.Key_Meta):
            return

        self.keyPressed.emit(_key_event_to_str(e))


# ── Helpers ───────────────────────────────────────────────────────────────────

def _key_event_to_str(e: QKeyEvent) -> str:
    """Convert a QKeyEvent to an LBL-style key string like 'Ctrl+Shift+A'."""
    parts = []
    mods = e.modifiers()
    if mods & Qt.KeyboardModifier.ControlModifier:
        parts.append("Ctrl")
    if mods & Qt.KeyboardModifier.ShiftModifier:
        parts.append("Shift")
    if mods & Qt.KeyboardModifier.AltModifier:
        parts.append("Alt")

    key = e.key()
    # Map Qt key codes to LBL strings
    _QT_TO_LBL = {
        Qt.Key.Key_Space:     "Space",
        Qt.Key.Key_Return:    "Enter",
        Qt.Key.Key_Enter:     "Enter",
        Qt.Key.Key_Tab:       "Tab",
        Qt.Key.Key_Escape:    "Escape",
        Qt.Key.Key_Left:      "Left",
        Qt.Key.Key_Right:     "Right",
        Qt.Key.Key_Up:        "Up",
        Qt.Key.Key_Down:      "Down",
        Qt.Key.Key_Home:      "Home",
        Qt.Key.Key_End:       "End",
        Qt.Key.Key_Insert:    "Insert",
        Qt.Key.Key_Delete:    "Delete",
        Qt.Key.Key_Backspace: "Backspace",
        Qt.Key.Key_F1:  "F1",  Qt.Key.Key_F2:  "F2",  Qt.Key.Key_F3:  "F3",
        Qt.Key.Key_F4:  "F4",  Qt.Key.Key_F5:  "F5",  Qt.Key.Key_F6:  "F6",
        Qt.Key.Key_F7:  "F7",  Qt.Key.Key_F8:  "F8",  Qt.Key.Key_F9:  "F9",
        Qt.Key.Key_F10: "F10", Qt.Key.Key_F11: "F11", Qt.Key.Key_F12: "F12",
    }
    if key in _QT_TO_LBL:
        parts.append(_QT_TO_LBL[key])
    else:
        text = e.text()
        if text and text.isprintable():
            parts.append(text.upper())
        else:
            # Fallback to Qt key name
            name = QKeySequence(key).toString()
            if name:
                parts.append(name)

    return "+".join(parts)


# ── Widget helpers ────────────────────────────────────────────────────────────

class _Section(QWidget):
    def __init__(self, title: str, parent=None) -> None:
        super().__init__(parent)
        lay = QVBoxLayout(self)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.setSpacing(4)
        lbl = QLabel(title.upper())
        lbl.setStyleSheet(
            "font-size:11px;font-weight:600;color:#656d76;letter-spacing:0.04em;"
            "border-bottom:1px solid #d0d7de;padding-bottom:4px;margin-bottom:4px;"
        )
        lay.addWidget(lbl)


class _SecLabel(QLabel):
    def __init__(self, text: str, parent=None) -> None:
        super().__init__(text.upper(), parent)
        self.setStyleSheet(
            "font-size:11px;font-weight:600;color:#656d76;letter-spacing:0.04em;"
            "border-bottom:1px solid #d0d7de;padding-bottom:4px;"
        )


class _Chk(QCheckBox):
    def __init__(self, label: str, checked: bool, parent_section: _Section, on_change) -> None:
        super().__init__(label, parent_section)
        self.setChecked(checked)
        self.setFixedHeight(28)
        self.setProperty("search_text", label.lower())
        parent_section.layout().addWidget(self)
        self.stateChanged.connect(lambda _: on_change())


class _NumRow(QWidget):
    def __init__(self, label: str, spinbox, unit: str, parent_section: _Section) -> None:
        super().__init__(parent_section)
        lay = QHBoxLayout(self)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.setSpacing(8)
        lay.setAlignment(Qt.AlignmentFlag.AlignLeft)
        lbl = QLabel(label)
        lbl.setMinimumWidth(160)
        lay.addWidget(lbl)
        lay.addWidget(spinbox)
        lay.addWidget(QLabel(unit))
        self.setFixedHeight(30)
        self.setProperty("search_text", label.lower())
        parent_section.layout().addWidget(self)
