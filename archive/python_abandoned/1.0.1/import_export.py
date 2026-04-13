"""
LineByLine – import_export.py
Handles file open (audio + LRC) and save dialogs.
Emits signals so MainWindow can update editor/audio without circular imports.
"""

from pathlib import Path
from PySide6.QtCore import QObject, Signal
from PySide6.QtWidgets import QFileDialog, QWidget

from lrc import merge_lrc_meta, clean_paste, is_header, strip_sec_line, collapse_blank_lines
from config import DEFAULT_CFG


AUDIO_EXTS  = {".mp3", ".flac", ".ogg", ".wav", ".m4a", ".aac", ".opus"}
LRC_EXTS    = {".lrc", ".txt"}
AUDIO_FILTER = "Audio files (*.mp3 *.flac *.ogg *.wav *.m4a *.aac *.opus)"
LRC_FILTER   = "Lyric files (*.lrc *.txt)"
ALL_FILTER   = "All supported (*.mp3 *.flac *.ogg *.wav *.m4a *.aac *.opus *.lrc *.txt)"


class ImportExport(QObject):
    # Emitted when an audio file is selected; payload = Path
    audio_loaded   = Signal(object)
    # Emitted when LRC text is ready; payload = (text: str, stem: str)
    lrc_loaded     = Signal(str, str)
    # Emitted for audio+lrc together; payloads = (audio_path, lrc_text, stem)
    both_loaded    = Signal(object, str, str)

    def __init__(self, cfg: dict, state, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.cfg   = cfg
        self.state = state
        self._parent_widget = parent

    # ── Open ─────────────────────────────────────────────────────────────────

    def do_import(self) -> None:
        paths, _ = QFileDialog.getOpenFileNames(
            self._parent_widget,
            "Open",
            "",
            f"{ALL_FILTER};;{AUDIO_FILTER};;{LRC_FILTER}",
        )
        if not paths:
            return
        self._handle_files([Path(p) for p in paths])

    def _handle_files(self, files: list[Path]) -> None:
        audio = next((f for f in files if f.suffix.lower() in AUDIO_EXTS), None)
        lrc   = next((f for f in files if f.suffix.lower() in LRC_EXTS),   None)

        if audio and not lrc:
            self.audio_loaded.emit(audio)
            return

        if lrc and not audio:
            text, stem = self._read_lrc(lrc)
            self.lrc_loaded.emit(text, stem)
            return

        if audio and lrc:
            text, stem = self._read_lrc(lrc, fallback_stem=audio.stem)
            self.both_loaded.emit(audio, text, stem)

    def _read_lrc(self, path: Path, fallback_stem: str = "") -> tuple[str, str]:
        raw = path.read_text(encoding="utf-8", errors="replace")
        merged = merge_lrc_meta(raw, self.cfg)

        # If LRC has no [ti:], use fallback stem (audio filename)
        if fallback_stem:
            from lrc import META_RE
            has_ti = any(
                l.lower().startswith("[ti:") and
                l.split(":", 1)[1].strip().rstrip("]").strip().lower() not in ("", "unknown")
                for l in raw.split("\n")
            )
            if not has_ti:
                import re
                merged = re.sub(
                    r"^\[ti:.*\]",
                    f"[ti: {fallback_stem}]",
                    merged,
                    flags=re.MULTILINE,
                )

        lines = [l for l in raw.split("\n") if not _is_meta(l)]
        if self.cfg.get("strip_on_lrc") and self.cfg.get("strip_sections"):
            lines = [l for l in lines if not is_header(l)]

        text = merged + "\n" + "\n".join(lines).strip()
        return text, path.stem

    # ── Save ─────────────────────────────────────────────────────────────────

    def do_save(self, text: str, title_stem: str = "") -> None:
        stem = title_stem or "lyrics"
        # Sanitise
        for ch in r'/\:*?"<>|':
            stem = stem.replace(ch, "_")
        path, _ = QFileDialog.getSaveFileName(
            self._parent_widget,
            "Save",
            stem + ".lrc",
            "LRC files (*.lrc)",
        )
        if not path:
            return
        Path(path).write_text(text, encoding="utf-8")

    # ── Secondary field LRC open ──────────────────────────────────────────────

    def open_secondary_lrc(self, use_parens: bool) -> list[str] | None:
        """
        Open a single LRC/txt file for a secondary field.
        Returns cleaned line list (with optional parens), or None if cancelled.
        """
        path, _ = QFileDialog.getOpenFileName(
            self._parent_widget, "Open secondary lyrics", "", LRC_FILTER
        )
        if not path:
            return None
        raw = Path(path).read_text(encoding="utf-8", errors="replace")
        lines = [strip_sec_line(l) for l in raw.split("\n")]
        from lrc import META_RE
        lines = [l for l in lines if not META_RE.match(l) and not is_header(l)]
        lines = collapse_blank_lines("\n".join(lines)).split("\n")
        if use_parens:
            lines = [
                f"({l.strip()})" if l.strip() and not l.strip().startswith("(") else l
                for l in lines
            ]
        return lines


def _is_meta(line: str) -> bool:
    import re
    return bool(re.match(r"^\[[a-zA-Z]+:", line))
