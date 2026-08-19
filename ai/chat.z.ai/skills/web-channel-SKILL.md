---
name: web-channel
description: Behavioral rules for the chat.z.ai Agent web channel. Use this skill on every turn of every session — not just at onboarding — because the web channel is the only interaction surface and the agent is most likely to forget these rules in later turns as context compacts. Also use when the user mentions chat.z.ai, download folder, web chat, Agent mode, uploads, or when the agent is unsure about file visibility, output format, or comment density.
---

The chat.z.ai Agent web channel imposes constraints that differ from a local CLI or IDE. The agent cannot see the user's filesystem directly; deliverables must be copied to `download/` for the user to retrieve. The agent's context window compacts over long sessions, making early-turn instructions less reliable later — this skill exists to be re-read when that happens.

---

File visibility

The user can only see files inside `/home/z/my-project/download/`. Everything else (project tree, scripts, temp files) is invisible to them.

- Copy every deliverable to `download/` — the user cannot access other folders.
- Avoid subdirectories inside `download/` — the user cannot see them. Put files directly in `download/`.
- Don't clutter `download/` with compiled temporary files like `*.pyc`.
- Append a version number suffix (v1, v2…) to each unversioned artifact filename. The first unversioned upload is v1. This prevents accidental overwrites when the user re-downloads.
- Avoid spaces in filenames. The download system URL-encodes spaces as `+`, which can cause "Failed to download file" errors. Use hyphens or underscores instead (e.g. `Vibecoding-workflow.md` not `Vibecoding workflow.md`).

---

Input handling

- Stop immediately to request any missing uploads. Don't infer their contents — if the user refers to a file you haven't seen, ask for it.
- Read docs and manifests (i.e. `*.md`, `package.json`, `pyproject.toml`) before code (i.e. `*.html`, `*.js`, `*.py`). Documentation describes intent; code is the implementation. Reading docs first prevents misinterpretation.
- Follow obsidian-style links like `![[filename.png]]` (embed) or `[[filename]]` (non-embed) in the same-level 'attachments' subfolder.

---

Output format

- Don't generate Office documents or PDFs. Just output to chat in English.
- Implement the strongly dominant solution as a drop-in code file for the user to run and test. Only stop and ask if the user's intention or environment are unclear, or if multiple competing solutions exist.

---

Comment density

Avoid 3+ consecutive lines of source comments, both inline and multiline blocks like Python's `""" """`. Instead:

- Pair each non-trivial `name.ext` source file with a `name.md` readme, explaining intent, usage, suggested core patches (if a workaround or monkeypatch), and known limitations. If such a file is already provided, use it as a starting point.
- Don't use readmes as memory dumping grounds — preserve their structure for naive users and developers.
- Reserve 1-2 line source comments for non-obvious decisions like workarounds, deferred bugs, intentional smells.

---

Context compaction

The agent has a large native context (~200k tokens) but may compact or re-read uploaded files in later turns. This skill is designed to be re-read mid-session when the agent notices it's uncertain about channel rules. If you find yourself re-reading uploaded files, also re-read this skill — the channel rules are just as likely to have been forgotten as the file contents.
