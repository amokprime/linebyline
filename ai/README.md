---
summary: This folder holds human-facing reference docs for the chat.z.ai web-channel workflow. Agent-facing context files live at repo root (AGENTS.md, MEMORY.md, skills/, scripts/) — not in ai/.
links:
  - "[[ai/Vibecoding workflow|Vibecoding workflow]]"
  - "[[ai/Diagrammo flowcharts|Diagrammo flowcharts]]"
---
### Working with [chat.z.ai](https://chat.z.ai/) (GLM)
Last updated November 2026:
- Use a browser that can install uBlock Origin (i.e. Helium, LibreWolf, Firefox, Microsoft Edge). If the blocked count approaches ~1k or you notice sluggish rendering, try hard refreshing the page (`Ctrl+Shift+R`)
- Pick a 'previous flagship model' during off-peak hours to ensure stability
- You might need to complete a captcha every turn (especially after turn 1 or coming back the next day) to submit additional prompts
- The sandbox may reset within a few hours, clearing any files you uploaded (whether local or "Cloud"). This does not clear files the AI generated. Scope sessions to fit in a short block.
- Projects have a "Sources" tab where files can be uploaded. Unlike "Cloud", the agent is aware of files uploaded here and can be instructed to read them anytime; you don't need to manually upload a file. This cannot be used for persistent instructions like `AGENTS.md`/`SKILL.md` because sources are not injected into context every turn (unlike Project instructions and the agent's skills folder)
- There is a daily usage limit (**~45M**).
- Models may **compact every single turn**! Therefore, try to one-shot the bulk of the work in the first turn. For followup turns:
    - The sandbox `/home/z/.zcode/AGENTS` is platform-owned. LineByLine's `AGENTS.md` is shrunk to fit the Project instructions' 5000 character limit. These and skill descriptions of skills the agent copies into `/home/z/my-project/skills/` are re-injected into context every turn. Projects instructions can't be edited. When `AGENTS.md` changes, create a new project and paste them in again. Move old chats over if preserving them.
    - LineByLine's `AGENTS.md` points to a more detailed `skills/linebyline/SKILL.md`. The agent copies the repo's skills into the sandbox skills folder (`/home/z/my-project/skills/`) via a setup script (`skills/delivery/scripts/setup-sandbox.sh`) so their frontmatter descriptions auto-load into the agent's context every turn
    - The platform also keeps a per-user **skill pool** (`/home/user_skills/`): one `<name>.zip` plus one hidden `.<name>.usermark` per uploaded skill. Pool zips are snapshotted at upload/install time and **never refreshed** — every sandbox boot re-seeds them into the skills folder as-is
	    - Verified Nov 24, 2026: the pool's copies of repo skills were frozen at their Oct 6 upload, and a deprecated skill kept resurrecting from its pool zip after repeated cleanups. Whether the pool is scoped to this Project or global across Projects is unverified — treat it as global
	    - Skill shape 1 — **session-only**: repo skills like `linebyline`/`delivery` are (re)installed by `setup-sandbox.sh` each session. At session end (when asked to wrap up), the agent runs `cleanup.sh --all`, removing them from the skills folder **and** the pool so nothing persists into a fresh standalone chat or another Project
	    - Skill shape 2 — **global**: a skill wanted in every session (uploaded via the web UI) stays in the pool untouched — `cleanup.sh` only removes explicitly-listed or repo-derived LineByLine names, never platform built-ins (`charts`, `docx`, `LLM`, …) or unknown pool entries. Retire one deliberately with `cleanup.sh <name>` (skips artifacts already gone)
    - `setup-sandbox.sh` calls `cleanup.sh --all` before installing, so skill names deleted from the repo (tracked in `cleanup.sh`'s `KNOWN_STALE_SKILLS` with deletion tranche + reason) can't survive a session either
    - Use `scripts/zip.sh` to upload local untracked changes. It autoruns `scripts/diff.sh` to generate git patches which LineByLine's `AGENTS.md` instructs the agent to apply to its sandbox clone
    - Steering messages (followup prompts) can be queued while the agent is working. The "Send now" button ends their current turn and probably triggers compaction
- The GitHub plugin allows the agent to read and make changes to one or more repos in the connected GitHub account. This bypasses local `git` and commits directly through GitHub API (you should get a chat.z.ai approval popup). It can also open issues and PRs and read GitHub workflows (like Copilot). Plugins only load for a single turn at a time and sometimes `@GitHub` doesn't work. So use `git clone` to ensure the agent has a session-persistent copy for multi-turn changes.
- Uploads may fail to update if certain filenames like file.md and Memory.md are re-uploaded without renaming them or zipping them in a uniquely named folder. If either uploads or downloads start to fail, upload a file or zip to https://tmpfiles.org and share the link. The agent can download it into its sandbox with `curl`.