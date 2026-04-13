"""
LineByLine – audio_player.py
QMediaPlayer wrapper.  Owns all playback state; emits signals for UI updates.
"""

from pathlib import Path
from PySide6.QtCore import QObject, Signal, QUrl, QTimer
from PySide6.QtMultimedia import QMediaPlayer, QAudioOutput

from lrc import ts_to_ms


class AudioPlayer(QObject):
    position_changed    = Signal(float, float)  # (pos_sec, dur_sec)
    playing_changed     = Signal(bool)
    active_line_changed = Signal(int)
    title_ready         = Signal(str)

    def __init__(self, cfg: dict, state, parent=None) -> None:
        super().__init__(parent)
        self.cfg, self.state = cfg, state

        self._player    = QMediaPlayer(self)
        self._audio_out = QAudioOutput(self)
        self._player.setAudioOutput(self._audio_out)
        self._audio_out.setVolume(state.master_volume)
        self._audio_out.setMuted(state.master_muted)

        self._player.positionChanged.connect(self._on_position)
        self._player.playbackStateChanged.connect(self._on_state)

        self._suppress_timer = QTimer(self)
        self._suppress_timer.setSingleShot(True)
        self._suppress_timer.timeout.connect(
            lambda: setattr(self.state, "suppress_auto_line", False)
        )
        self._get_text = lambda: ""

    def set_text_supplier(self, fn) -> None:
        self._get_text = fn

    # ── Load ─────────────────────────────────────────────────────────────────

    def load(self, path: Path) -> None:
        self._player.stop()
        self._player.setSource(QUrl.fromLocalFile(str(path)))
        self.state.current_speed = 1.0
        self._player.setPlaybackRate(1.0)
        self.state.playing = False
        self.title_ready.emit(path.stem)

    # ── Transport ─────────────────────────────────────────────────────────────

    def toggle_play(self) -> None:
        if not self._player.source().isValid():
            return
        if self.state.playing:
            self._player.pause()
            return
        line_ms = self._active_line_ms()
        is_current = self.state.active_line == self.state.last_playing_line
        if line_ms is not None:
            off = self.cfg.get("seek_offset", -600)
            if is_current and self.cfg.get("replay_resume_current"):
                self._seek_ms(max(0, line_ms + off))
            elif not is_current and self.cfg.get("replay_play_other"):
                self._seek_ms(max(0, line_ms + off))
            elif not is_current:
                self._seek_ms(line_ms)
        self._apply_volume()
        self._player.play()
        self.state.last_playing_line = self.state.active_line

    def replay_active(self, seek_end: bool = False) -> None:
        if self.state.active_line < 0:
            return
        lines = self._get_text().split("\n")
        ms = ts_to_ms(lines[self.state.active_line]) if self.state.active_line < len(lines) else None
        if seek_end:
            for i in range(self.state.active_line + 1, len(lines)):
                nm = ts_to_ms(lines[i])
                if nm is not None:
                    ms = nm
                    break
        if ms is None:
            return
        off = self.cfg.get("seek_offset", -600)
        self._seek_ms(max(0, ms + off))
        if not self.state.playing:
            self._apply_volume()
            self._player.play()

    def seek_back(self) -> None:
        inc = int(self.cfg.get("seek_increment_s", 5) * 1000)
        self._player.setPosition(max(0, self._player.position() - inc))

    def seek_fwd(self) -> None:
        inc = int(self.cfg.get("seek_increment_s", 5) * 1000)
        self._player.setPosition(min(self._player.duration(), self._player.position() + inc))

    def seek_to_pct(self, pct: float) -> None:
        dur = self._player.duration()
        if dur:
            self._player.setPosition(int(pct * dur))

    # ── Speed ─────────────────────────────────────────────────────────────────

    def change_speed(self, direction: int) -> float:
        if direction == 0:
            self.state.current_speed = 1.0
        else:
            r = self.cfg.get("speed_ratio", 1.10)
            if direction > 0:
                self.state.current_speed = min(4.0, round(self.state.current_speed * r, 2))
            else:
                self.state.current_speed = max(0.1, round(self.state.current_speed / r, 2))
        self._player.setPlaybackRate(self.state.current_speed)
        return self.state.current_speed

    def set_speed(self, value: float) -> float:
        self.state.current_speed = max(0.05, min(4.0, round(value, 2)))
        self._player.setPlaybackRate(self.state.current_speed)
        return self.state.current_speed

    # ── Volume ────────────────────────────────────────────────────────────────

    def set_volume(self, vol: float) -> None:
        inc = self.cfg.get("vol_increment", 0.1)
        self.state.master_volume = max(0.0, min(1.0, round(round(vol / inc) * inc, 2)))
        self.state.master_muted = False
        self._apply_volume()

    def adjust_volume(self, direction: int) -> None:
        self.set_volume(self.state.master_volume + direction * self.cfg.get("vol_increment", 0.1))

    def toggle_mute(self) -> None:
        self.state.master_muted = not self.state.master_muted
        self._apply_volume()

    def _apply_volume(self) -> None:
        self._audio_out.setVolume(self.state.master_volume)
        self._audio_out.setMuted(self.state.master_muted)

    # ── Position / line tracking ──────────────────────────────────────────────

    def current_ms(self) -> int:
        return self._player.position()

    def suppress_auto_line(self, ms: int = 1500) -> None:
        self.state.suppress_auto_line = True
        self._suppress_timer.start(ms)

    def _on_position(self, pos_ms: int) -> None:
        dur = self._player.duration() or 0
        self.position_changed.emit(pos_ms / 1000.0, dur / 1000.0)
        self._update_active_line(pos_ms)

    def _on_state(self, ps) -> None:
        from PySide6.QtMultimedia import QMediaPlayer as _P
        playing = ps == _P.PlaybackState.PlayingState
        self.state.playing = playing
        self.playing_changed.emit(playing)

    def _update_active_line(self, pos_ms: int) -> None:
        if self.state.suppress_auto_line:
            return
        lines = self._get_text().split("\n")
        best = -1
        for i, l in enumerate(lines):
            ms = ts_to_ms(l)
            if ms is not None and ms <= pos_ms:
                best = i
        if best == -1 or best == self.state.active_line:
            return
        active_has_ts = (
            self.state.active_line >= 0
            and ts_to_ms(lines[self.state.active_line]) is not None
        )
        if not active_has_ts and self.state.active_line > best:
            return
        self.state.active_line = best
        self.active_line_changed.emit(best)

    def _active_line_ms(self):
        lines = self._get_text().split("\n")
        idx = self.state.active_line
        return ts_to_ms(lines[idx]) if 0 <= idx < len(lines) else None

    def _seek_ms(self, ms: int) -> None:
        self._player.setPosition(int(ms))
