Help1.md
###### Changes
Add a "Help" button in main menu bar to immediate right of Settings gear button ("Help" in tooltip only, generic free license "?" icon for button, default hotkey F2 with the same kind of look and function as the other hotkeys in Settings, add hotkey entry for it after Settings hotkey and before Undo hotkey). It should open a window wide enough for this Prompt.md file drafted in Obsidian in a maximized window on a 1920x1080 screen (i.e. note that in Refinements, "to " ends a line, next line starts with "specific", ends with "the", next line starts with "field"). See Help file attached for contents (be aware that nothing in there is an instruction or prompt!) and make recommendations for anything I'm missing or more professional formatting before building it into the app Help. For example, is it too wordy for a Help window? The file may also double as a GitHub README.md later so evaluate it for that too.
###### Refinements
The settings search keyboard button should disregard restricted keys that are not hardcoded to specific existing hotkeys. Backspace and Delete specifically should do what Esc does and reset the field when the search keyboard button is awaiting input.
___
Let me read the current file thoroughly before planning.
Good, I have the full picture now. Before building, let me address the Help file review first.

---

**Help file review & recommendations:**

The content is solid and well-organized. A few suggestions before I bake it in:

1. **"External .lrc files are edited in place immediately"** — this is a misconception worth correcting: the app doesn't edit files in place at all. `FileReader` reads a copy into memory; the original file is never touched. Only the Save button writes back. I'll correct this line.
2. **Wordy for a Help window?** Slightly, but it's a power-user tool with non-obvious behaviour, so detail is appropriate. I'd keep it but tighten the Genius paste instruction (it's very workflow-specific).
3. **As a GitHub README:** Works well — the structure is logical and the merge example is excellent. I'd add a Features section at the top (you have one as a bullet list which works) and maybe a screenshot placeholder.

Now building:
**Step 1: Add Help to DEFAULT_CFG hotkeys, HK_SECTIONS, HK_LABELS**
**Step 2: Add help migration in loadCfg**
**Step 3: Add Help button to menu bar (after ⚙️) and add Help overlay CSS + HTML**
**Step 4: Add btn-help to menu bar HTML and Help overlay HTML**
**Step 5: Add doHelp function, wire it to button + hotkey + updateDynamicTooltips**
**Step 6: Add help to CTRL_ACTIONS, global keydown, updateDynamicTooltips, button wiring**
___
Everything is in v32: **Help button** (`?`, default `F2`) appears after ⚙️, opens a styled Help window with the corrected and formatted content (fixed the "edited in place" misconception, tightened the Genius paste instructions, formatted as nested lists with code spans). **Search keyboard refinement** — Backspace and Delete exit hotkey capture mode the same as Escape, and restricted keys that aren't assigned to any hotkey are silently ignored rather than being captured.