"""
LineByLine – editor_panel.py
Main editor area: hotkey-mode line renderer + typing-mode QPlainTextEdit,
secondary field columns, scroll sync, line selection, paste handling.
Emits signals upward; accepts updates through public API methods.
"""

import re
from PySide6.QtWidgets import (
    QWidget, QHBoxLayout, QVBoxLayout, QLabel, QPushButton,
    QScrollArea, QPlainTextEdit, QSizePolicy, QCheckBox,
    QFrame, QScrollBar, QApplication,
)
from PySide6.QtCore import Qt, Signal, QTimer
from PySide6.QtGui import (
    QColor, QPainter, QFont, QFontMetrics, QPalette,
    QTextCursor, QKeyEvent,
)

from lrc import (
    META_RE, TS_RE, ts_to_ms, ms_to_ts, is_end_ts, is_header,
    strip_sec_line, clean_paste, clean_genius, extract_genius_meta,
    apply_genius_meta, mark_genius_source, collapse_blank_lines,
    extract_title_artist, get_main_lyric_lines,
)


class EditorPanel(QWidget):
    # ── Signals ───────────────────────────────────────────────────────────────
    text_changed        = Signal(str)
    title_changed       = Signal(str, str)
    line_counts_changed = Signal()
    genius_pasted       = Signal(str)
    paste_done          = Signal()
    line_play_requested = Signal(int)
    open_requested      = Signal()       # 📂 button in main/secondary header

    def __init__(self, cfg: dict, state, parent=None) -> None:
        super().__init__(parent)
        self.cfg, self.state = cfg, state

        # Secondary pool: list of _SecondaryField (visible or hidden)
        self._sec_pool: list[_SecondaryField] = []
        # Currently visible subset (ordered)
        self._sec_visible: list[_SecondaryField] = []

        self._suppress_scroll_sync = False

        # Debounced snapshot for secondary field edits
        self._sec_undo_timer = QTimer(self)
        self._sec_undo_timer.setSingleShot(True)
        self._sec_undo_timer.timeout.connect(self._push_snapshot)

        self._build()

    # ── Build ─────────────────────────────────────────────────────────────────

    def _build(self) -> None:
        root = QHBoxLayout(self)
        root.setContentsMargins(0, 0, 0, 0)
        root.setSpacing(0)

        # Scroll area wrapping all columns side by side
        self._scroll = QScrollArea()
        self._scroll.setWidgetResizable(True)
        self._scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAsNeeded)
        self._scroll.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self._scroll.setFrameShape(QFrame.Shape.NoFrame)

        self._area = QWidget()
        self._area_layout = QHBoxLayout(self._area)
        self._area_layout.setContentsMargins(0, 0, 0, 0)
        self._area_layout.setSpacing(0)

        # Main column
        self._main_col = _MainColumn(self.cfg, self.state)
        self._main_col.text_changed.connect(self._on_main_text_changed)
        self._main_col.genius_pasted.connect(self.genius_pasted)
        self._main_col.scroll_changed.connect(self._on_main_scroll)
        self._main_col.line_play_requested.connect(self.line_play_requested)
        self._main_col.open_requested.connect(self.open_requested)
        self._area_layout.addWidget(self._main_col)

        self._scroll.setWidget(self._area)
        root.addWidget(self._scroll)

    # ── Public API ────────────────────────────────────────────────────────────

    def get_main_text(self) -> str:
        return self._main_col.get_text()

    def set_main_text(self, text: str, push_undo: bool = True) -> None:
        self._main_col.set_text(text)
        if push_undo:
            self._push_snapshot()
        self._emit_title()
        self.line_counts_changed.emit()

    def set_active_line(self, idx: int) -> None:
        self.state.active_line = idx
        self._main_col.refresh_lines()
        self._main_col.scroll_to_active()

    def refresh_lines(self) -> None:
        self._main_col.refresh_lines()

    def get_paren_checked(self) -> bool:
        return self._main_col.paren_check.isChecked()

    # Secondary fields
    def add_secondary(self) -> None:
        vis = len(self._sec_visible)
        if vis < len(self._sec_pool):
            sf = self._sec_pool[vis]
            sf.show()
            sf.set_label(f"Secondary {vis + 1}")
            self._sec_visible.append(sf)
        else:
            idx = len(self._sec_pool) + 1
            sf = _SecondaryField(f"Secondary {idx}", self.cfg, self.state)
            sf.text_changed.connect(self.line_counts_changed)
            sf.text_changed.connect(self._on_sec_text_changed)
            sf.scroll_changed.connect(self._on_sec_scroll)
            sf.open_requested.connect(self.open_requested)
            self._sec_pool.append(sf)
            self._sec_visible.append(sf)
            self._area_layout.addWidget(sf)
        self.line_counts_changed.emit()
        self._update_borders()

    def remove_secondary(self) -> None:
        if not self._sec_visible:
            return
        sf = self._sec_visible.pop()
        sf.hide()
        self.line_counts_changed.emit()
        self._update_borders()

    def get_secondary_line_lists(self) -> list[list[str]]:
        return [sf.get_lines() for sf in self._sec_visible if sf.get_lines()]

    def secondary_count(self) -> int:
        return len(self._sec_visible)

    def secondary_texts(self) -> list[str]:
        return [sf.get_raw_text() for sf in self._sec_pool]

    def visible_secondary_count(self) -> int:
        return len(self._sec_visible)

    def set_secondary_texts(self, texts: list[str], visible: int) -> None:
        for i, t in enumerate(texts):
            while i >= len(self._sec_pool):
                self.add_secondary()
            self._sec_pool[i].set_raw_text(t)
        # Hide/show as needed
        while len(self._sec_visible) < min(visible, len(self._sec_pool)):
            self.add_secondary()
        while len(self._sec_visible) > visible:
            self.remove_secondary()

    def apply_mode(self) -> None:
        """Called when hotkey/typing mode toggles."""
        self._main_col.apply_mode()

    def focus_renderer(self) -> None:
        """Set keyboard focus to the line renderer (hotkey mode)."""
        self._main_col._renderer.setFocus()

    def apply_font(self, family: str) -> None:
        """Apply a new font family to both the renderer labels and textareas."""
        self._main_col.apply_font(family)
        for sf in self._sec_visible:
            sf.apply_font(family)

    def apply_font_size(self, size: int) -> None:
        """Apply a new font size to all editor areas."""
        self._main_col.apply_font_size(size)
        for sf in self._sec_visible:
            sf.apply_font_size(size)

    # ── Undo/redo ─────────────────────────────────────────────────────────────

    def _push_snapshot(self) -> None:
        self.state.push_snapshot(
            self.get_main_text(),
            [sf.get_raw_text() for sf in self._sec_visible],
        )

    def do_undo(self) -> None:
        snap = self.state.undo()
        if snap:
            self._apply_snapshot(snap)

    def do_redo(self) -> None:
        snap = self.state.redo()
        if snap:
            self._apply_snapshot(snap)

    def _apply_snapshot(self, snap: dict) -> None:
        self._main_col.set_text(snap["main"])
        for i, t in enumerate(snap.get("secondaries", [])):
            if i < len(self._sec_visible):
                self._sec_visible[i].set_raw_text(t)
        self.state.merge_done = snap.get("merge_done", False)
        self._emit_title()
        self.line_counts_changed.emit()

    # ── Internal ─────────────────────────────────────────────────────────────

    def _on_main_text_changed(self, text: str) -> None:
        self._emit_title()
        self.line_counts_changed.emit()
        self.text_changed.emit(text)

    def _on_sec_text_changed(self) -> None:
        """Debounce snapshot push when secondary field text changes."""
        debounce = self.cfg.get("undo_debounce_ms", 150)
        self._sec_undo_timer.start(debounce)

    def _emit_title(self) -> None:
        title, artist = extract_title_artist(self.get_main_text())
        self.title_changed.emit(
            title if title and title.lower() != "unknown" else "",
            artist if artist and artist.lower() != "unknown" else "",
        )

    def _on_main_scroll(self, ratio: float) -> None:
        if self._suppress_scroll_sync:
            return
        self._suppress_scroll_sync = True
        for sf in self._sec_visible:
            sf.set_scroll_ratio(ratio)
        self._suppress_scroll_sync = False

    def _on_sec_scroll(self, ratio: float) -> None:
        if self._suppress_scroll_sync:
            return
        self._suppress_scroll_sync = True
        self._main_col.set_scroll_ratio(ratio)
        for sf in self._sec_visible:
            sf.set_scroll_ratio(ratio)
        self._suppress_scroll_sync = False

    def _update_borders(self) -> None:
        """Remove right border from last visible column."""
        self._main_col.set_right_border(bool(self._sec_visible))
        for i, sf in enumerate(self._sec_visible):
            sf.set_right_border(i < len(self._sec_visible) - 1)


# ── Main column ───────────────────────────────────────────────────────────────

class _MainColumn(QWidget):
    text_changed  = Signal(str)
    genius_pasted = Signal(str)
    scroll_changed = Signal(float)  # ratio 0–1
    line_play_requested = Signal(int)  # bubbled from renderer
    open_requested = Signal()          # 📂 button in header

    def __init__(self, cfg: dict, state, parent=None) -> None:
        super().__init__(parent)
        self.cfg, self.state = cfg, state
        self.setMinimumWidth(286)
        self.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        self._undo_timer = QTimer(self)
        self._undo_timer.setSingleShot(True)

        self._build()

    def _build(self) -> None:
        lay = QVBoxLayout(self)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.setSpacing(0)

        # Header
        hdr = QWidget()
        hdr.setFixedHeight(37)
        hdr.setStyleSheet("border-bottom:1px solid #d0d7de;")
        hdr_lay = QHBoxLayout(hdr)
        hdr_lay.setContentsMargins(8, 0, 8, 0)
        lbl = QLabel("MAIN")
        lbl.setStyleSheet("font-size:11px;font-weight:600;color:#656d76;")
        btn_open = QPushButton("📂")
        btn_open.setFixedSize(28, 28)
        btn_open.setFlat(True)
        btn_open.setToolTip("Open (Middle click)")
        btn_open.clicked.connect(self.open_requested)
        self.paren_check = QCheckBox("( )")
        self.paren_check.setChecked(True)
        self.paren_check.setToolTip("Wrap marked translations in parentheses")
        hdr_lay.addWidget(lbl)
        hdr_lay.addStretch()
        hdr_lay.addWidget(btn_open)
        hdr_lay.addWidget(self.paren_check)
        lay.addWidget(hdr)

        # Warning bar
        self.warn_bar = _WarnBar()
        lay.addWidget(self.warn_bar)

        # Line renderer (hotkey mode)
        self._renderer = _LineRenderer(self.cfg, self.state)
        self._renderer.scroll_changed.connect(self.scroll_changed)
        self._renderer.line_play_requested.connect(self.line_play_requested)
        lay.addWidget(self._renderer)

        # Textarea (typing mode)
        self._ta = _LyricTextEdit(self.cfg)
        self._ta.setVisible(False)
        self._ta.textChanged.connect(self._on_ta_changed)
        lay.addWidget(self._ta)

        # Install paste handler on renderer too
        self._renderer.paste_requested.connect(self._handle_paste_to_renderer)

    # ── Public ────────────────────────────────────────────────────────────────

    def get_text(self) -> str:
        return self._ta.toPlainText()

    def set_text(self, text: str) -> None:
        self._ta.blockSignals(True)
        self._ta.setPlainText(text)
        self._ta.blockSignals(False)
        self.refresh_lines()

    def refresh_lines(self) -> None:
        self._renderer.refresh(self._ta.toPlainText())
        self._update_warn()

    def apply_mode(self) -> None:
        hm = self.state.hotkey_mode
        self._renderer.setVisible(hm)
        self._ta.setVisible(not hm)
        if not hm:
            self._ta.setFocus()
        else:
            self.refresh_lines()

    def scroll_to_active(self) -> None:
        self._renderer.scroll_to_active()

    def set_scroll_ratio(self, ratio: float) -> None:
        self._renderer.set_scroll_ratio(ratio)

    def set_right_border(self, has_border: bool) -> None:
        style = "border-right:1px solid #d0d7de;" if has_border else ""
        self.setStyleSheet(style)

    def apply_font(self, family: str) -> None:
        from PySide6.QtGui import QFont
        f = QFont(family)
        self._ta.setFont(f)
        for w in self._renderer._container.findChildren(_LrcLineWidget):
            w.setFont(f)

    def apply_font_size(self, size: int) -> None:
        from PySide6.QtGui import QFont
        f = self._ta.font()
        f.setPointSize(size)
        self._ta.setFont(f)
        for w in self._renderer._container.findChildren(_LrcLineWidget):
            wf = w.font()
            wf.setPointSize(size)
            w.setFont(wf)

    # ── Internal ──────────────────────────────────────────────────────────────

    def _on_ta_changed(self) -> None:
        text = self._ta.toPlainText()
        self.refresh_lines()
        self.text_changed.emit(text)

    def _handle_paste_to_renderer(self, raw: str) -> None:
        """Paste into main field while in hotkey mode."""
        genius = clean_genius(raw, self.cfg)
        cleaned = genius or clean_paste(raw, "paste", self.cfg)
        cleaned = "\n".join(l.rstrip() for l in cleaned.split("\n"))
        existing = self.get_text().rstrip()
        new_text = existing + "\n\n" + cleaned.lstrip()
        self.set_text(new_text)
        self.text_changed.emit(new_text)
        if genius:
            self.genius_pasted.emit(raw)

    def _update_warn(self) -> None:
        text = self.get_text()
        has_ts = any(ts_to_ms(l) is not None for l in text.split("\n"))
        from lrc import has_trailing_timestamp
        if has_ts and not has_trailing_timestamp(text):
            self.warn_bar.show_msg("⚠ Missing trailing timestamp")
        else:
            self.warn_bar.clear()


# ── Line renderer (hotkey mode) ───────────────────────────────────────────────

class _LineRenderer(QScrollArea):
    scroll_changed    = Signal(float)   # ratio 0–1
    paste_requested   = Signal(str)     # raw pasted text
    line_play_requested = Signal(int)   # line_idx — tells MainWindow to play that line

    def __init__(self, cfg: dict, state, parent=None) -> None:
        super().__init__(parent)
        self.cfg, self.state = cfg, state
        self.setWidgetResizable(True)
        self.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAsNeeded)
        self.setFrameShape(QFrame.Shape.NoFrame)

        self._container = QWidget()
        self._lay = QVBoxLayout(self._container)
        self._lay.setContentsMargins(0, 4, 0, 4)
        self._lay.setSpacing(0)
        self._lay.addStretch()
        self.setWidget(self._container)

        self.verticalScrollBar().valueChanged.connect(self._on_scroll)

        self._lines: list[str] = []
        self._line_widgets: list[_LrcLineWidget] = []

        self.setFocusPolicy(Qt.FocusPolicy.StrongFocus)
        # Accept drops/paste
        self.setAcceptDrops(False)
        self._container.setAcceptDrops(False)

    def refresh(self, text: str) -> None:
        lines = text.split("\n")
        self._lines = lines

        # Remove old widgets
        while self._lay.count() > 1:  # keep stretch
            item = self._lay.takeAt(0)
            if item.widget():
                item.widget().deleteLater()
        self._line_widgets.clear()

        for i, line in enumerate(lines):
            if META_RE.match(line):
                continue
            if line.strip() == "":
                prev = lines[i - 1] if i > 0 else ""
                if not prev or META_RE.match(prev):
                    continue
            w = _LrcLineWidget(line, i, self.state)
            w.clicked.connect(self._on_line_click)
            self._line_widgets.append(w)
            self._lay.insertWidget(self._lay.count() - 1, w)

        self._refresh_active_states()

    def scroll_to_active(self) -> None:
        for w in self._line_widgets:
            if w.line_idx == self.state.active_line:
                self.ensureWidgetVisible(w)
                return

    def set_scroll_ratio(self, ratio: float) -> None:
        sb = self.verticalScrollBar()
        sb.blockSignals(True)
        sb.setValue(int(ratio * sb.maximum()))
        sb.blockSignals(False)

    def _on_scroll(self, val: int) -> None:
        sb = self.verticalScrollBar()
        mx = sb.maximum()
        self.scroll_changed.emit(val / mx if mx else 0.0)

    def _on_line_click(self, idx: int, shift: bool, ctrl: bool) -> None:
        lines = self._lines
        if shift and self.state.active_line >= 0:
            lo = min(self.state.active_line, idx)
            hi = max(self.state.active_line, idx)
            for j in range(lo, hi + 1):
                if j < len(lines) and not META_RE.match(lines[j]):
                    self.state.selected_lines.add(j)
            self.state.active_line = idx
        elif ctrl:
            if idx in self.state.selected_lines:
                self.state.selected_lines.discard(idx)
            else:
                self.state.selected_lines.add(idx)
            self.state.active_line = idx
        else:
            self.state.selected_lines.clear()
            self.state.active_line = idx
            self.line_play_requested.emit(idx)
        self._refresh_active_states()

    def _refresh_active_states(self) -> None:
        for w in self._line_widgets:
            w.set_state(
                w.line_idx == self.state.active_line,
                w.line_idx in self.state.selected_lines,
            )

    def keyPressEvent(self, e: QKeyEvent) -> None:
        # Ctrl+V → paste into main field while in hotkey mode
        if (e.modifiers() & Qt.KeyboardModifier.ControlModifier and
                e.key() == Qt.Key.Key_V):
            clipboard = QApplication.clipboard()
            if clipboard:
                self.paste_requested.emit(clipboard.text())
            e.accept()
            return
        # Pass all other key events up — hotkey manager handles them
        e.ignore()

    def wheelEvent(self, e) -> None:
        super().wheelEvent(e)

    def mousePressEvent(self, e) -> None:
        # Middle-click: pass up to MainWindow for file open
        if e.button() == Qt.MouseButton.MiddleButton:
            e.ignore()
            return
        super().mousePressEvent(e)

    # Accept paste via Ctrl+V
    def keyboardGrabber(self):
        return None

    def focusInEvent(self, e):
        super().focusInEvent(e)

    def childEvent(self, e):
        super().childEvent(e)


# ── Individual line widget ────────────────────────────────────────────────────

class _LrcLineWidget(QLabel):
    clicked = Signal(int, bool, bool)  # (line_idx, shift, ctrl)

    # Colours
    _C_NORMAL_BG  = "transparent"
    _C_ACTIVE_BG  = "#ddf4ff"
    _C_SEL_BG     = "#ddf4ff"
    _C_TS         = "#9198a1"
    _C_ACTIVE_TS  = "#0969da"
    _C_END_TS     = "#9198a1"

    def __init__(self, line: str, line_idx: int, state, parent=None) -> None:
        super().__init__(parent)
        self.line_idx = line_idx
        self._line = line
        self._state = state
        self._is_active = False
        self._is_selected = False
        self.setTextFormat(Qt.TextFormat.RichText)
        self.setContentsMargins(9, 1, 9, 1)
        self.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self._render()

    def set_state(self, active: bool, selected: bool) -> None:
        if self._is_active == active and self._is_selected == selected:
            return
        self._is_active = active
        self._is_selected = selected
        self._render()

    def _render(self) -> None:
        line = self._line
        end = is_end_ts(line)
        ms = ts_to_ms(line)

        # Use palette so active highlight works in both light and dark themes
        if self._is_active:
            hl_color = self.palette().color(self.palette().ColorRole.Highlight)
            bg     = hl_color.name()
            # Ensure legible text: use highlight text color from palette
            hl_text = self.palette().color(self.palette().ColorRole.HighlightedText)
            ts_col  = hl_text.name()
            weight  = "600"
        elif self._is_selected:
            hl_color = self.palette().color(self.palette().ColorRole.Highlight)
            bg     = hl_color.lighter(150).name()
            ts_col = hl_color.name()
            weight = "normal"
        else:
            bg     = "transparent"
            ts_col = "#9198a1"
            weight = "normal"

        if end:
            muted = self.palette().color(self.palette().ColorRole.PlaceholderText).name()
            self.setText(f'<span style="color:{muted};font-style:italic;">{_esc(line)}</span>')
        elif ms is not None:
            ts_part = line[:10]
            rest = line[10:]
            self.setText(
                f'<span style="color:{ts_col};">{_esc(ts_part)}</span>'
                f'<span style="font-weight:{weight};">{_esc(rest)}</span>'
            )
        elif not line.strip():
            self.setText("\u00a0")
        else:
            self.setText(f'<span style="font-weight:{weight};">{_esc(line)}</span>')

        self.setStyleSheet(f"background:{bg};padding:1px 9px;line-height:1.75;")

    def mousePressEvent(self, e) -> None:
        if e.button() == Qt.MouseButton.LeftButton:
            self.clicked.emit(
                self.line_idx,
                bool(e.modifiers() & Qt.KeyboardModifier.ShiftModifier),
                bool(e.modifiers() & Qt.KeyboardModifier.ControlModifier),
            )


def _esc(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


# ── Typing mode textarea ──────────────────────────────────────────────────────

class _LyricTextEdit(QPlainTextEdit):
    def __init__(self, cfg: dict, parent=None) -> None:
        super().__init__(parent)
        self.cfg = cfg
        self.setLineWrapMode(QPlainTextEdit.LineWrapMode.NoWrap)

    def keyPressEvent(self, e: QKeyEvent) -> None:
        # Tab → toggle back to hotkey mode
        if e.key() == Qt.Key.Key_Tab and not e.modifiers():
            e.ignore()   # let MainWindow / HotkeyManager handle toggle_mode
            return

        # Auto-trim trailing spaces on Enter
        if e.key() == Qt.Key.Key_Return:
            cursor = self.textCursor()
            block = cursor.block()
            text = block.text()
            trimmed = text.rstrip()
            if trimmed != text:
                e.accept()
                cursor.movePosition(QTextCursor.MoveOperation.StartOfBlock)
                cursor.movePosition(
                    QTextCursor.MoveOperation.EndOfBlock,
                    QTextCursor.MoveMode.KeepAnchor,
                )
                cursor.insertText(trimmed)
                self.setTextCursor(cursor)
                # Now insert newline
                super().keyPressEvent(e)
                return

        # Auto-close ( and [
        if e.key() in (Qt.Key.Key_ParenLeft, Qt.Key.Key_BracketLeft) and not e.modifiers():
            close = ")" if e.key() == Qt.Key.Key_ParenLeft else "]"
            cursor = self.textCursor()
            if cursor.hasSelection():
                selected = cursor.selectedText()
                open_ch = "(" if e.key() == Qt.Key.Key_ParenLeft else "["
                cursor.insertText(open_ch + selected + close)
                return
            cursor.insertText(("(" if e.key() == Qt.Key.Key_ParenLeft else "[") + close)
            cursor.movePosition(QTextCursor.MoveOperation.Left)
            self.setTextCursor(cursor)
            return

        super().keyPressEvent(e)

    def insertFromMimeData(self, source: QMimeData) -> None:
        raw = source.text()
        if not raw:
            return
        genius = clean_genius(raw, self.cfg)
        cleaned = genius or clean_paste(raw, "paste", self.cfg)
        cleaned = "\n".join(l.rstrip() for l in cleaned.split("\n"))
        # Insert at cursor
        cursor = self.textCursor()
        cursor.insertText(cleaned)
        self.setTextCursor(cursor)


# ── Secondary field column ────────────────────────────────────────────────────

class _SecondaryField(QWidget):
    text_changed   = Signal()
    scroll_changed = Signal(float)
    open_requested = Signal()   # 📂 button clicked

    def __init__(self, label: str, cfg: dict, state, parent=None) -> None:
        super().__init__(parent)
        self.cfg, self.state = cfg, state
        self.setMinimumWidth(286)
        self.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        self._build(label)

    def _build(self, label: str) -> None:
        lay = QVBoxLayout(self)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.setSpacing(0)

        # Header
        hdr = QWidget()
        hdr.setFixedHeight(37)
        hdr.setStyleSheet("border-bottom:1px solid #d0d7de;")
        hdr_lay = QHBoxLayout(hdr)
        hdr_lay.setContentsMargins(8, 0, 8, 0)
        self._lbl = QLabel(label.upper())
        self._lbl.setStyleSheet("font-size:11px;font-weight:600;color:#656d76;")
        btn_open = QPushButton("📂")
        btn_open.setFixedSize(28, 28)
        btn_open.setFlat(True)
        btn_open.setToolTip("Open (Middle click)")
        btn_open.clicked.connect(self.open_requested)
        self.paren_check = QCheckBox("( )")
        self.paren_check.setChecked(True)
        self.paren_check.setToolTip("Wrap pasted lines in parentheses")
        hdr_lay.addWidget(self._lbl)
        hdr_lay.addStretch()
        hdr_lay.addWidget(btn_open)
        hdr_lay.addWidget(self.paren_check)
        lay.addWidget(hdr)

        # Warn bar
        self.warn_bar = _WarnBar()
        lay.addWidget(self.warn_bar)

        # Textarea (subclass with paste override)
        self._ta = _SecTextEdit(self.cfg, self.paren_check)
        self._ta.textChanged.connect(self._on_changed)
        self._ta.verticalScrollBar().valueChanged.connect(self._on_scroll)
        lay.addWidget(self._ta)

    def set_label(self, text: str) -> None:
        self._lbl.setText(text.upper())

    def get_lines(self) -> list[str]:
        return [l for l in self._ta.toPlainText().split("\n") if l.strip()]

    def get_raw_text(self) -> str:
        return self._ta.toPlainText()

    def set_raw_text(self, text: str) -> None:
        self._ta.blockSignals(True)
        self._ta.setPlainText(text)
        self._ta.blockSignals(False)

    def set_scroll_ratio(self, ratio: float) -> None:
        sb = self._ta.verticalScrollBar()
        sb.blockSignals(True)
        sb.setValue(int(ratio * sb.maximum()))
        sb.blockSignals(False)

    def set_right_border(self, has_border: bool) -> None:
        style = "border-right:1px solid #d0d7de;" if has_border else ""
        self.setStyleSheet(style)

    def apply_font(self, family: str) -> None:
        from PySide6.QtGui import QFont
        self._ta.setFont(QFont(family))

    def apply_font_size(self, size: int) -> None:
        f = self._ta.font()
        f.setPointSize(size)
        self._ta.setFont(f)

    def _on_changed(self) -> None:
        self.text_changed.emit()

    def _on_scroll(self, val: int) -> None:
        sb = self._ta.verticalScrollBar()
        mx = sb.maximum()
        self.scroll_changed.emit(val / mx if mx else 0.0)

    def paste_lines(self, raw: str) -> None:
        """Called externally (e.g. from a paste event routed by MainWindow)."""
        genius = clean_genius(raw, self.cfg)
        text = genius or raw
        lines = text.split("\n")
        lines = [strip_sec_line(l) for l in lines]
        lines = [l for l in lines if not META_RE.match(l) and not is_header(l)]
        lines = collapse_blank_lines("\n".join(lines)).split("\n")
        use_parens = self.paren_check.isChecked()
        if use_parens:
            lines = [
                f"({l.strip()})" if l.strip() and not l.strip().startswith("(") else l
                for l in lines
            ]
        cursor = self._ta.textCursor()
        cursor.insertText("\n".join(lines))
        self._ta.setTextCursor(cursor)


# ── Secondary textarea with paste handling ────────────────────────────────────

class _SecTextEdit(QPlainTextEdit):
    def __init__(self, cfg: dict, paren_check: "QCheckBox", parent=None) -> None:
        super().__init__(parent)
        self.cfg = cfg
        self.paren_check = paren_check
        self.setLineWrapMode(QPlainTextEdit.LineWrapMode.NoWrap)

    def insertFromMimeData(self, source) -> None:
        raw = source.text()
        if not raw:
            return
        genius = clean_genius(raw, self.cfg)
        text = genius or raw
        lines = text.split("\n")
        lines = [strip_sec_line(l) for l in lines]
        lines = [l for l in lines if not META_RE.match(l) and not is_header(l)]
        lines = collapse_blank_lines("\n".join(lines)).split("\n")
        if self.paren_check.isChecked():
            lines = [
                f"({l.strip()})" if l.strip() and not l.strip().startswith("(") else l
                for l in lines
            ]
        cursor = self.textCursor()
        cursor.insertText("\n".join(lines))
        self.setTextCursor(cursor)


# ── Shared warn bar ───────────────────────────────────────────────────────────

class _WarnBar(QLabel):
    def __init__(self, parent=None) -> None:
        super().__init__(parent)
        self.setStyleSheet(
            "background:#fff8c5;border-bottom:1px solid #d4a72c;"
            "color:#7d4e00;font-size:12px;padding:3px 9px;"
        )
        self.hide()

    def show_msg(self, msg: str) -> None:
        self.setText(msg)
        self.show()

    def clear(self) -> None:
        self.setText("")
        self.hide()
