"""
LineByLine – controls_panel.py
Left panel: Now Playing box, speed/seek controls, volume, HK grid.
Emits action signals; MainWindow routes them to AudioPlayer / EditorPanel.
"""

from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QSlider, QSpinBox, QDoubleSpinBox, QSizePolicy, QFrame,
    QGridLayout,
)
from PySide6.QtCore import Qt, Signal, QSize
from PySide6.QtGui import QIcon

from config import HK_LABELS, DEFAULT_CFG

# ── Actions that are only meaningful in hotkey mode ───────────────────────────
HOTKEY_ONLY = {
    "play_pause", "play_pause_alt", "sync", "end_line", "prev_line", "next_line",
    "replay_only", "ts_back_tiny", "ts_fwd_tiny", "ts_back_small", "ts_fwd_small",
    "ts_back_medium", "ts_fwd_medium", "ts_back_large", "ts_fwd_large", "sync_file",
}

# HK grid rows: (action_key, label_template)  — {} filled with interval value
_HK_ROWS = [
    ("play_pause",    "Play/pause"),
    ("sync",          "Sync line"),
    ("prev_line",     "Previous line"),
    ("next_line",     "Next line"),
    ("replay_only",   "Replay only"),
    ("end_line",      "End line"),
    ("ts_back_tiny",  "−{tiny}ms {mode}"),
    ("ts_fwd_tiny",   "+{tiny}ms {mode}"),
    ("ts_back_small", "−{small}ms {mode}"),
    ("ts_fwd_small",  "+{small}ms {mode}"),
    ("ts_back_medium","−{medium}ms {mode}"),
    ("ts_fwd_medium", "+{medium}ms {mode}"),
    ("ts_back_large", "−{large}ms {mode}"),
    ("ts_fwd_large",  "+{large}ms {mode}"),
]


def _fmt_key(k: str) -> str:
    return "Esc" if k == "Escape" else (k or "—")


class _SectionLabel(QLabel):
    def __init__(self, text: str, parent=None):
        super().__init__(text.upper(), parent)
        self.setStyleSheet(
            "font-size:11px;font-weight:600;color:#656d76;letter-spacing:0.05em;"
        )


class _HkCell(QPushButton):
    """A single cell in the hotkey reference grid."""
    def __init__(self, label: str, key_str: str, dimmed: bool = False, warn: bool = False):
        super().__init__()
        self.setFlat(False)
        self.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        self.setFixedHeight(26)
        self._update(label, key_str, dimmed, warn)

    def _update(self, label: str, key_str: str, dimmed: bool, warn: bool) -> None:
        self.setText(f"{label}  [{_fmt_key(key_str)}]")
        op = "0.35" if dimmed else "1"
        bg = "#fff8c5" if warn else "transparent"
        self.setStyleSheet(
            f"text-align:left;padding:0 6px;font-size:11px;"
            f"opacity:{op};background:{bg};"
        )
        self.setEnabled(not dimmed)


class ControlsPanel(QWidget):
    # ── Signals ───────────────────────────────────────────────────────────────
    action_triggered  = Signal(str)          # action key, e.g. "play_pause"
    seek_offset_changed = Signal(int)        # new seek offset ms
    speed_changed     = Signal(float)        # new raw speed value from spinbox
    volume_changed    = Signal(float)        # 0.0–1.0
    mute_toggled      = Signal()
    seek_bar_clicked  = Signal(float)        # 0.0–1.0 pct
    seek_bar_scrolled = Signal(int)          # +1 / -1

    def __init__(self, cfg: dict, state, parent=None) -> None:
        super().__init__(parent)
        self.cfg, self.state = cfg, state
        self.setFixedWidth(310)
        self._build()

    # ── Build ─────────────────────────────────────────────────────────────────

    def _build(self) -> None:
        root = QVBoxLayout(self)
        root.setContentsMargins(8, 8, 8, 8)
        root.setSpacing(6)

        root.addWidget(_SectionLabel("Now playing"))
        root.addWidget(self._build_audio_box())
        root.addWidget(_SectionLabel("Controls"))
        root.addWidget(self._build_hk_grid())
        root.addStretch()

    def _build_audio_box(self) -> QFrame:
        box = QFrame()
        box.setFrameShape(QFrame.Shape.StyledPanel)
        lay = QVBoxLayout(box)
        lay.setSpacing(4)

        # Title / artist
        self.lbl_title  = QLabel("Unknown Title")
        self.lbl_title.setStyleSheet("font-weight:600;font-size:13px;")
        self.lbl_title.setMaximumWidth(280)
        self.lbl_title.setTextInteractionFlags(Qt.TextInteractionFlag.NoTextInteraction)
        self.lbl_artist = QLabel("Unknown Artist")
        self.lbl_artist.setStyleSheet("font-size:12px;color:#656d76;")
        lay.addWidget(self.lbl_title)
        lay.addWidget(self.lbl_artist)

        # Progress bar (custom — click/scroll to seek)
        self.progress = _ProgressBar()
        self.progress.clicked.connect(self.seek_bar_clicked)
        self.progress.scrolled.connect(self.seek_bar_scrolled)
        lay.addWidget(self.progress)

        # Time row
        time_row = QHBoxLayout()
        self.lbl_pos = QLabel("0:00")
        self.lbl_pos.setStyleSheet("font-size:12px;color:#656d76;")
        self.lbl_dur = QLabel("0:00")
        self.lbl_dur.setStyleSheet("font-size:12px;color:#656d76;")
        time_row.addWidget(self.lbl_pos)
        time_row.addStretch()
        time_row.addWidget(self.lbl_dur)
        lay.addLayout(time_row)

        # Speed row
        speed_row = QHBoxLayout()
        self.spin_speed = QDoubleSpinBox()
        self.spin_speed.setRange(0.05, 4.0)
        self.spin_speed.setSingleStep(0.01)
        self.spin_speed.setValue(1.0)
        self.spin_speed.setFixedWidth(60)
        self.spin_speed.setFixedHeight(24)
        self.spin_speed.setAlignment(Qt.AlignmentFlag.AlignRight)
        self.spin_speed.editingFinished.connect(
            lambda: self.speed_changed.emit(self.spin_speed.value())
        )
        lbl_x = QLabel("x")
        lbl_x.setStyleSheet("font-size:12px;color:#656d76;")
        btn_speed_down = _SmallBtn("▼", lambda: self.action_triggered.emit("speed_down"))
        btn_speed_up   = _SmallBtn("▲", lambda: self.action_triggered.emit("speed_up"))
        btn_seek_back  = _MediaBtn("◀◀", lambda: self.action_triggered.emit("seek_back"))
        self.btn_play  = _MediaBtn("▶",  lambda: self.action_triggered.emit("play_pause"))
        btn_seek_fwd   = _MediaBtn("▶▶", lambda: self.action_triggered.emit("seek_fwd"))
        for w in (self.spin_speed, lbl_x, btn_speed_down, btn_speed_up,
                  btn_seek_back, self.btn_play, btn_seek_fwd):
            speed_row.addWidget(w)
        speed_row.addStretch()
        lay.addLayout(speed_row)

        # Seek offset row
        off_row = QHBoxLayout()
        self.spin_offset = QSpinBox()
        self.spin_offset.setRange(-60000, 60000)
        self.spin_offset.setValue(self.cfg.get("seek_offset", -600))
        self.spin_offset.setFixedWidth(72)
        self.spin_offset.setFixedHeight(24)
        self.spin_offset.setAlignment(Qt.AlignmentFlag.AlignRight)
        self.spin_offset.editingFinished.connect(
            lambda: self.seek_offset_changed.emit(self.spin_offset.value())
        )
        lbl_ms = QLabel("ms")
        lbl_ms.setStyleSheet("font-size:12px;color:#656d76;")
        btn_off_down = _SmallBtn("▼", lambda: self._tick_offset(-1))
        btn_off_up   = _SmallBtn("▲", lambda: self._tick_offset(1))
        btn_sync     = QPushButton("Sync file")
        btn_sync.setFixedHeight(24)
        btn_sync.setStyleSheet("font-size:11px;")
        btn_sync.clicked.connect(lambda: self.action_triggered.emit("sync_file"))
        for w in (self.spin_offset, lbl_ms, btn_off_down, btn_off_up, btn_sync):
            off_row.addWidget(w)
        off_row.addStretch()
        lay.addLayout(off_row)

        # Volume row
        vol_row = QHBoxLayout()
        self.btn_mute = QPushButton("🔊")
        self.btn_mute.setFixedSize(24, 24)
        self.btn_mute.setFlat(True)
        self.btn_mute.clicked.connect(self.mute_toggled)
        self.vol_slider = _VolumeSlider()
        self.vol_slider.setValue(int(self.state.master_volume * 100))
        self.vol_slider.valueChanged.connect(
            lambda v: self.volume_changed.emit(v / 100.0)
        )
        self.vol_slider.wheel_scrolled.connect(self._on_vol_wheel)
        self.lbl_vol = QLabel(f"{int(self.state.master_volume * 100)}%")
        self.lbl_vol.setStyleSheet("font-size:11px;color:#9198a1;min-width:32px;")
        self.lbl_vol.setAlignment(Qt.AlignmentFlag.AlignRight)
        for w in (self.btn_mute, self.vol_slider, self.lbl_vol):
            vol_row.addWidget(w)
        lay.addLayout(vol_row)

        return box

    def _build_hk_grid(self) -> QWidget:
        container = QWidget()
        self._hk_grid_layout = QGridLayout(container)
        self._hk_grid_layout.setSpacing(3)
        self._hk_grid_layout.setContentsMargins(0, 0, 0, 0)
        self._hk_cells: dict[str, _HkCell] = {}
        self.rebuild_hk_grid()
        return container

    # ── Public update API ─────────────────────────────────────────────────────

    def update_position(self, pos_sec: float, dur_sec: float) -> None:
        self.lbl_pos.setText(_fmt_time(pos_sec))
        self.lbl_dur.setText(_fmt_time(dur_sec))
        pct = pos_sec / dur_sec if dur_sec else 0.0
        self.progress.set_pct(pct)

    def update_playing(self, playing: bool) -> None:
        self.btn_play.setText("⏸" if playing else "▶")

    def update_title(self, title: str, artist: str) -> None:
        self.lbl_title.setText(title or "Unknown Title")
        self.lbl_artist.setText(artist or "Unknown Artist")

    def update_speed(self, speed: float) -> None:
        self.spin_speed.blockSignals(True)
        self.spin_speed.setValue(speed)
        self.spin_speed.blockSignals(False)

    def update_volume(self, vol: float, muted: bool) -> None:
        self.vol_slider.blockSignals(True)
        self.vol_slider.setValue(int(vol * 100))
        self.vol_slider.blockSignals(False)
        self.lbl_vol.setText(f"{int(vol * 100)}%")
        self.btn_mute.setText("🔇" if (muted or vol == 0) else "🔊")

    def update_seek_offset(self, ms: int) -> None:
        self.spin_offset.blockSignals(True)
        self.spin_offset.setValue(ms)
        self.spin_offset.blockSignals(False)

    def rebuild_hk_grid(self) -> None:
        """Rebuild the hotkey reference grid from current cfg + state."""
        lay = self._hk_grid_layout
        # Clear existing
        while lay.count():
            item = lay.takeAt(0)
            if item.widget():
                item.widget().deleteLater()
        self._hk_cells.clear()

        hk = self.cfg["hotkeys"]
        om = self.state.offset_seek_mode
        hm = self.state.hotkey_mode
        mode_str = "seek" if om else "time"
        intervals = {
            "tiny":   self.cfg.get("tiny_ms", 100),
            "small":  self.cfg.get("small_ms", 200),
            "medium": self.cfg.get("medium_ms", 400),
            "large":  self.cfg.get("large_ms", 1000),
        }

        row = 0
        # Mode toggle row (2 cells spanning full width)
        for col, (key, base_label, warn) in enumerate([
            ("offset_mode_toggle", "Offset seek" if om else "Offset time", om),
            ("toggle_mode",        "Hotkey mode" if hm else "Typing mode", not hm),
        ]):
            cell = _HkCell(base_label, hk.get(key, ""), warn=warn)
            cell.clicked.connect(lambda _=False, k=key: self.action_triggered.emit(k))
            lay.addWidget(cell, row, col)
            self._hk_cells[key] = cell
        row += 1

        # Regular grid
        cells_flat = []
        for key, tmpl in _HK_ROWS:
            label = tmpl.format(mode=mode_str, **intervals)
            dimmed = not hm and key in HOTKEY_ONLY
            key_str = hk.get(key, "")
            # Sync line shows two keys
            if key == "sync":
                replay_key = hk.get("replay_line", "Enter")
                key_str = f"{_fmt_key(key_str)} / {_fmt_key(replay_key)}"
            cell = _HkCell(label, key_str, dimmed=dimmed)
            cell.clicked.connect(lambda _=False, k=key: self.action_triggered.emit(k))
            cells_flat.append((key, cell))
            self._hk_cells[key] = cell

        for i, (key, cell) in enumerate(cells_flat):
            lay.addWidget(cell, row + i // 2, i % 2)

    # ── Internal ──────────────────────────────────────────────────────────────

    def _tick_offset(self, direction: int) -> None:
        tick = self.cfg.get("seek_offset_tick", 1000)
        new_val = self.spin_offset.value() + direction * tick
        self.spin_offset.setValue(new_val)
        self.seek_offset_changed.emit(new_val)

    def _on_vol_wheel(self, direction: int) -> None:
        inc = self.cfg.get("vol_increment", 0.1)
        current = self.vol_slider.value() / 100.0
        new_vol = max(0.0, min(1.0, current + direction * inc))
        self.volume_changed.emit(new_vol)


# ── Helper widgets ────────────────────────────────────────────────────────────

class _ProgressBar(QWidget):
    clicked = Signal(float)   # pct 0–1
    scrolled = Signal(int)    # +1 / -1

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setFixedHeight(6)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self._pct = 0.0
        self._dragging = False

    def set_pct(self, pct: float) -> None:
        self._pct = max(0.0, min(1.0, pct))
        self.update()

    def paintEvent(self, _):
        from PySide6.QtGui import QPainter, QColor
        p = QPainter(self)
        p.fillRect(self.rect(), QColor("#d0d7de"))
        filled = int(self._pct * self.width())
        if filled:
            from PySide6.QtCore import QRect
            p.fillRect(QRect(0, 0, filled, self.height()), QColor("#0969da"))

    def _pct_from_x(self, x: int) -> float:
        return max(0.0, min(1.0, x / max(1, self.width())))

    def mousePressEvent(self, e):
        if e.button() == Qt.MouseButton.LeftButton:
            self._dragging = True
            self.clicked.emit(self._pct_from_x(e.position().x()))

    def mouseMoveEvent(self, e):
        if self._dragging:
            self.clicked.emit(self._pct_from_x(e.position().x()))

    def mouseReleaseEvent(self, e):
        if e.button() == Qt.MouseButton.LeftButton:
            self._dragging = False

    def wheelEvent(self, e):
        self.scrolled.emit(1 if e.angleDelta().y() > 0 else -1)


class _VolumeSlider(QSlider):
    wheel_scrolled = Signal(int)  # +1 / -1

    def __init__(self, parent=None):
        super().__init__(Qt.Orientation.Horizontal, parent)
        self.setRange(0, 100)

    def wheelEvent(self, e):
        self.wheel_scrolled.emit(1 if e.angleDelta().y() > 0 else -1)
        e.accept()


class _SmallBtn(QPushButton):
    def __init__(self, text: str, slot, parent=None):
        super().__init__(text, parent)
        self.setFixedSize(18, 24)
        self.setStyleSheet("font-size:9px;padding:0;")
        self.clicked.connect(slot)


class _MediaBtn(QPushButton):
    def __init__(self, text: str, slot, parent=None):
        super().__init__(text, parent)
        self.setFixedSize(34, 28)
        self.clicked.connect(slot)


def _fmt_time(s: float) -> str:
    s = int(s)
    return f"{s // 60}:{s % 60:02d}"
