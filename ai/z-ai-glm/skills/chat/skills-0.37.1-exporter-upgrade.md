---
model: GLM-5.1
---
Reorganize old Sonar issues folder with new pattern specified in latest Python scripts and README.md.
Also apply the top to bottom sorting pattern for each JSON. Example used by the code:
```json
{
  "rule": "javascript:S2681",            ← which rule fired
  "component": "amokprime_linebyline:docs/index.html",  ← which file
  "line": 646,                           ← quick reference
  "textRange": { ... },                  ← precise location (small object)
  "message": "This statement will not...", ← what it says
  "severity": "MAJOR",                   ← how bad
  "type": "CODE_SMELL",                  ← what kind
  "cleanCodeAttribute": "FORMATTED",     ← quality attribute
  "cleanCodeAttributeCategory": "CONSISTENT",  ← quality category
  "impacts": [ ... ],                    ← impact details (array, multi-line)
  "flows": []                            ← code flow evidence (array, last)
}
```
Organize the issue folders into their original app version folders:
```
sonar_issues_reorganized/
	0.35.14/
	0.35.17/
	0.35.18/
	0.35.19/
	0.36.1/
	0.37.1/
```

---
Done! The issue folders are now organized under their original app version directories. Here's the new structure:

```
sonar_issues_reorganized/
  0.35.14/          ← 3 categories
  0.35.17/          ← 10 categories
  0.35.18/          ← 13 categories
  0.35.19/          ← 6 categories
  0.36.1/           ← 8 categories
  0.37.1/           ← 1 category
```

Each version folder contains its deduplicated category folders with the new pattern applied:

```
0.35.14/
  Refactor_this_function_to_reduce_its_Cognitive_Complexity/
    L468.json
    L588.json
    L845.json
    ...
    why.md          ← deduplicated within this version
    how.md          ← deduplicated within this version
  Refactor_this_code_to_not_nest_functions_more_than_4_levels_deep/
    L2163.json
    L2198.json
    ...
    why.md
```

The `issues/` subfolder nesting from the old pattern was dropped, and all other new-pattern transformations remain: trimmed folder names, `L{line}.json` naming, KEEP_FIELDS JSON field ordering, and deduplicated `why.md`/`how.md`.

---
Update sonarqube-workflow-SKILL.md for the new folder structure

---
Now let me identify all the sections that need updating. The key structural changes are:

1. **Intro paragraph** — references old "one subfolder per issue" with `where.json`
2. **Step 1** — describes old file layout and reading strategy
3. **Step 4** — references `where.json` by name

The new structure is:
- Version folders contain an `issues/` subfolder (separating issues from `linebyline-*.html` etc.)
- Inside `issues/`, one folder per **category** (not per instance), with trimmed names (no `_1`/`_2`/`_from_N_to_N_allo` suffixes)
- Each category folder has `L{line}.json` files (one per issue instance, named by line number) plus shared `why.md`/`how.md`
- No more `Index.md`
Let me verify the final file:
Updated `sonarqube-workflow-SKILL.md` with three changes:

1. **Intro paragraph** — replaced the old "one subfolder per issue with `where.json`" description with the new per-version category-grouped structure (`L{line}.json` files + shared `why.md`/`how.md`).

2. **Step 1: Parse the export** — completely rewritten:
   - Added a directory layout diagram showing `{version}/issues/{category}/L{line}.json`, `why.md`, `how.md`, plus the `linebyline-{version}.*` files outside `issues/`
   - Explains `L{line}.json` naming (including `_2` suffix for same-line duplicates) and lists the KEEP_FIELDS content
   - Documents trimmed category names (no `_1`/`_2` counters, no `_from_N_to_N_allo` suffixes)
   - Updated reading instructions: `why.md`/`how.md` are already deduplicated so read once; scan all `L*.json` files per folder for instances

3. **Step 4** — changed the `where.json` reference to `L{line}.json`