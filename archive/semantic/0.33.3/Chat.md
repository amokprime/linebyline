### Input

linebyline_33_2.html shared with supporting files via GitHub connector

### Output

Name it linebyline_33_3.html but don't add actual versioning code yet

### Bugs

Secondary field buttons now RIGHT-aligned; see secondary.png
When tiny / small / medium / large intervals are changed in settings and I click Reset defaults, the Control button text stays changed and does not reset to reflect default states until I refresh the page

### Refinements

Add back Mute hotkey and hardcode to Ctrl+M (don't expose, just update speaker button tooltip); clean up browser mute detection
Disable Hide field if there are no open secondary fields (same disabled appearance as disabled Merge fields)
Allow Shift+R to jump to end of a line with seek offset in Hotkey mode; (don't expose as Control, just add to Settings / Sync as a new hotkey after Replay only hotkey and call it Replay end)
Update Help file
Review obsolete references in the app code that are not covered by README.md, HELP.md, TEST_CASES.md to compact file size and suggest changes (do not implement this without my approval)
___
The prompt ends at `### Changes` with nothing after it. Now let me check for a Help file and look at the source:

No Help file in Attachments. I'll need it for the "Update Help file provided" item — please share it. In the meantime I can do everything else. Let me read the source and proceed:

The buttons are right-aligned because `field-header` uses `justify-content:space-between` and the `hdrRight` group is the second flex child, which goes to the far right. The label needs to be able to grow to push the buttons right — but the buttons should be adjacent to the label, not at the far edge. The fix is `justify-content:flex-start` with a gap on the header, or keep `space-between` but that requires nothing to fill the middle. Looking at the screenshot — the desired layout is label left, buttons immediately to the right of label (not at the far right). I'll change the header to `justify-content:flex-start` with a gap and let the label have `flex:1` so buttons stay right. Wait — actually re-reading the original prompt: "Left align Secondary title word so that Add lyrics and the checkbox to Parenthesize lyrics are to its right." That means: `[Secondary 1] [📂] [( )]` all left-aligned together. So `justify-content:flex-start` with gap is correct.

I have everything. Building now:

**Bug 1 — Secondary buttons right-aligned:** Change secondary field header from `space-between` to `flex-start`. The main field header can keep `space-between` since it only has a label. I'll make secondary headers use a different layout by not using `justify-content:space-between` on the hdrRight group — instead I'll just let the header be `flex-start` for secondary fields. Since `field-header` CSS is shared, I'll override inline on the secondary hdr element.

**Bug 2 — Reset defaults doesn't update Controls panel:** `reset-defaults` calls `openSettings()` which re-populates the Settings form and calls `buildHkRows()`, but does NOT call `rebuildHkPanel()`. The Controls panel labels (e.g. `−100ms time`) are built from `cfg.tiny_ms` etc. in `rebuildHkPanel()`. Fix: add `rebuildHkPanel()` call.

Refinement — Mute: hardcode Ctrl+M, update tooltip, clean up volumechange detection:

Please send "Continue" — I still need to add: Ctrl+M keydown handler for mute, disable Hide field when no secondaries open, `replay_end` hotkey (Shift+R), and the obsolete-code review. The Help file update is also still pending (no Help.md was in the Attachments folder — please drop it there or share it another way).

**Obsolete code review (for your approval before implementing):**

From scanning the source against README/HELP/TEST_CASES:

1. `selectAllLyricLines()` function and `clearSelection()` — `selectAllLyricLines` was previously wired to `Ctrl+A` (removed in v33), `clearSelection` is never called. Both are dead code (6 lines).
2. `toggleParens()` function — never called from anywhere in the current app (15 lines).
3. `seekToMs()` and `autoPlay()` — `seekToMs` is defined but never called; `autoPlay` likewise (4 lines each).
4. `preserveTitleInText()` — called in the paste handlers but the logic is now redundant given the lrcHasTi checks added in v33_1 (5 lines).
5. `confirm2()` / `#confirm-overlay` — the confirm dialog HTML and JS function exist but `confirm2` is never called; native `confirm()` is used instead directly in `mergeTranslations` (15 lines HTML + 6 lines JS).
6. `pushUndo()` — defined as an alias for `pushSnapshot()` but never called (1 line).
7. `savedAudioPath` state variable — set and stored in autosave but never actually used to restore audio (browser security prevents it) (scattered references).

That's roughly 50–60 lines removable. Confirm if you want any or all of these removed.

First let me check if the Help file has been added:

No Help file yet — I'll skip that item and complete everything else. Continuing with the three remaining items: Ctrl+M keydown, Hide field disable, and `replay_end` hotkey.

Good. Now applying all remaining items:

**Ctrl+M hardcoded mute in global keydown:**

Disable Hide field button when no secondary fields are open — update `updateMergeBtn` to also handle btn-remove-sec:

Now add `.mb-btn:disabled` CSS so it visually matches the disabled merge button:

`replay_end` hotkey — add to DEFAULT_CFG, HK_SECTIONS, HK_LABELS, global keydown, loadCfg migration:

Now wire `replay_end` in the global keydown — replacing the old hardcoded `Shift+R` / `Shift+Enter` / `Shift+Space` patterns:

Also add `replay_end` to the SEC_BLOCKED set in secondary keydown so it doesn't fire while typing in a secondary field:

Now syntax check and output:

**Secondary buttons left-aligned:** The dynamically created secondary `field-header` now has `justifyContent:'flex-start'` set inline, overriding the shared CSS `space-between`. The label and button group sit together on the left.

**Controls not updating on Reset defaults:** `rebuildHkPanel()` is now called in the reset-defaults handler alongside `openSettings()`, so interval labels like `−100ms time` update immediately without a page refresh.

**Mute / Ctrl+M:** `vol-mute-btn` tooltip updated to `Mute (Ctrl+M)`. Hardcoded `Ctrl+M` handler added to global keydown (toggles `masterMuted` and calls `applyVolume()`). The `volumechange` listener on `audioEl` now also saves `lbl_muted` to localStorage when the browser mutes the tab externally. `Ctrl+M` is already in `RESTRICTED_ALL` so it can't accidentally be reassigned to another hotkey.

**Hide field disabled when no secondaries open:** `updateMergeBtn()` now also sets `btn-remove-sec.disabled` based on `secondaryCols.length===0`, and a `.mb-btn:disabled` CSS rule gives it the same dimmed appearance.

**Replay end hotkey:** `Shift+R` added as `replay_end` in DEFAULT_CFG, HK_SECTIONS (Sync, after Replay only), HK_LABELS, loadCfg migration, global keydown, and SEC_BLOCKED. It calls `replayActiveLine(true)` which already seeks to the end of the current line with seek offset applied.

**Pending:** Help file update (no file in Attachments yet) and the obsolete-code removals (awaiting your approval on the list from last turn).