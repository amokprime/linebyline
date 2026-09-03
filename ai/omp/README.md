### General workflow

The multi-phase JIT workflow used for chat.z.ai is largely unnecessary for OMP because it injects context files automatically. For most sessions, the default OMP system prompt + context files (which also end up in system prompt) are enough scaffolding.
- Draft prompts in advance in a markdown or text editor (i.e. Obsidian). Keep them scoped small enough to cover in a single session without compaction.
- Run `/path/to/real/omp/binary update` first. OMP is extremely bleeding edge and sometimes gets multiple releases in a single day. `/changelog` in an OMP session or checking GitHub releases is the most reliable way to learn about new changes (both official and unofficial docs lag).
- Use the default chat mode with advisor enabled. OMP calls chats "sessions". `omp --continue` resumes the last session. Or use `/resume` to find a specific session.
- If the agent has a misconception but is working on something useful, simply send a clarifying message mid-stream to "steer" it without stopping work.
- If the agent is way off, hit `Esc` to stop work and use `/tree` to return to your prompt, edit it, and regenerate.
- If the agent gets cutoff, send "." to resume.
- Some models may need to be reminded to use skills such as code-quality.
- Use `/git` to enter the git TUI and make commits (i.e. click "Stage all and commit"). If the commit role is configured, a conventional commit will be generated after a while (you'll get a chance to review first).

### Modes and keywords
- Use `/plan` to resolve dependencies and conflicts from previously brainstormed ideas (i.e. in default mode or external web chat) into a sane roadmap. The agent will give you multiple-choice questions to resolve conflicts. You can then transition directly into building, refine the plan with followup prompts, or save the plan to a file if it's expected to take more than one session without compacting (path is relative to project root).
- Use `orchestrate` to get the main agent to digest or research a large amount of information in parallel with subagents without blowing up its context window. Not suitable for information with many cross-connections.

### Resources
- https://nibblebot.github.io/oh-my-pi/
- https://ompsettings.wolfie.gg/
- https://askomp.wolfie.gg/