# LRC Editor

## Requirements

Install Python dependencies (one-time):
```
pip install PyQt6 pygame mutagen
```

## Running

**Windows:** Double-click `run.bat`  
**Linux/Mac:** `sh run.sh`  
Or directly: `python app.py`

## Files created by the app (in same folder as app.py)
- `config.json` — your settings and hotkeys
- `autosave.json` — last open session, restored on next launch

## Notes
- **Tab** toggles between hotkey mode and typing mode
- In hotkey mode, letter keys trigger actions even when the text field is focused
- In typing mode, all keys type normally
- Left-click a line in the main field to seek to that line
- The .lrc file is watched for external changes (e.g. edits in Notepad) and reloads automatically
