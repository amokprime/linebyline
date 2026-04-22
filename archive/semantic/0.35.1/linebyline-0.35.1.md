# LineByLine 0.35.1 — Chat log

## Prompt

Version
Patch
Bugs

* You've been seesawing between building the collapse panel icon vertically centered on the bar in 0.34.8, same height no bar just button in 0.34.9, back to center bar in 0.34.10, and now again same height no bar in 0.35.0. If there is a technical limitation forcing this dichotomy, just mark it as a known issue.
* The parenthesized groups aren't being moved to newlines so the entire parent line they're on is marked as translation as if it was just a regular line. Discuss options with me if looping through the whole parent line all at once to move the groups down and mark them isn't really feasible.

```
#Before Ctrl+ArrowLeft
[00:00.00] I wish I could identify that smell (J'aimerais pouvoir identifier cette odeur) (Ojalá pudiera identificar ese olor)
[00:03.06]

#After
[00:03.05] I wish I could identify that smell (J'aimerais pouvoir identifier cette odeur) (Ojalá pudiera identificar ese olor)
[00:03.06]

#Desired
[00:00.00] I wish I could identify that smell
[00:03.04] (J'aimerais pouvoir identifier cette odeur)
[00:03.05] (Ojalá pudiera identificar ese olor)
[00:03.06]
```

* Some lyrics, such as ones modified with https://seinopsys.dev/lrc, are precise to three decimal places (like `[00:00.000]` instead of `[00:00.00]`) instead of the two places expected by LRCGET - or LineByLine. Nothing that requires reading timestamps (i.e. `ASDFZXCV` `Ctrl+ArrowLeft`, seeking to a line, just to name a few) seems to work for such lyrics. However, LineByLine does work at `ms` precision in several places - could the timestamp controls account for it, or would it make more sense to truncate the third decimal place on import?

[Images: 0.34.10 (bar, centered), 0.34.9 (no bar, top), Desired (bar, top)]

### Bug 1 — Expand panel button
To clarify: see progression of three screenshots, with 3) being a rough MS Paint mockup of what I hoped to see

### Bug 2 — Split logic: the loop
Yes

### Bug 3 — Three-decimal timestamps
Option A-Truncate

---

## Response

**Bug 1 — Expand panel button:** The desired state is full-height left border (like 0.34.10) with the icon pinned to the top (like 0.34.9). No technical limitation. Fixed with `height:100%` + `align-items:flex-start` + `padding-top:6px`.

**Bug 2 — Split logic:** Rewrote the split branch to loop `_peelLastParen` until no groups remain, collecting all trailing `(...)` groups in one pass. Inserted in original left-to-right order after `targetIdx`, with timestamps `nextMs - N*10` through `nextMs - 10`. One press now fully splits all trailing groups.

**Bug 3 — Three-decimal timestamps (Option A):** Added `normalizeLrcTimestamps()` — strips the third decimal digit via regex replace. Called in both LRC import paths so `[mm:ss.000]` files are normalised before any further processing.

---
