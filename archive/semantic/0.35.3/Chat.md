# LineByLine 0.35.3 — Chat Log

## Turn 1

**Prompt:**

Version: Patch

Bugs:
- The 'batch split pasted or imported lyrics while checked' feature introduced in version 0.35.2 was supposed to loop through every lyrics line with parenthesized groups, splitting them as if the user pressed Ctrl+ArrowLeft on each of them. This doesn't work - only the manual Ctrl+ArrowLeft is able to split one line at a time.
- Pasting lyrics with [00:00.000] ms-precision timestamps adds no lyrics in both Hotkey and Typing modes, and triggers a fallback to default metadata fields which can be viewed in Typing mode. Only importing such lyrics as .lrc files works, truncating the extra digit.

Refinements:
- Manual Ctrl+ArrowLeft should also move the selected line down to the next line with both non-parenthesized lyrics and parenthesized groups (aka the next unprocessed line), else if no unprocessed line just move to the next line.

---

**Three fixes applied:**

Bug 1 — batchSplitParens skipped timestamped lines: The function had a guard `if(META_RE.test(l)||tsToMs(l)!==null||l.trim()==='')` that skipped any line with a timestamp. Imported .lrc content has timestamps on every lyric line, so the split never ran. Fixed by stripping the timestamp prefix before peeling, then re-prepending it to the parent line (inserted groups remain plain, as before).

Bug 2 — ms-precision timestamps on paste treated as section headers: `normalizeLrcTimestamps` (which truncates `[mm:ss.000]` to `[mm:ss.00]`) only ran during file import. On paste, `[00:00.000]`-style lines didn't match `TS_RE`, so `isHeader` returned true and `cleanPaste` stripped them. Fixed by calling `normalizeLrcTimestamps(text)` at the top of `cleanPaste` before any other processing — this covers all paste paths including Genius and secondary fields.

Refinement — cursor advance after Ctrl+ArrowLeft: After a successful split, `markAsTranslation` now advances `activeLine` (in hotkey mode) to the next unprocessed line — defined as the first lyric line after the inserted groups that still has a trailing parenthesized group. If no such line exists ahead, it falls back to the next lyric line of any kind. The same advance is applied to the normal (non-split) mark-as-translation path.

---

Just realized I forgot to tell Claude to add Ctrl+M to restricted in the redo of 0.35.2 so I added it manually before Ctrl+N.