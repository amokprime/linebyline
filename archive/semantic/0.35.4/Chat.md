# LineByLine 0.35.4 — Chat Log

## Turn 1

**Prompt:**

Comments: Ctrl+M missing from RESTRICTED_ALL — was supposed to be added in an aborted 0.35.2, added manually before Ctrl+N.

Version: Patch

Bugs:
- ensureLineByLineInRe hardcodes "LineByLine" instead of appending whatever is in the default [re:] field. Should read the URL from DEFAULT_META rather than hardcoding.

Clarification: append with ", " separator; e.g. [re: Genius] → [re: Genius, https://amokprime.github.io/linebyline/]. Don't hardcode the URL since it could change.

---

Two fixes applied:

Ctrl+M added to RESTRICTED_ALL before Ctrl+N, matching the manually applied change.

ensureLineByLineInRe renamed to ensureReTagDefault and rewritten to extract the default [re:] value dynamically from DEFAULT_META at call time. It checks whether that extracted value is already present in the tag (substring match), and if not, appends it with a ", " separator. Both call sites updated to the new name.

---

## Turn 2

**Prompt:**

Version: Same

Bugs:
1. When a song has an existing re tag and default re is changed (e.g. [re: asdf]): [re: Genius] → [re: Genius, https://amokprime.github.io/linebyline/] instead of [re: Genius, asdf].
2. When a song has no metadata at all and default re is changed (e.g. [re: asdf]): [re: asdf, https://amokprime.github.io/linebyline/] instead of just [re: asdf].

Clarification: still use substring match. Both bugs share same root — ensureReTagDefault reads DEFAULT_META (hardcoded constant) instead of cfg.default_meta (live localStorage value).

---

One-line fix: changed `DEFAULT_META.match(...)` to `cfg.default_meta.match(...)` in `ensureReTagDefault`. Since `cfg` is always loaded from localStorage (falling back to `DEFAULT_CFG`), this now reads whatever `[re:]` value the user has actually configured, making the append consistent with the editable Settings field.

---
