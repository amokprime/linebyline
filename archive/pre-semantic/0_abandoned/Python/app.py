import sys, json, os, re
from pathlib import Path
from PyQt6.QtWidgets import *
from PyQt6.QtCore import *
from PyQt6.QtGui import *

try:
    import pygame
    pygame.mixer.init()
    AUDIO_OK = True
except Exception:
    AUDIO_OK = False

try:
    from mutagen import File as MutagenFile
    MUTAGEN_OK = True
except Exception:
    MUTAGEN_OK = False

APP_NAME = "App"
CONFIG_FILE = Path(__file__).parent / "config.json"
AUTOSAVE_FILE = Path(__file__).parent / "autosave.json"

DEFAULT_CONFIG = {
    "seek_ms": 1000,
    "large_ms": 1000,
    "medium_ms": 400,
    "small_ms": 200,
    "strip_headers": False,
    "strip_metadata": False,
    "default_meta": "[ti: ]\n[ar: ]\n[al: ]\n[re: Genius, GeniusLyricsCopier, lrcgenerator.com, App]\n[by: withinitself]\n",
    "hotkeys": {
        "import": "Ctrl+O", "export": "Ctrl+P", "new": "Ctrl+N",
        "settings": "Ctrl+,", "undo": "Ctrl+Z", "redo": "Ctrl+Y",
        "toggle_mode": "Tab", "play_pause": "Space",
        "sync": "W", "rewind": "Q", "forward": "E",
        "ts_back_100": "Z", "ts_fwd_100": "V",
        "ts_back_small": "A", "ts_fwd_small": "F",
        "ts_back_medium": "S", "ts_fwd_medium": "D",
        "ts_back_large": "X", "ts_fwd_large": "C",
        "add_field": "Ctrl++", "remove_field": "Ctrl+-",
    }
}

TS_RE = re.compile(r'^\[(\d{2}):(\d{2})\.(\d{2})\]')
META_RE = re.compile(r'^\[[a-zA-Z]+:')

def load_config():
    try:
        d = json.loads(CONFIG_FILE.read_text())
        cfg = dict(DEFAULT_CONFIG)
        cfg.update({k: v for k, v in d.items() if k != "hotkeys"})
        cfg["hotkeys"] = dict(DEFAULT_CONFIG["hotkeys"])
        cfg["hotkeys"].update(d.get("hotkeys", {}))
        return cfg
    except Exception:
        return dict(DEFAULT_CONFIG)

def save_config(cfg):
    CONFIG_FILE.write_text(json.dumps(cfg, indent=2))

def ts_to_ms(ts_str):
    m = TS_RE.match(ts_str)
    if not m: return None
    return int(m.group(1))*60000 + int(m.group(2))*1000 + int(m.group(3))*10

def ms_to_ts(ms):
    ms = max(0, ms)
    mins = ms // 60000
    secs = (ms % 60000) // 1000
    cents = (ms % 1000) // 10
    return f"[{mins:02d}:{secs:02d}.{cents:02d}]"

def replace_ts(line, new_ms):
    if TS_RE.match(line):
        return ms_to_ts(new_ms) + line[10:]
    return ms_to_ts(new_ms) + " " + line

def strip_ts(line):
    return TS_RE.sub("", line).lstrip()

def is_header(line):
    return line.startswith("[") and not META_RE.match(line) and not TS_RE.match(line)

# ── Lyric text field ──────────────────────────────────────────────────────────
class LyricEdit(QPlainTextEdit):
    def __init__(self, main=False, parent=None):
        super().__init__(parent)
        self.main = main
        self.setFont(QFont("Monospace", 10))
        self.setLineWrapMode(QPlainTextEdit.LineWrapMode.NoWrap)
        self.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOn)

    def sizeHint(self):
        return QSize(300 if self.main else 260, 400)

# ── Field column widget ───────────────────────────────────────────────────────
class FieldColumn(QWidget):
    def __init__(self, label, is_main=False, parent=None):
        super().__init__(parent)
        self.is_main = is_main
        self._setup(label)

    def _setup(self, label):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)

        # Header bar
        header = QWidget()
        header.setObjectName("fieldHeader")
        hl = QHBoxLayout(header)
        hl.setContentsMargins(8, 0, 8, 0)
        hl.setSpacing(4)
        header.setFixedHeight(36)

        lbl = QLabel(label)
        lbl.setObjectName("fieldLabel")
        hl.addWidget(lbl)

        self.brace_input = QLineEdit()
        self.brace_input.setPlaceholderText("{}")
        self.brace_input.setFixedWidth(46)
        self.brace_input.setFixedHeight(26)
        self.brace_input.setFont(QFont("Monospace", 10))
        self.brace_input.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.brace_input.textChanged.connect(self._autocomplete_brace)
        if self.is_main:
            hl.addWidget(self.brace_input)
            hl.addStretch()
            self.add_btn = QPushButton("+")
            self.add_btn.setFixedSize(26, 26)
            self.remove_btn = QPushButton("−")
            self.remove_btn.setFixedSize(26, 26)
            self.merge_btn = QPushButton("Merge")
            self.merge_btn.setFixedHeight(26)
            self.merge_btn.setObjectName("mergeBtn")
            hl.addWidget(self.add_btn)
            hl.addWidget(self.remove_btn)
            hl.addWidget(self.merge_btn)
        else:
            hl.addStretch()
            hl.addWidget(self.brace_input)

        layout.addWidget(header)

        # Warning bar (hidden by default)
        self.warn_label = QLabel()
        self.warn_label.setObjectName("warnLabel")
        self.warn_label.setVisible(False)
        self.warn_label.setContentsMargins(8, 2, 8, 2)
        layout.addWidget(self.warn_label)

        # Text edit
        self.editor = LyricEdit(main=self.is_main)
        layout.addWidget(self.editor)

    def _autocomplete_brace(self, text):
        pairs = {"(": ")", "[": "]", "{": "}", "<": ">"}
        if len(text) == 1 and text in pairs:
            self.brace_input.blockSignals(True)
            self.brace_input.setText(text + pairs[text])
            self.brace_input.blockSignals(False)

    def get_lines(self):
        return [l for l in self.editor.toPlainText().splitlines() if l.strip()]

    def set_warn(self, msg):
        if msg:
            self.warn_label.setText(f"⚠ {msg}")
            self.warn_label.setVisible(True)
        else:
            self.warn_label.setVisible(False)

# ── Settings dialog ───────────────────────────────────────────────────────────
class SettingsDialog(QDialog):
    def __init__(self, cfg, parent=None):
        super().__init__(parent)
        self.cfg = json.loads(json.dumps(cfg))
        self.setWindowTitle("Settings")
        self.setMinimumWidth(480)
        self._build()

    def _build(self):
        layout = QVBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(0, 0, 0, 0)

        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QFrame.Shape.NoFrame)
        inner = QWidget()
        vl = QVBoxLayout(inner)
        vl.setContentsMargins(12, 12, 12, 12)
        vl.setSpacing(14)

        # Strip section
        vl.addWidget(self._sec_label("Auto-strip from lyrics on import"))
        self.cb_headers = QCheckBox("Headers")
        self.cb_headers.setChecked(self.cfg["strip_headers"])
        self.cb_meta = QCheckBox("Metadata")
        self.cb_meta.setChecked(self.cfg["strip_metadata"])
        vl.addWidget(self.cb_headers)
        vl.addWidget(self.cb_meta)

        # Offsets
        vl.addWidget(self._sec_label("Offsets"))
        self.seek_spin, row = self._offset_row("Seek"); vl.addLayout(row)
        self.large_spin, row = self._offset_row("Large"); vl.addLayout(row)
        self.medium_spin, row = self._offset_row("Medium"); vl.addLayout(row)
        self.small_spin, row = self._offset_row("Small"); vl.addLayout(row)
        self.seek_spin.setValue(self.cfg["seek_ms"])
        self.large_spin.setValue(self.cfg["large_ms"])
        self.medium_spin.setValue(self.cfg["medium_ms"])
        self.small_spin.setValue(self.cfg["small_ms"])

        # Default meta
        vl.addWidget(self._sec_label("Default metadata tags"))
        self.meta_edit = QPlainTextEdit()
        self.meta_edit.setPlainText(self.cfg["default_meta"])
        self.meta_edit.setFont(QFont("Monospace", 10))
        self.meta_edit.setFixedHeight(90)
        vl.addWidget(self.meta_edit)

        # Hotkeys
        vl.addWidget(self._sec_label("Hotkeys"))
        hk_labels = {
            "import": "Import", "export": "Export", "new": "New file",
            "settings": "Settings", "undo": "Undo", "redo": "Redo",
            "toggle_mode": "Toggle mode", "play_pause": "Play / pause",
            "sync": "Sync line", "rewind": "Rewind to line",
            "forward": "Forward to line",
            "ts_back_100": "−100ms", "ts_fwd_100": "+100ms",
            "ts_back_small": "−Small", "ts_fwd_small": "+Small",
            "ts_back_medium": "−Medium", "ts_fwd_medium": "+Medium",
            "ts_back_large": "−Large", "ts_fwd_large": "+Large",
            "add_field": "Add secondary field",
            "remove_field": "Remove secondary field",
        }
        self.hk_fields = {}
        for key, lbl_text in hk_labels.items():
            row_w = QWidget(); row_l = QHBoxLayout(row_w)
            row_l.setContentsMargins(0, 0, 0, 0)
            row_l.addWidget(QLabel(lbl_text))
            field = QLineEdit(self.cfg["hotkeys"].get(key, ""))
            field.setFixedWidth(110)
            field.setFixedHeight(26)
            field.setAlignment(Qt.AlignmentFlag.AlignCenter)
            field.setFont(QFont("Monospace", 10))
            field.setReadOnly(True)
            field.installEventFilter(self)
            self.hk_fields[key] = field
            row_l.addStretch()
            row_l.addWidget(field)
            vl.addWidget(row_w)

        vl.addStretch()
        scroll.setWidget(inner)
        layout.addWidget(scroll)

        # Footer
        footer = QWidget()
        footer.setObjectName("settingsFooter")
        fl = QHBoxLayout(footer)
        fl.setContentsMargins(12, 0, 12, 0)
        footer.setFixedHeight(42)
        fl.addStretch()
        cancel = QPushButton("Cancel")
        cancel.setFixedHeight(26)
        cancel.clicked.connect(self.reject)
        save = QPushButton("Save")
        save.setFixedHeight(26)
        save.setObjectName("primaryBtn")
        save.clicked.connect(self._save)
        fl.addWidget(cancel)
        fl.addWidget(save)
        layout.addWidget(footer)

    def _sec_label(self, text):
        lbl = QLabel(text)
        lbl.setObjectName("secLabel")
        return lbl

    def _offset_row(self, label):
        w = QWidget(); l = QHBoxLayout(w)
        l.setContentsMargins(0, 0, 0, 0)
        l.addWidget(QLabel(label))
        l.addStretch()
        spin = QSpinBox()
        spin.setRange(0, 9999)
        spin.setFixedWidth(70)
        spin.setFixedHeight(26)
        spin.setAlignment(Qt.AlignmentFlag.AlignRight)
        l.addWidget(spin)
        l.addWidget(QLabel("ms"))
        return spin, l

    def eventFilter(self, obj, event):
        if obj in self.hk_fields.values() and event.type() == QEvent.Type.KeyPress:
            key = event.key()
            mods = event.modifiers()
            parts = []
            if mods & Qt.KeyboardModifier.ControlModifier: parts.append("Ctrl")
            if mods & Qt.KeyboardModifier.ShiftModifier: parts.append("Shift")
            if mods & Qt.KeyboardModifier.AltModifier: parts.append("Alt")
            if key not in (Qt.Key.Key_Control, Qt.Key.Key_Shift, Qt.Key.Key_Alt, Qt.Key.Key_Meta):
                parts.append(QKeySequence(key).toString())
            obj.setText("+".join(parts))
            return True
        return super().eventFilter(obj, event)

    def _save(self):
        self.cfg["strip_headers"] = self.cb_headers.isChecked()
        self.cfg["strip_metadata"] = self.cb_meta.isChecked()
        self.cfg["seek_ms"] = self.seek_spin.value()
        self.cfg["large_ms"] = self.large_spin.value()
        self.cfg["medium_ms"] = self.medium_spin.value()
        self.cfg["small_ms"] = self.small_spin.value()
        self.cfg["default_meta"] = self.meta_edit.toPlainText()
        for key, field in self.hk_fields.items():
            self.cfg["hotkeys"][key] = field.text()
        self.accept()

    def get_config(self):
        return self.cfg

# ── Main Window ───────────────────────────────────────────────────────────────
class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.cfg = load_config()
        self.hotkey_mode = True
        self.audio_path = None
        self.lrc_path = None
        self.playing = False
        self.audio_pos_ms = 0
        self._audio_start_wall = None
        self.secondary_cols = []
        self._suppress_scroll_sync = False
        self._file_watcher = QFileSystemWatcher()
        self._file_watcher.fileChanged.connect(self._on_lrc_changed)
        self._undo_stack = QUndoStack(self)

        self.setWindowTitle(APP_NAME)
        self.resize(900, 680)
        self._build_ui()
        self._apply_shortcuts()
        self._apply_stylesheet()

        # Timer for audio position tracking
        self._timer = QTimer()
        self._timer.setInterval(50)
        self._timer.timeout.connect(self._tick)
        self._timer.start()

        self._load_autosave()

    # ── UI construction ───────────────────────────────────────────────────────
    def _build_ui(self):
        central = QWidget()
        self.setCentralWidget(central)
        root = QVBoxLayout(central)
        root.setContentsMargins(0, 0, 0, 0)
        root.setSpacing(0)

        # Custom title bar
        self.title_bar = self._make_title_bar()
        root.addWidget(self.title_bar)

        # Menu bar
        menu_bar = self._make_menu_bar()
        root.addWidget(menu_bar)

        # Main content
        content = QWidget()
        content_l = QHBoxLayout(content)
        content_l.setContentsMargins(0, 0, 0, 0)
        content_l.setSpacing(0)
        root.addWidget(content)

        # Left panel
        left = self._make_left_panel()
        content_l.addWidget(left)

        # Editor area (scrollable)
        self.editor_scroll = QScrollArea()
        self.editor_scroll.setWidgetResizable(True)
        self.editor_scroll.setFrameShape(QFrame.Shape.NoFrame)
        self.editor_scroll.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.editor_scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAsNeeded)

        self.editor_container = QWidget()
        self.editor_layout = QHBoxLayout(self.editor_container)
        self.editor_layout.setContentsMargins(0, 0, 0, 0)
        self.editor_layout.setSpacing(0)

        # Main field
        self.main_col = FieldColumn("Main", is_main=True)
        self.main_col.add_btn.clicked.connect(self._add_secondary)
        self.main_col.remove_btn.clicked.connect(self._remove_secondary)
        self.main_col.merge_btn.clicked.connect(self._merge_translations)
        self.main_col.editor.textChanged.connect(self._on_main_text_changed)
        self.main_col.editor.verticalScrollBar().valueChanged.connect(self._sync_scroll)
        self.editor_layout.addWidget(self.main_col)

        self.editor_scroll.setWidget(self.editor_container)
        content_l.addWidget(self.editor_scroll, 1)

    def _make_title_bar(self):
        bar = QWidget()
        bar.setObjectName("titleBar")
        bar.setFixedHeight(34)
        l = QHBoxLayout(bar)
        l.setContentsMargins(8, 0, 8, 0)
        l.setSpacing(0)

        self.app_name_lbl = QLabel(APP_NAME)
        self.app_name_lbl.setObjectName("appName")
        l.addWidget(self.app_name_lbl)

        self.meta_lbl = QLabel()
        self.meta_lbl.setObjectName("metaLabel")
        self.meta_lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
        l.addWidget(self.meta_lbl, 1)

        for sym, tip, slot in [("−", "Minimize", self.showMinimized),
                                ("□", "Maximize", self._toggle_max),
                                ("✕", "Close (Ctrl+W)", self.close)]:
            btn = QPushButton(sym)
            btn.setObjectName("wcBtn")
            btn.setFixedSize(24, 24)
            btn.setToolTip(tip)
            btn.clicked.connect(slot)
            l.addWidget(btn)

        return bar

    def _toggle_max(self):
        if self.isMaximized(): self.showNormal()
        else: self.showMaximized()

    def _make_menu_bar(self):
        bar = QWidget()
        bar.setObjectName("menuBar")
        bar.setFixedHeight(36)
        l = QHBoxLayout(bar)
        l.setContentsMargins(8, 5, 8, 5)
        l.setSpacing(4)

        self.btn_import = self._mb_btn("+ Import", self._do_import)
        self.btn_export = self._mb_btn("Export", self._do_export)
        self.btn_new = self._mb_btn("New", self._do_new)
        l.addWidget(self.btn_import)
        l.addWidget(self.btn_export)
        l.addWidget(self.btn_new)
        l.addWidget(self._sep())

        undo_btn = self._mb_btn("↩", self._undo_stack.undo)
        undo_btn.setFixedWidth(32)
        undo_btn.setFont(QFont("", 14))
        undo_btn.setToolTip("Undo (Ctrl+Z)")
        redo_btn = self._mb_btn("↪", self._undo_stack.redo)
        redo_btn.setFixedWidth(32)
        redo_btn.setFont(QFont("", 14))
        redo_btn.setToolTip("Redo (Ctrl+Y)")
        l.addWidget(undo_btn)
        l.addWidget(redo_btn)
        l.addWidget(self._sep())

        settings_btn = self._mb_btn("⚙", self._open_settings)
        settings_btn.setFixedWidth(32)
        settings_btn.setFont(QFont("", 14))
        settings_btn.setToolTip("Settings (Ctrl+,)")
        l.addWidget(settings_btn)
        l.addStretch()
        return bar

    def _mb_btn(self, text, slot):
        btn = QPushButton(text)
        btn.setObjectName("menuBtn")
        btn.setFixedHeight(26)
        btn.clicked.connect(slot)
        return btn

    def _sep(self):
        sep = QFrame()
        sep.setFrameShape(QFrame.Shape.VLine)
        sep.setObjectName("menuSep")
        return sep

    def _make_left_panel(self):
        panel = QWidget()
        panel.setObjectName("leftPanel")
        panel.setFixedWidth(196)
        l = QVBoxLayout(panel)
        l.setContentsMargins(8, 8, 8, 8)
        l.setSpacing(6)

        # Now playing section
        l.addWidget(self._section_label("Now playing"))
        audio_box = QWidget()
        audio_box.setObjectName("audioBox")
        al = QVBoxLayout(audio_box)
        al.setContentsMargins(8, 8, 8, 8)
        al.setSpacing(4)

        self.song_title_lbl = QLabel("Unknown Title")
        self.song_title_lbl.setObjectName("songTitle")
        self.song_title_lbl.setWordWrap(False)
        al.addWidget(self.song_title_lbl)

        self.song_artist_lbl = QLabel("Unknown Artist")
        self.song_artist_lbl.setObjectName("songArtist")
        al.addWidget(self.song_artist_lbl)

        self.progress_bar = QProgressBar()
        self.progress_bar.setFixedHeight(4)
        self.progress_bar.setTextVisible(False)
        self.progress_bar.setRange(0, 1000)
        self.progress_bar.setObjectName("progressBar")
        al.addWidget(self.progress_bar)

        time_w = QWidget(); tl = QHBoxLayout(time_w)
        tl.setContentsMargins(0, 0, 0, 0)
        self.time_pos = QLabel("0:00"); self.time_pos.setObjectName("timeLabel")
        self.time_dur = QLabel("0:00"); self.time_dur.setObjectName("timeLabel")
        tl.addWidget(self.time_pos); tl.addStretch(); tl.addWidget(self.time_dur)
        al.addWidget(time_w)

        btn_row = QWidget(); bl = QHBoxLayout(btn_row)
        bl.setContentsMargins(0, 4, 0, 0)
        bl.setSpacing(8)
        bl.addStretch()

        self.rewind_btn = QPushButton()
        self.rewind_btn.setObjectName("playerBtn")
        self.rewind_btn.setFixedSize(40, 26)
        self.rewind_btn.setToolTip("Rewind to line (Q)")
        self.rewind_btn.setIcon(self._rewind_icon())
        self.rewind_btn.setIconSize(QSize(20, 14))
        self.rewind_btn.clicked.connect(self._seek_rewind)

        self.play_btn = QPushButton()
        self.play_btn.setObjectName("playBtn")
        self.play_btn.setFixedSize(28, 28)
        self.play_btn.setToolTip("Play/Pause (Space)")
        self.play_btn.setIcon(self._play_icon())
        self.play_btn.setIconSize(QSize(11, 13))
        self.play_btn.clicked.connect(self._toggle_play)

        self.forward_btn = QPushButton()
        self.forward_btn.setObjectName("playerBtn")
        self.forward_btn.setFixedSize(40, 26)
        self.forward_btn.setToolTip("Forward to line (E)")
        self.forward_btn.setIcon(self._forward_icon())
        self.forward_btn.setIconSize(QSize(20, 14))
        self.forward_btn.clicked.connect(self._seek_forward)

        bl.addWidget(self.rewind_btn)
        bl.addWidget(self.play_btn)
        bl.addWidget(self.forward_btn)
        bl.addStretch()
        al.addWidget(btn_row)
        l.addWidget(audio_box)

        # Hotkeys section
        self.hotkey_section_label = self._section_label("Hotkeys")
        l.addWidget(self.hotkey_section_label)
        self.hk_grid_widget = QWidget()
        self.hk_grid = QGridLayout(self.hk_grid_widget)
        self.hk_grid.setContentsMargins(0, 0, 0, 0)
        self.hk_grid.setSpacing(3)
        l.addWidget(self.hk_grid_widget)
        self._rebuild_hotkey_panel()

        l.addStretch()
        return panel

    def _section_label(self, text):
        lbl = QLabel(text)
        lbl.setObjectName("sectionLabel")
        return lbl

    def _rewind_icon(self):
        px = QPixmap(20, 14); px.fill(Qt.GlobalColor.transparent)
        p = QPainter(px); p.setRenderHint(QPainter.RenderHint.Antialiasing)
        c = self.palette().text().color()
        p.setBrush(c); p.setPen(Qt.PenStyle.NoPen)
        p.drawPolygon(QPolygon([QPoint(10,0), QPoint(2,7), QPoint(10,14)]))
        p.drawRoundedRect(11, 0, 4, 14, 1.5, 1.5)
        p.end(); return QIcon(px)

    def _forward_icon(self):
        px = QPixmap(20, 14); px.fill(Qt.GlobalColor.transparent)
        p = QPainter(px); p.setRenderHint(QPainter.RenderHint.Antialiasing)
        c = self.palette().text().color()
        p.setBrush(c); p.setPen(Qt.PenStyle.NoPen)
        p.drawRoundedRect(0, 0, 4, 14, 1.5, 1.5)
        p.drawPolygon(QPolygon([QPoint(5,0), QPoint(18,7), QPoint(5,14)]))
        p.end(); return QIcon(px)

    def _play_icon(self):
        px = QPixmap(11, 13); px.fill(Qt.GlobalColor.transparent)
        p = QPainter(px); p.setRenderHint(QPainter.RenderHint.Antialiasing)
        c = self.palette().text().color()
        p.setBrush(c); p.setPen(Qt.PenStyle.NoPen)
        p.drawPolygon(QPolygon([QPoint(1,0), QPoint(11,6), QPoint(1,13)]))
        p.end(); return QIcon(px)

    def _pause_icon(self):
        px = QPixmap(11, 13); px.fill(Qt.GlobalColor.transparent)
        p = QPainter(px); p.setRenderHint(QPainter.RenderHint.Antialiasing)
        c = self.palette().text().color()
        p.setBrush(c); p.setPen(Qt.PenStyle.NoPen)
        p.drawRoundedRect(0, 0, 4, 13, 1.5, 1.5)
        p.drawRoundedRect(7, 0, 4, 13, 1.5, 1.5)
        p.end(); return QIcon(px)

    def _rebuild_hotkey_panel(self):
        while self.hk_grid.count():
            item = self.hk_grid.takeAt(0)
            if item.widget(): item.widget().deleteLater()

        seek = self.cfg["seek_ms"]
        large = self.cfg["large_ms"]
        medium = self.cfg["medium_ms"]
        small = self.cfg["small_ms"]
        hk = self.cfg["hotkeys"]

        entries = [
            ("Hotkey mode", hk["toggle_mode"], True),
            ("Play/pause", hk["play_pause"], False),
            ("Sync line", hk["sync"], False),
            ("Rewind", hk["rewind"], False),
            ("Forward", hk["forward"], False),
            ("−100ms", hk["ts_back_100"], False),
            ("+100ms", hk["ts_fwd_100"], False),
            (f"−{small}ms", hk["ts_back_small"], False),
            (f"+{small}ms", hk["ts_fwd_small"], False),
            (f"−{medium}ms", hk["ts_back_medium"], False),
            (f"+{medium}ms", hk["ts_fwd_medium"], False),
            (f"−{large}ms", hk["ts_back_large"], False),
            (f"+{large}ms", hk["ts_fwd_large"], False),
        ]

        for i, (label, key, is_mode) in enumerate(entries):
            row, col = divmod(i, 2)
            cell = QWidget()
            cell.setObjectName("hkModeCell" if is_mode else "hkCell")
            cl = QHBoxLayout(cell)
            cl.setContentsMargins(4, 3, 4, 3)
            lbl = QLabel(label)
            lbl.setObjectName("hkLabel")
            key_lbl = QLabel(key)
            key_lbl.setObjectName("hkKey")
            cl.addWidget(lbl)
            cl.addStretch()
            cl.addWidget(key_lbl)
            if is_mode:
                self.hk_grid.addWidget(cell, row, 0, 1, 2)
            else:
                self.hk_grid.addWidget(cell, row, col)

    # ── Secondary fields ──────────────────────────────────────────────────────
    def _add_secondary(self):
        idx = len(self.secondary_cols) + 1
        col = FieldColumn(f"Secondary {idx}", is_main=False)
        col.editor.textChanged.connect(self._check_line_counts)
        col.editor.verticalScrollBar().valueChanged.connect(self._sync_scroll)
        self.secondary_cols.append(col)
        self.editor_layout.addWidget(col)
        self._check_line_counts()
        self._update_merge_btn()

    def _remove_secondary(self):
        if not self.secondary_cols:
            return
        col = self.secondary_cols.pop()
        self.editor_layout.removeWidget(col)
        col.deleteLater()
        self._check_line_counts()
        self._update_merge_btn()

    def _sync_scroll(self, value):
        if self._suppress_scroll_sync:
            return
        self._suppress_scroll_sync = True
        sender = self.sender()
        all_bars = [self.main_col.editor.verticalScrollBar()] + \
                   [c.editor.verticalScrollBar() for c in self.secondary_cols]
        for bar in all_bars:
            if bar is not sender:
                bar.setValue(value)
        self._suppress_scroll_sync = False

    def _check_line_counts(self):
        main_count = len(self.main_col.get_lines())
        for col in self.secondary_cols:
            sec_count = len(col.get_lines())
            if sec_count and sec_count != main_count:
                col.set_warn(f"Line count mismatch ({sec_count} vs {main_count})")
            else:
                col.set_warn("")
        self._update_merge_btn()

    def _update_merge_btn(self):
        main_count = len(self.main_col.get_lines())
        ok = any(col.get_lines() for col in self.secondary_cols) and \
             all(not col.get_lines() or len(col.get_lines()) == main_count
                 for col in self.secondary_cols)
        self.main_col.merge_btn.setEnabled(ok)

    def _on_main_text_changed(self):
        self._check_line_counts()
        self._update_titlebar_from_text()

    # ── Merge ─────────────────────────────────────────────────────────────────
    def _merge_translations(self):
        main_lines = self.main_col.editor.toPlainText().splitlines()
        sec_data = []
        for col in self.secondary_cols:
            raw = col.editor.toPlainText().splitlines()
            lines = [l for l in raw if l.strip()]
            brace = col.brace_input.text().strip()
            sec_data.append((lines, brace))

        if not sec_data:
            return

        # Find all timestamped lines and their ms values
        ts_lines = [(i, ts_to_ms(l)) for i, l in enumerate(main_lines)
                    if TS_RE.match(l) and ts_to_ms(l) is not None]

        if not ts_lines:
            QMessageBox.warning(self, "No timestamps", "Main field has no timestamps to merge against.")
            return

        # Check for trailing timestamp
        last_ts_idx = ts_lines[-1][0]
        main_content_lines = [l for l in main_lines if l.strip() and not META_RE.match(l)]
        has_trailing = len(ts_lines) > len([l for l in main_content_lines if not META_RE.match(l)])
        if not has_trailing:
            ret = QMessageBox.question(self, "Missing trailing timestamp",
                "No trailing timestamp found. Final secondary lines may not display correctly. Continue?",
                QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No)
            if ret == QMessageBox.StandardButton.No:
                return

        # Build merged output
        # Map: main line index -> list of secondary lines to insert after
        inserts = {}  # ts_lines index -> [(sec_col_idx, text)]
        main_only_idx = [i for i, ms in ts_lines]

        for col_idx, (sec_lines, brace) in enumerate(sec_data):
            for line_pos, sec_text in enumerate(sec_lines):
                if line_pos < len(ts_lines):
                    ts_idx = main_only_idx[line_pos]
                    if ts_idx not in inserts:
                        inserts[ts_idx] = []
                    wrapped = (brace[0] if brace else "") + sec_text + \
                              (brace[1] if len(brace) > 1 else "")
                    inserts[ts_idx].append((col_idx, wrapped, ts_lines[line_pos][1]))

        result = []
        for i, line in enumerate(main_lines):
            result.append(line)
            if i in inserts:
                # Find next main ts for offset base
                next_ts_ms = None
                for j, ms in ts_lines:
                    if j > i:
                        next_ts_ms = ms
                        break
                base_ms = next_ts_ms if next_ts_ms is not None else ts_lines[-1][1]
                for offset, (_, text, _) in enumerate(
                        sorted(inserts[i], key=lambda x: x[0])):
                    insert_ms = base_ms - (len(inserts[i]) - offset) * 10
                    result.append(f"{ms_to_ts(insert_ms)} {text}")

        self.main_col.editor.setPlainText("\n".join(result))

    # ── Audio ─────────────────────────────────────────────────────────────────
    def _toggle_play(self):
        if not AUDIO_OK or not self.audio_path:
            return
        if self.playing:
            pygame.mixer.music.pause()
            self.audio_pos_ms = self._current_pos_ms()
            self._audio_start_wall = None
            self.playing = False
        else:
            pygame.mixer.music.unpause()
            self._audio_start_wall = QDateTime.currentMSecsSinceEpoch()
            self.playing = True
        self.play_btn.setIcon(self._pause_icon() if self.playing else self._play_icon())

    def _current_pos_ms(self):
        if self.playing and self._audio_start_wall is not None:
            elapsed = QDateTime.currentMSecsSinceEpoch() - self._audio_start_wall
            return self.audio_pos_ms + elapsed
        return self.audio_pos_ms

    def _seek_to_ms(self, ms):
        ms = max(0, ms)
        self.audio_pos_ms = ms
        if AUDIO_OK and self.audio_path:
            pygame.mixer.music.play(start=ms / 1000.0)
            if not self.playing:
                pygame.mixer.music.pause()
            else:
                self._audio_start_wall = QDateTime.currentMSecsSinceEpoch()

    def _seek_rewind(self):
        cur = self._current_line_ms()
        if cur is not None:
            self._seek_to_ms(cur - self.cfg["seek_ms"])

    def _seek_forward(self):
        nxt = self._next_line_ms()
        if nxt is not None:
            self._seek_to_ms(nxt - self.cfg["seek_ms"])

    def _current_line_ms(self):
        lines = self.main_col.editor.toPlainText().splitlines()
        cur = self._highlighted_line_index()
        for i in range(cur, -1, -1):
            if i < len(lines) and TS_RE.match(lines[i]):
                return ts_to_ms(lines[i])
        return None

    def _next_line_ms(self):
        lines = self.main_col.editor.toPlainText().splitlines()
        cur = self._highlighted_line_index()
        for i in range(cur + 1, len(lines)):
            if TS_RE.match(lines[i]):
                return ts_to_ms(lines[i])
        return None

    def _tick(self):
        if not (AUDIO_OK and self.audio_path and self.playing):
            return
        pos = self._current_pos_ms()
        self._update_highlight(pos)
        dur = self._audio_duration_ms()
        if dur:
            self.progress_bar.setValue(int(pos * 1000 / dur))
            self.time_pos.setText(self._fmt_time(pos))
            self.time_dur.setText(self._fmt_time(dur))

    def _fmt_time(self, ms):
        s = ms // 1000
        return f"{s//60}:{s%60:02d}"

    def _audio_duration_ms(self):
        if AUDIO_OK and self.audio_path:
            try:
                snd = pygame.mixer.Sound(self.audio_path)
                return int(snd.get_length() * 1000)
            except Exception:
                pass
        return None

    def _highlighted_line_index(self):
        lines = self.main_col.editor.toPlainText().splitlines()
        pos = self._current_pos_ms()
        best = 0
        for i, line in enumerate(lines):
            ms = ts_to_ms(line) if TS_RE.match(line) else None
            if ms is not None and ms <= pos:
                best = i
        return best

    def _update_highlight(self, pos_ms):
        lines = self.main_col.editor.toPlainText().splitlines()
        best = 0
        for i, line in enumerate(lines):
            ms = ts_to_ms(line) if TS_RE.match(line) else None
            if ms is not None and ms <= pos_ms:
                best = i
        cursor = self.main_col.editor.textCursor()
        cursor.movePosition(QTextCursor.MoveOperation.Start)
        for _ in range(best):
            cursor.movePosition(QTextCursor.MoveOperation.Down)
        # Highlight via extra selections
        sel = QTextEdit.ExtraSelection()
        sel.format.setBackground(QColor("#d0e8ff"))
        sel.format.setProperty(QTextFormat.Property.FullWidthSelection, True)
        sel.cursor = cursor
        self.main_col.editor.setExtraSelections([sel])

    # ── Sync / timestamp editing ──────────────────────────────────────────────
    def _sync_line(self):
        pos_ms = self._current_pos_ms()
        cursor = self.main_col.editor.textCursor()
        block = cursor.block()
        line = block.text()
        new_line = replace_ts(line, pos_ms)
        cursor.select(QTextCursor.SelectionType.BlockUnderCursor)
        cursor.insertText(new_line)

    def _adjust_selected_ts(self, delta_ms):
        editor = self.main_col.editor
        cursor = editor.textCursor()
        if not cursor.hasSelection():
            block = cursor.block()
            self._adjust_block_ts(cursor, block, delta_ms)
        else:
            start = editor.document().findBlock(cursor.selectionStart())
            end = editor.document().findBlock(cursor.selectionEnd())
            block = start
            while block.isValid():
                c2 = QTextCursor(block)
                self._adjust_block_ts(c2, block, delta_ms)
                if block == end:
                    break
                block = block.next()

    def _adjust_block_ts(self, cursor, block, delta_ms):
        line = block.text()
        ms = ts_to_ms(line)
        if ms is None:
            return
        cursor.select(QTextCursor.SelectionType.BlockUnderCursor)
        cursor.insertText(replace_ts(line, ms + delta_ms))

    # ── Import / Export ───────────────────────────────────────────────────────
    def _do_import(self):
        audio_path, _ = QFileDialog.getOpenFileName(self, "Select audio file", "",
            "Audio files (*.mp3 *.flac *.ogg *.wav *.m4a);;All files (*)")
        if not audio_path:
            return
        lrc_path, _ = QFileDialog.getOpenFileName(self, "Select .lrc file (optional)", "",
            "LRC files (*.lrc);;All files (*)")
        self._load_audio(audio_path)
        if lrc_path:
            self._load_lrc(lrc_path)

    def _load_audio(self, path):
        self.audio_path = path
        if AUDIO_OK:
            try:
                pygame.mixer.music.load(path)
                self.playing = False
                self.audio_pos_ms = 0
                self._audio_start_wall = None
                self.play_btn.setIcon(self._play_icon())
            except Exception as e:
                QMessageBox.warning(self, "Audio error", str(e))

        title, album, artist = "Unknown Title", "Unknown Album", "Unknown Artist"
        if MUTAGEN_OK:
            try:
                tags = MutagenFile(path, easy=True)
                if tags:
                    title = str(tags.get("title", ["Unknown Title"])[0])
                    album = str(tags.get("album", ["Unknown Album"])[0])
                    artist = str(tags.get("artist", ["Unknown Artist"])[0])
            except Exception:
                pass
        self.song_title_lbl.setText(title)
        self.song_artist_lbl.setText(artist)
        self._update_titlebar(title, album, artist)

    def _update_titlebar(self, title=None, album=None, artist=None):
        parts = [p for p in [title, album, artist] if p and p not in
                 ("Unknown Title", "Unknown Album", "Unknown Artist")]
        if parts:
            self.meta_lbl.setText(" — ".join(parts))
        else:
            self.meta_lbl.setText("")

    def _update_titlebar_from_text(self):
        text = self.main_col.editor.toPlainText()
        ti = re.search(r'^\[ti:\s*(.+)\]', text, re.MULTILINE)
        ar = re.search(r'^\[ar:\s*(.+)\]', text, re.MULTILINE)
        al = re.search(r'^\[al:\s*(.+)\]', text, re.MULTILINE)
        title = ti.group(1).strip() if ti else None
        artist = ar.group(1).strip() if ar else None
        album = al.group(1).strip() if al else None
        parts = [p for p in [title, album, artist] if p]
        self.meta_lbl.setText(" — ".join(parts) if parts else "")

    def _load_lrc(self, path):
        self.lrc_path = path
        try:
            text = Path(path).read_text(encoding="utf-8")
        except Exception:
            text = Path(path).read_text(encoding="latin-1")
        lines = text.splitlines()
        if self.cfg["strip_headers"]:
            lines = [l for l in lines if not is_header(l)]
        if self.cfg["strip_metadata"]:
            lines = [l for l in lines if not META_RE.match(l)]
        self.main_col.editor.setPlainText("\n".join(lines))
        if path not in self._file_watcher.files():
            self._file_watcher.addPath(path)

    def _on_lrc_changed(self, path):
        QTimer.singleShot(100, lambda: self._reload_lrc(path))

    def _reload_lrc(self, path):
        if self.lrc_path == path:
            try:
                text = Path(path).read_text(encoding="utf-8")
                self.main_col.editor.setPlainText(text)
            except Exception:
                pass

    def _do_export(self):
        text = self.main_col.editor.toPlainText()
        ti = re.search(r'^\[ti:\s*(.+)\]', text, re.MULTILINE)
        fname = (ti.group(1).strip() if ti else "lyrics") + ".lrc"
        path, _ = QFileDialog.getSaveFileName(self, "Export .lrc", fname,
            "LRC files (*.lrc);;All files (*)")
        if path:
            Path(path).write_text(text, encoding="utf-8")
            self.lrc_path = path

    def _do_new(self):
        ret = QMessageBox.question(self, "New file", "Clear all fields?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No)
        if ret == QMessageBox.StandardButton.Yes:
            self.main_col.editor.setPlainText(self.cfg["default_meta"])
            for col in list(self.secondary_cols):
                self.editor_layout.removeWidget(col)
                col.deleteLater()
            self.secondary_cols.clear()
            self.audio_path = None
            self.lrc_path = None
            self.song_title_lbl.setText("Unknown Title")
            self.song_artist_lbl.setText("Unknown Artist")
            self.meta_lbl.setText("")

    # ── Settings ──────────────────────────────────────────────────────────────
    def _open_settings(self):
        dlg = SettingsDialog(self.cfg, self)
        if dlg.exec() == QDialog.DialogCode.Accepted:
            self.cfg = dlg.get_config()
            save_config(self.cfg)
            self._apply_shortcuts()
            self._rebuild_hotkey_panel()

    # ── Keyboard handling ─────────────────────────────────────────────────────
    def _apply_shortcuts(self):
        if hasattr(self, "_shortcuts"):
            for sc in self._shortcuts:
                sc.setEnabled(False)
        hk = self.cfg["hotkeys"]
        self._shortcuts = []

        def sc(key, fn):
            s = QShortcut(QKeySequence(key), self)
            s.activated.connect(fn)
            self._shortcuts.append(s)

        sc(hk["import"], self._do_import)
        sc(hk["export"], self._do_export)
        sc(hk["new"], self._do_new)
        sc(hk["settings"], self._open_settings)
        sc(hk["undo"], self._undo_stack.undo)
        sc(hk["redo"], self._undo_stack.redo)
        sc("Ctrl+W", self.close)

    def keyPressEvent(self, event):
        if not self.hotkey_mode:
            super().keyPressEvent(event)
            return
        hk = self.cfg["hotkeys"]
        key_str = QKeySequence(event.key()).toString()
        actions = {
            hk["toggle_mode"]: self._toggle_mode,
            hk["play_pause"]: self._toggle_play,
            hk["sync"]: self._sync_line,
            hk["rewind"]: self._seek_rewind,
            hk["forward"]: self._seek_forward,
            hk["ts_back_100"]: lambda: self._adjust_selected_ts(-100),
            hk["ts_fwd_100"]: lambda: self._adjust_selected_ts(100),
            hk["ts_back_small"]: lambda: self._adjust_selected_ts(-self.cfg["small_ms"]),
            hk["ts_fwd_small"]: lambda: self._adjust_selected_ts(self.cfg["small_ms"]),
            hk["ts_back_medium"]: lambda: self._adjust_selected_ts(-self.cfg["medium_ms"]),
            hk["ts_fwd_medium"]: lambda: self._adjust_selected_ts(self.cfg["medium_ms"]),
            hk["ts_back_large"]: lambda: self._adjust_selected_ts(-self.cfg["large_ms"]),
            hk["ts_fwd_large"]: lambda: self._adjust_selected_ts(self.cfg["large_ms"]),
        }
        if key_str in actions:
            actions[key_str]()
            event.accept()
            return
        super().keyPressEvent(event)

    def _toggle_mode(self):
        self.hotkey_mode = not self.hotkey_mode
        # Update mode indicator in hotkey panel
        self._rebuild_hotkey_panel()

    # ── Autosave ──────────────────────────────────────────────────────────────
    def _load_autosave(self):
        try:
            d = json.loads(AUTOSAVE_FILE.read_text())
            self.main_col.editor.setPlainText(d.get("main", ""))
            if d.get("audio_path") and Path(d["audio_path"]).exists():
                self._load_audio(d["audio_path"])
            if d.get("lrc_path") and Path(d["lrc_path"]).exists():
                self.lrc_path = d["lrc_path"]
        except Exception:
            self.main_col.editor.setPlainText(self.cfg["default_meta"])

    def _do_autosave(self):
        d = {"main": self.main_col.editor.toPlainText(),
             "audio_path": self.audio_path,
             "lrc_path": self.lrc_path}
        try:
            AUTOSAVE_FILE.write_text(json.dumps(d))
        except Exception:
            pass

    def closeEvent(self, event):
        self._do_autosave()
        super().closeEvent(event)

    # ── Stylesheet ────────────────────────────────────────────────────────────
    def _apply_stylesheet(self):
        self.setStyleSheet("""
QWidget { font-size: 12px; }

#titleBar, #menuBar {
    background: palette(window);
    border-bottom: 1px solid palette(mid);
}
#appName { font-weight: 500; }
#metaLabel { color: palette(mid); }

#wcBtn {
    border: 1px solid palette(mid);
    border-radius: 11px;
    background: transparent;
}
#wcBtn:hover { background: palette(midlight); }

#menuBtn {
    border: 1px solid palette(mid);
    border-radius: 4px;
    padding: 0 10px;
    background: transparent;
}
#menuBtn:hover { background: palette(midlight); }
#menuSep { color: palette(mid); }

#leftPanel {
    background: palette(window);
    border-right: 1px solid palette(mid);
}
#sectionLabel {
    font-size: 11px;
    font-weight: 500;
    color: palette(mid);
}
#audioBox {
    border: 1px solid palette(mid);
    border-radius: 6px;
    background: palette(window);
}
#songTitle { font-weight: 500; }
#songArtist { color: palette(mid); font-size: 11px; }
#timeLabel { font-size: 11px; color: palette(mid); }
QProgressBar#progressBar {
    border: none;
    border-radius: 2px;
    background: palette(mid);
}
QProgressBar#progressBar::chunk {
    background: #378ADD;
    border-radius: 2px;
}

#playerBtn {
    border: 1px solid palette(mid);
    border-radius: 4px;
    background: transparent;
}
#playerBtn:hover { background: palette(midlight); }
#playBtn {
    border: 1px solid palette(mid);
    border-radius: 14px;
    background: transparent;
}
#playBtn:hover { background: palette(midlight); }

#hkCell {
    background: palette(window);
    border: 1px solid palette(mid);
    border-radius: 4px;
}
#hkModeCell {
    background: #dbeafe;
    border: 1px solid #93c5fd;
    border-radius: 4px;
}
#hkLabel { font-size: 11px; }
#hkKey {
    font-size: 10px;
    background: palette(mid);
    border-radius: 3px;
    padding: 1px 4px;
    color: palette(window);
}

#fieldHeader {
    background: palette(window);
    border-bottom: 1px solid palette(mid);
}
#fieldLabel { font-size: 11px; color: palette(mid); font-weight: 500; }
#warnLabel {
    background: #fef9c3;
    color: #854d0e;
    font-size: 11px;
    border-bottom: 1px solid #fde68a;
}
#mergeBtn {
    background: #dbeafe;
    color: #1e40af;
    border: 1px solid #93c5fd;
    border-radius: 4px;
}
#mergeBtn:disabled { opacity: 0.4; }

#settingsFooter {
    background: palette(window);
    border-top: 1px solid palette(mid);
}
#secLabel {
    font-size: 11px;
    font-weight: 500;
    color: palette(mid);
    border-bottom: 1px solid palette(mid);
    padding-bottom: 4px;
}
#primaryBtn {
    background: #dbeafe;
    color: #1e40af;
    border: 1px solid #93c5fd;
    border-radius: 4px;
}
""")

if __name__ == "__main__":
    app = QApplication(sys.argv)
    app.setApplicationName(APP_NAME)
    win = MainWindow()
    win.show()
    sys.exit(app.exec())
