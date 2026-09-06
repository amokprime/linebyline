# LineByLine — durable memory seed

Harness-agnostic, git-tracked memory for AI coding agents. ZCode bootstraps its machine-local memory from this file; OMP's frozen snapshot of the same content lives at `ai/omp/learned.md`. When a turn produces a durable fact (architectural decision, bug pattern, critical constraint, project invariant), update this file.

## Architectural decisions

- activeLine / playingLine split (0.35.13): activeLine = navigation cursor (.cursor class), playingLine = audio highlight (.active class). Navigation moves the cursor; only sync, play, and click set the playing highlight. updateActiveLineFromTime places the highlight when audio reaches lineTs.
- insertEndLine three-tier logic (0.35.13): (1) if activeLine is a trailing ts, update in place; (2) if the next non-blank line after activeLine is a trailing ts, update in place; (3) otherwise insert new.
- TYPING_AVAILABLE set (0.37.0): keeps play_pause, prev_line, next_line enabled in Typing mode with mode-specific hotkey displays. play_pause shows Space in hotkey mode, Ctrl+Space (from play_pause_alt) in typing mode. prev_line shows Q ↑ in hotkey mode, ↑ only in typing mode. next_line shows E ↓ in hotkey mode, ↓ only in typing mode.
- Swap-button conflict resolution (0.37.0): when a conflict is detected, the Swap button swaps hotkeys between the current action and the conflicting action — no blank hotkeys left over. Reset-to-default uses the same swap pattern (gives any holder of that default its own default back).
- hasLyricContent() guard (0.35.11): prevents syncLine, insertEndLine, maybeAppendTrailingTs from inserting useless [00:00.00] lines when no line has text content.
- All assembly-site newline convention (0.35.11): all four LRC assembly sites (import, paste, merge, sync) use exactly one blank separator line. The shared helper is mergedMeta.trimEnd() + '\n\n' + lyrics.

## Bug patterns

Fix once, audit after every refactor.

- Helper extraction can delete callees. _peelLastParen was deleted during Stage C refactoring (0.35.15) and broke batchSplitParens at runtime. After extracting any helper, audit all pre-existing callees in the refactored section. Codified in code-quality skill.
- String assembly with conditional separator: tsPrefix + ' ' + content with .replace(/^ /,'') strips the space from [mm:ss.cc] text when content is non-empty but no paren groups. Fix: tsPrefix + (tsPrefix && content ? ' ' + content : content). Codified in code-quality skill.
- Dynamic config reads vs hardcoded constants. Reading DEFAULT_META (constant) instead of cfg.default_meta (live value) means UI changes have no effect. Codified in code-quality skill.
- Braceless-if ambiguity (S2681). A single-line if(x)y; makes the following statement look conditional. Always use braces. Codified in code-quality skill.
- META_RE false positive on Genius headers. /^\[[a-zA-Z]+:/ matches both LRC tags ([ti:..]) and capitalized Genius headers ([Intro: All], [Chorus:..]). Fix is local to _findGeniusLyricStart using /^\[[A-Z]/.test() — do NOT change META_RE globally, 30+ other usages depend on it.
- State variable disagreement. When two variables track the same concept (e.g. masterVolume + masterMuted), they can disagree, causing subtle bugs. Pick one as authoritative; derive the rest. Codified in code-quality skill.

## Critical constraints

Do not violate.

- MAX_LINES=500. Import and paste handlers reject content over the limit with alert. addSecondary() enforces a 10-field cap.
- Test entry point is agent-tst, never raw npx playwright. The wrapper hides the SSH test infrastructure; bypassing it triggers a master-key path. See AGENTS.md.
- Underscore prefix on auto-setup fixtures. Renaming workaroundPaste to _workaroundPaste silences tsserver TS6133.
- SonarQube S3776 CC threshold = 15 per function. Helper extraction and dispatch tables are the durable mitigations. See code-quality skill.
- Undo/redo single-push model (post-change only), except for wholesale content replacement (import, merge, paste) which needs pre + post. See code-quality skill.
- applySnapshot must clear extra secondaries beyond snapshot's secondaries.length, or undoing to a pre-add snapshot leaves stale content in still-visible textareas.
- beforeunload must check all secondary textareas, not just the main one, or secondary work is lost without warning.
- All four LRC assembly sites (import, paste, merge, sync) use mergedMeta.trimEnd() + '\n\n' + lyrics for exactly one blank separator. Inconsistent separator counts cause blank-line mismatches between main and secondary fields.

## Project invariants

- All app code lives at docs/index.html. No build step, no external font dependencies, no Python/PyQt port. The Python port was abandoned in 0.34.5; web is the only forward path.
- The app version is encoded in title, not in the filename. Patching script alone is incomplete — the version bump must land in both title and the script body.
- The app is LRC-focused, but has Genius paste. Genius scraping is delegated to a browser extension (cross-origin blocks prevent in-app fetching); in-app extraction is structural parsing of pasted text.
- No external fonts. Google Fonts was removed in 0.34.5. system-ui, sans-serif resolves differently across OSes and is the source of font-fragile screenshot tests.
