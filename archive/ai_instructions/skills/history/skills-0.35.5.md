I have attached chat transcripts for versions after the oldest updated skills, single-file-html-app and browser-hotkey-system. They are named the same as the html except for .md extension (matching my new project instructions). If you have no objections to that, check the transcripts  and the latest version of LineByLine (in project files) for unexpected difficulties, recurring pain points, lessons learned, or novel strategies that would be worth integrating, or stale references in any skill. Let me know if any of the chats are unclear.

---

Let me read the skill files and transcripts.
Now let me read the transcripts.
Good, I've read everything.
Let me now compile the findings.
Here's my full analysis across all transcripts and both skills:

---

**single-file-html-app skill**

Three things worth adding:

1. **Custom spinners over native `<input type="number">`** — the 0.34.4 transcript explicitly documents this lesson (native spinners are browser-inconsistent, ignore CSS vars). Worth adding a note to the number input pattern that recommends the `fs-spinner`/`fs-tick` div pattern and suppressing native spinners on any `type="number"` field.

2. **External unit labels** — same transcript explicitly resolved the inline-label vs external-label question: editable fields feeding into `cfg` should always use external `<span>` labels, never inline units. Worth a brief note in the file input/form section.

3. **Double `pushSnapshot` for undo/redo completeness** — this burned you in three separate places (0.34.6 `markAsTranslation`, 0.34.7 `mergeTranslations`, 0.34.5 lrc import). The skill's undo section only mentions `pushSnapshot()` before changes. It should note that operations replacing content wholesale need a second `pushSnapshot()` after the change to put the new state on the undo stack for redo.

---

**browser-hotkey-system skill**

Two things:

1. **`Ctrl+M` hardcoded mute** — the skill's `RESTRICTED_ALL` example doesn't include `Ctrl+M`, and it caused a real bug in 0.35.2 (other hotkeys could be remapped to it). Worth adding as a noted example of a hardcoded key that must appear in `RESTRICTED_ALL` even though it's not a browser default.

2. **Reset button visibility** — `updateResetVisibility` in the skill only checks `live !== def`. The app also shows the reset button when a restriction warning is active or a conflict is pending. The skill's version would hide the reset button in cases where the user needs it most.

---

**linebyline-section-index skill**

Two updates:

1. **Reference version is stale** — the section list says "as of v0.34.7" but the file is at 0.35.4 and several sections have been added or renamed (e.g. `ensureLineByLineInRe` → `ensureReTagDefault` in Paste/meta, the Confirm dialog stub still referenced).

2. **Prompt-to-section map gaps** — no entry for the `batchSplitParens` / mark-as-translation split logic (Sync/timestamp + Helpers → Paste/meta), and no entry for the collapse panel button (Button wiring + Init). Low priority but worth noting.

---

**No action needed on:**
- The versioning mishap in 0.34.9 — already resolved by the updated instructions.
- The 0.35.2 redo issue (aborted session, manually patched) — one-off, no systemic lesson.
- The trailing timestamp timing rework (0.34.9) — app-specific, not a skill pattern.

Want me to draft the actual edits for any or all of these?

---

All

---

Starting with the skills I can edit directly.Now the browser-hotkey-system skill:Now the section index skill:Now copy all three back to the skills directory and present:Summary of changes per file:

**single-file-html-app-SKILL.md** — Two additions: (1) double-`pushSnapshot` pattern for wholesale content replacement (before + after, not just before); (2) new "Number inputs with custom spinners" section covering the `fs-spinner`/`fs-tick` pattern, native spinner suppression CSS, external unit labels rule, and the empty-then-Enter revert pattern for `change` handlers.

**browser-hotkey-system-SKILL.md** — Two changes: (1) `Ctrl+M` added to `RESTRICTED_ALL` with a note explaining why (OS-level audio mute, hardcoded in many apps); (2) `updateResetVisibility` updated to also show the reset button when a restriction warning or unresolved conflict is active.

**linebyline-section-index-SKILL.md** — Three changes: (1) version reference updated from 0.34.7 to 0.35.4; (2) section list updated with renamed functions (`ensureLineByLineInRe` → `ensureReTagDefault`, `updateMergeUI` → `updateMergeBtn`/`checkLineCounts`) and newly added functions (`normalizeLrcTimestamps`, `batchSplitParens`, `markAsTranslation`, etc.); (3) two missing rows added to the prompt-to-section map (mark-as-translation/batch split, collapse/expand panel button).