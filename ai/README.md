---
summary: This folder holds human-facing reference docs for the chat.z.ai web-channel workflow. Agent-facing context files live at repo root (`AGENTS.md`, `MEMORY.md`, `skills/`, `scripts/`) — not in `ai/`.
links:
  - "[[ai/Vibecoding workflow|Vibecoding workflow]]"
  - "[[ai/Diagrammo flowcharts|Diagrammo flowcharts]]"
---
#### Working with GLM (web chat Agent mode)

Caveats to work around:
- I have noticed as many as 2k ads being blocked by uBlock Origin (you can install this on Helium and Microsoft Edge if not on Firefox)! It keeps ramping up over time, possibly causing unresponsiveness even in Chromium browsers. It may help to close the browser window and reopen the page (just reloading or closing the browser tab isn't always enough).
- A captcha slider randomly pops up sometimes while the agent works—avoid going fully AFK with the browser closed.
- Sandboxes expire after 2 hours. Typing something before it expires resets the timer to another 2 hours. Sometimes the agent can recover generated files anyway. Try sending a message like "Continue" to resume a cutoff chat. More recent (Sep 2026) chat sessions don't seem to occupy a specific sandbox that appears in web UI settings.
- Uploads may fail to update if certain filenames like file.md and Memory.md are re-uploaded without renaming them or zipping them in a uniquely named folder. If uploads generally fail, upload a file or zip to https://tmpfiles.org and share the link. The agent can download it into its sandbox with `curl`.
- Downgrade to a lower model, chats failing to submit or load or timing out, during peak hours. Use the 'previous flagship model' during off-peak hours to mitigate these issues.
- The "All files in task" download widget can go stale or disappear after multiple sandbox-side file operations. The agent will touch `download/` to force a refresh, and provide a fallback https://tmpfiles.org link in case that doesn't work.

The website auto-loads project skill descriptions (from `/home/z/my-project/skills/<name>/SKILL.md`) into the agent's `available_skills` list — but does NOT auto-load root `AGENTS.md` or `MEMORY.md`. For `AGENTS.md` and `MEMORY.md`, use the Espanso snippets in `scripts/espanso/linebyline.yml` (`:onb`, `:code`, `:skl` triggers) or copy paste to insert clone + read instructions.

chat.z.ai also had a more recent bug where the same named zip file can persist across sandboxes. This prevents the agent from reading future uploaded zips of the same name. So I use [scripts](https://github.com/amokprime/linebyline/tree/main/scripts/README.md) to generate the zip files with a unique name.