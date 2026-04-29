# LineByLine 0.35.15

## Stage C — SonarQube fixes: cognitive complexity medium wins

### My prompt
Latent bugs from linebyline-0.35.14.md successfully patched. Begin Stage C.

---

Four cognitive complexity reductions, all by extracting helper functions. No functional changes.

**`cleanGenius` (28 → about 8): extracted `_findGeniusLyricBounds(lines)` and `_filterYmal(lyricLines)`**
The start/end detection block moved to `_findGeniusLyricBounds`, returning `{start, end}` or null. The "You might also like" filter loop moved to `_filterYmal`. The two duplicate regex patterns for section-header stripping in the final filter were collapsed to one (both matched `[.{2,50}]` without a TS, so the narrower `[^\]]+` check was redundant). `cleanGenius` body is now 6 lines.

**`extractGeniusMeta` (30 → about 6): extracted `_extractGeniusFields(head)`**
The three sequential scan loops (for artist, title+artist fallback, album) moved to a named helper that returns `{title, artist, album}`. `extractGeniusMeta` now destructures one call.

**`batchSplitParens` (34 → about 12): extracted `_assignInterpolatedTs(out)`**
The second-pass timestamp interpolation loop (find un-timestamped runs, bracket them between prevMs/nextMs, assign offsets) moved to a named helper called at the end of `batchSplitParens`.

**`markAsTranslation` (40 → about 14): promoted `findNextMs` + extracted `_advanceAfterSplit`**
The inner `findNextMs` closure was promoted to a module-level named function `_findNextTimestampMs(lines, fromIdx)` — also reused by both the split-mode and normal paths (eliminating a duplicated `for` loop). The hotkey-mode advance block inside the split path moved to `_advanceAfterSplit(updatedLines, afterInserted)`. The dead `if(groups.length===0){// fall through}` no longer needs an explicit else — the split block simply returns early when `groups.length > 0`.

SECTIONS index updated for shifted line numbers.

---

## Regression fix: missing `_peelLastParen` + checklist wording

### My prompt

### Version
Same

### Bugs

- All tests + 1 extra failed, regressing from 0.35.14
	- "↩" checkbox checked after import causes `Ctrl+ArrowLeft` to convert inline lyrics and then navigate to the next line (folder 3.2)
		- Nothing happened after I checked "↩", selected a line with inline lyrics, and pressed `Ctrl+ArrowLeft`
	- "↩" checkbox checked *before* import batch converts inline lyrics on both open and paste, matching example.txt (folder 3.2)
		- You didn't check this for me, I just suspected it might be in the blast radius
			- Indeed, nothing happens - no lyrics are imported at all!
	- Lyrics paste extract Genius metadata and lyrics
		- This fails if "↩" checkbox checked
- Revert rewritten checklist tests to original wording:
```
#Rewritten
- [ ]  with `Ctrl+ArrowLeft` when checked and not otherwise, in both Hotkey mode and Typing mode, matching example.txt (folder 3.1)
#Original
- [ ] "( )" checkbox wraps lines marked as translations with `Ctrl+ArrowLeft` when checked and not otherwise, in both Hotkey mode and Typing mode, matching example.txt (folder 3.1)

#Rewritten
- [ ]  `Ctrl+ArrowLeft` to convert inline lyrics and then navigate to the next line (folder 3.2)
#Original
- [ ] "↩" checkbox checked after import causes `Ctrl+ArrowLeft` to convert inline lyrics and then navigate to the next line (folder 3.2)
```

---

**Root cause:** During Stage C, the `_peelLastParen` function was accidentally deleted. It originally lived just before `batchSplitParens` in the Sync/timestamp section, but the replacement block that introduced `_findNextTimestampMs`, `_assignInterpolatedTs`, and `_advanceAfterSplit` omitted it. Every path touching `batchSplitParens` or `markAsTranslation` threw a ReferenceError at runtime, explaining all three test failures:

- **"↩" checked after import + `Ctrl+ArrowLeft`** — `markAsTranslation` calls `_peelLastParen` in split mode → ReferenceError → nothing happened
- **"↩" checked before import** — `batchSplitParens` calls `_peelLastParen` → ReferenceError → import silently failed (the `batchSplitParens` call in the paste/open handler threw before writing anything)
- **Genius paste with "↩" checked** — same `batchSplitParens` path

Fix: restored `_peelLastParen` as a named module-level function immediately before its first caller (`_advanceAfterSplit`). No logic changes; it is the original implementation verbatim.

**Checklist wording:** Two items in checklist-0.35.15.md had their label prefix stripped (rendered as bare `\x01` control character). Restored to original wording:
- `"( )" checkbox wraps lines marked as translations with Ctrl+ArrowLeft …`
- `"↩" checkbox checked after import causes Ctrl+ArrowLeft …`

SECTIONS index updated (Secondary onward shifted +12 lines).

---

## Bug fix: missing space between timestamp and lyric after batch split

### My prompt

### Version
Same

### Bugs
- "↩" checkbox checked *before* import batch converts inline lyrics on both open and paste, matching example.txt (folder 3.2)
	- This has a latent syntax failure: spaces before the main lines aren't preserved with the import
```
#Original inline lyrics (millisecond timestamps are just for QA testing convenience; [00:00.00] timestamps are affected too)
[ti: I Wish I Could Identify That Smell]
[ar: The Jazz Kissingers]
[al: microSong Entries]
[re: LineByLine]

[00:00.000] I wish I could identify that smell (J'aimerais pouvoir identifier cette odeur) (Ojalá pudiera identificar ese olor)
[00:03.060] That smell (Cette odeur) (Ese olor)

[00:06.350] It disturbs my concentration (Cela perturbe ma concentration) (Me altera la concentración)
[00:08.080] And it bothers me to hell (Et ça me dérange au plus haut point) (Y me molesta muchísimo)
[00:09.910] Oh, I wish I could identify that smell (Oh, j'aimerais pouvoir identifier cette odeur) (Oh, ojalá pudiera identificar ese olor)
[00:12.120]

#Manual Ctrl+ArrowLeft
[ti: I Wish I Could Identify That Smell]
[ar: The Jazz Kissingers]
[al: microSong Entries]
[re: LineByLine, https://amokprime.github.io/linebyline/]

[00:00.00] I wish I could identify that smell
[00:03.04] (J'aimerais pouvoir identifier cette odeur)
[00:03.05] (Ojalá pudiera identificar ese olor)
[00:03.06] That smell
[00:06.33] (Cette odeur)
[00:06.34] (Ese olor)

[00:06.35] It disturbs my concentration
[00:08.06] (Cela perturbe ma concentration)
[00:08.07] (Me altera la concentración)
[00:08.08] And it bothers me to hell
[00:09.89] (Et ça me dérange au plus haut point)
[00:09.90] (Y me molesta muchísimo)
[00:09.91] Oh, I wish I could identify that smell
[00:12.10] (Oh, j'aimerais pouvoir identifier cette odeur)
[00:12.11] (Oh, ojalá pudiera identificar ese olor)
[00:12.12]

#Automatic batch conversion on import
[ti: I Wish I Could Identify That Smell]
[ar: The Jazz Kissingers]
[al: microSong Entries]
[re: LineByLine, https://amokprime.github.io/linebyline/]

[00:00.00]I wish I could identify that smell
[00:03.04] (J'aimerais pouvoir identifier cette odeur)
[00:03.05] (Ojalá pudiera identificar ese olor)
[00:03.06]That smell
[00:06.33] (Cette odeur)
[00:06.34] (Ese olor)

[00:06.35]It disturbs my concentration
[00:08.06] (Cela perturbe ma concentration)
[00:08.07] (Me altera la concentración)
[00:08.08]And it bothers me to hell
[00:09.89] (Et ça me dérange au plus haut point)
[00:09.90] (Y me molesta muchísimo)
[00:09.91]Oh, I wish I could identify that smell
[00:12.10] (Oh, j'aimerais pouvoir identifier cette odeur)
[00:12.11] (Oh, ojalá pudiera identificar ese olor)
[00:12.12]
```

---

**Root cause:** `batchSplitParens` strips the leading space from lyric content when it slices the timestamp prefix (`l.slice(10).replace(/^ /,'')`), then rebuilds the line as `tsPrefix + ' ' + content`. The final `.replace(/^ /,'')` was intended to handle the un-timestamped case (where `tsPrefix` is empty and the `' '+content` expression would otherwise leave a spurious leading space), but it unconditionally ran on the full assembled string — which for timestamped lines is `[mm:ss.cc] text`. Since the regex anchors to `^`, this normally doesn't fire. However, for lines where *all* parenthesized groups were peeled and `content` is empty, the expression produces `[mm:ss.cc]` correctly. The actual failure is when `groups.length === 0` (no peeling happened): the expression `(content ? ' '+content : content)` produces `' I wish...'`, and `.replace(/^ /,'')` strips that leading space, yielding `[mm:ss.cc]I wish...`.

Fix: replace `.replace(/^ /,'')` with an explicit condition — only insert the space when `tsPrefix` is non-empty and `content` is non-empty: `tsPrefix+(tsPrefix&&content?' '+content:content)`. This correctly handles all four cases (ts+content, ts only, content only, neither).

---
