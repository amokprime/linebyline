---
summary: A collection of bash script templates that zip Repomix files along with supporting files. For use with web chat agents like chat.z.ai.
links:
  - "[[ai/chat.z.ai/Repomix snippets|Repomix snippets]]"
---
### Usage
- Scripts default to the repo root `~/GitHub/linebyline`; set the `LINEBYLINE_ROOT` environment variable to point somewhere else
- `repomix` is looked up in `~/.npm-global/bin` and then the rest of `PATH`; install it there or adjust `PATH` in `.base.sh`
- If not on a Fedora distro, replace `wl-copy` with the equivalent
- Make the scripts executable and double-click them

### Features
- Fails fast in strict mode (`set -euo pipefail`): if repomix or zip fails, the script aborts before deleting anything or copying a stale path to the clipboard
- Zips the upload folder's visible files, then clears the folder so the next run starts fresh
- Runs one of the [[ai/chat.z.ai/Repomix snippets|Repomix snippets]], except for `blank.sh` which can be used for uploads of non-Repomix files
- `blank.sh` aborts with an error if the upload folder is empty (nothing to zip)
- Gives each zip file a unique name to prevent upload filenames colliding with stale server-side files. It's the current date in nanoseconds (`date +%s%N`), which should also help in tracing future upload bugs
- Copies the zip file's path to clipboard to paste into file picker path field when uploading
