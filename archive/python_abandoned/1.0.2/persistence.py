"""
LineByLine – persistence.py
Loads and saves user config (JSON) and session autosave (JSON).
Uses platformdirs for cross-platform config location; falls back to CWD.
No Qt imports.
"""

import json
import os
from pathlib import Path
from typing import Optional

from config import DEFAULT_CFG, migrate_cfg

try:
    from platformdirs import user_data_dir
    _DATA_DIR = Path(user_data_dir("LineByLine", "LineByLine"))
except ImportError:
    _DATA_DIR = Path.home() / ".linebyline"

_CFG_FILE     = _DATA_DIR / "config.json"
_SESSION_FILE = _DATA_DIR / "session.json"


def _ensure_dir() -> None:
    _DATA_DIR.mkdir(parents=True, exist_ok=True)


# ── Config ────────────────────────────────────────────────────────────────────

def load_cfg() -> dict:
    try:
        if _CFG_FILE.exists():
            raw = json.loads(_CFG_FILE.read_text(encoding="utf-8"))
            return migrate_cfg(raw)
    except Exception:
        pass
    return migrate_cfg({})


def save_cfg(cfg: dict) -> None:
    try:
        _ensure_dir()
        _CFG_FILE.write_text(json.dumps(cfg, indent=2), encoding="utf-8")
    except Exception:
        pass


# ── Session autosave ──────────────────────────────────────────────────────────

def load_session() -> Optional[dict]:
    """Return saved session dict or None."""
    try:
        if _SESSION_FILE.exists():
            return json.loads(_SESSION_FILE.read_text(encoding="utf-8"))
    except Exception:
        pass
    return None


def save_session(
    main_text: str,
    secondary_texts: list[str],
    visible_count: int,
    audio_path: Optional[str] = None,
) -> None:
    try:
        _ensure_dir()
        d: dict = {
            "main":         main_text,
            "pool_texts":   secondary_texts,
            "visible_count": visible_count,
        }
        if audio_path:
            d["audio_path"] = audio_path
        _SESSION_FILE.write_text(json.dumps(d), encoding="utf-8")
    except Exception:
        pass


def clear_session() -> None:
    try:
        if _SESSION_FILE.exists():
            _SESSION_FILE.unlink()
    except Exception:
        pass
