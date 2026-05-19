---
model: Sonnet 4.6
---
# Skill Updates — 2026-05-15

Companion to: `linebyline-section-index-SKILL.md` (update) and `sonarqube-workflow-SKILL.md` (new)

---

## Your prompt

> Based on what's changed since the last time your skills were updated (version 0.35.11), what skills would you update or add?

---

## Analysis

Reviewed SonarQube export zip (`issues-0.35.14`) containing 16 issue folders across two rules:

- `S7761` (prefer `.dataset`) — 1 instance, line 518
- `S2004` (nesting depth >4) — 5 instances, lines 2163–2251 (all in `buildHkRows`/Settings area)
- `S3776` (cognitive complexity) — 8 instances across functions at lines 588 (CC27), 901 (CC28), 959 (CC30), 993 (CC30), 1106 (CC16), 2045 (CC32), 2347 (CC31), 2407 (CC138)

Cross-referenced against v0.35.11–v0.35.18 history. These issues drove the Stages A–D CC remediation campaign (0.35.14–0.35.17) and the low-severity pass (0.35.18).

Two skills identified for action:
1. `linebyline-section-index` — version note and reference SECTIONS index were stale (labeled v0.35.10; current is v0.35.18 with shifted line numbers)
2. `sonarqube-workflow` — new skill warranted because SonarQube Cloud now scans every push; accumulated false-positive discipline, issue categorization patterns, and Won't Fix rationale formats are institutional knowledge that should persist across sessions

---

Your prompt

> Yes, update the index skill now and add the new sonarqube-workflow skill. SonarQube Cloud GitHub Action scans every push now.

---

## Changes made

### `linebyline-section-index` (updated)

- Updated version note in "Section list" heading from v0.35.10 to v0.35.18
- Added current SECTIONS index snippet showing the shifted tail section line numbers from memory (Settings search about 1928 through Init about 2556)
- Added clarifying note that earlier sections are unchanged from v0.35.10 and the embedded SECTIONS comment in the file remains authoritative

### `sonarqube-workflow` (new)

New skill covering the full SonarQube Cloud remediation workflow as practiced across v0.35.14–v0.35.18:

- Export parsing strategy (read Index.md first; read why.md/how.md once per unique rule)
- Rule catalog with fix guidance and false positive risk ratings for all rules encountered in this project
- Per-rule assessment cautions: for-of index usage, replaceAll quantifiers, String.raw false positive, Math.min/max non-numeric patterns, negated condition with no else
- Staged remediation order (simple substitutions first, nesting depth second, CC last)
- Won't Fix rationale templates
- Version/delivery guidance (patch release, no checklist for pure quality passes)
- False positive summary table

---
I forgot to upload the actual app to project files and have done so now. Take a more detailed look to make sure the index skill numbers/sections are up to date and that the other two skills don't need updating. Also, no need for the INDEX.md in the SonarQube skill as you have that whole skill to tell you what to read.

---
Two changes made:

**Section index:** The partial tail-only SECTIONS snippet I wrote earlier was replaced with the full verified line copied directly from the file. Every number checked out — all 30+ section markers match exactly. The note now correctly frames it as a reference copy that goes stale, reinforcing that the embedded comment in the file stays authoritative.

**SonarQube skill:** Removed the `Index.md` reading step. The skill itself is the guide; no need to tell it to read a file that just describes what the skill already covers.