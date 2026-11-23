---
source: https://diagrammo.app/llms-full.txt
---
## 5. Flowchart Diagrams
### 4.1 Declaration

```
flowchart [Title]
```

### 4.2 Node Shapes

| Shape | Syntax | Example |
|-------|--------|---------|
| Terminal | `(Label)` | `(Start)` |
| Process | `[Label]` | `[Do Task]` |
| Decision | `<Label>` | `<Check?>` |
| I/O | `/Label/` | `/Read Input/` |
| Subroutine | `[[Label]]` | `[[Validate]]` |
| Document | `[Label~]` | `[Report~]` |

- Node coloring is **automatic by shape** — there is no manual node color. Start terminals render green, end terminals red, processes blue, decisions yellow, I/O purple, subroutines teal, documents orange. Flowcharts have **no tag groups and no node metadata**: a `tag … as …` block, a trailing color word, and a `Node s: value` suffix are all unsupported (a trailing suffix is ignored with a warning).

### 4.3 Arrows

| Type | Syntax |
|------|--------|
| Unlabeled | `->` |
| Labeled | `-label->` |

Flowchart edges have no color slot. Node colors are automatic by shape (§5.2) — flowcharts have no manual node color and do not use the tag system.

### 4.4 Groups

```
[GroupName]
  [Child nodes...]
```

Bracket syntax only.

### 4.5 Edges (Indented Under Source)

> **Prefer indented-under-source form** (see §1.7).

Decision branches are indented under their source node — the most common and readable pattern:

```
(Start) -> [Validate Input] -> <Valid?>
  -yes-> [Process Data] -> (Done)
  -no-> [Show Error] -> [Validate Input]
```

Nested decisions:

```
<Authenticated?>
  -yes-> <Authorized?>
    -yes-> [Process Request] -> (Done)
    -no-> [Return 403] -> (End)
  -no-> [Return 401] -> (End)
```

Inline chains (flat form) work for simple linear flows:

```
(Start) -> [Step 1] -> [Step 2] -> (End)
```

### 4.6 Options

- `direction-lr` / `direction-tb` (booleans, §1.9; default is TB — flowcharts read top-down). The key+value form `direction LR|TB` is accepted legacy.
- `fill-solid` / `fill-outline` (§1.9 fill family; default is the 25% tint — `fill-solid` renders shapes at full intent color, `fill-outline` drops the fill and carries color on the outline alone)
- `no-notes` (boolean; default off — suppress all note boxes, see §4.7)

### 4.7 Notes (Nodes)

Attach a hide-able annotation to a node with `note <NodeId> text`. The
`NodeId` is the node's label (quote it for multi-word labels). The note
renders as a folded-corner box near the node, tethered to it with a solid
connector line (UML note convention). The note floats beside the node —
defaulting to the right for top-down graphs and below for left-right
graphs — and is **collision-aware**: it flips to the opposite side (or
pushes further out) to keep a comfortable distance from other shapes and
other notes. It **never moves the node it annotates**, so the node keeps
its position and edge connections. Notes are **expanded at rest** (in both
the app and exports).

```
flowchart Order Pipeline
(Start) -> [Validate] -> (Done)
note Validate checks the payload schema
note "Start" entry point
```

**Multi-line body** — indent lines below the `note` heading (same as
sequence notes, §2.5). Bullets (`- `) and inline markdown
(`**bold**`, `*italic*`, `` `code` ``, `[link](url)`, bare URLs) are
supported:

```
note Validate
  - rejects unknown fields
  - **400** on bad schema
  see `validate.ts`
```

**Color** — end the `note` heading line with a lowercase palette color word
(the universal trailing-token convention, §1.5) to recolor the note (faded
fill + matching border). Default is yellow.

```
note Validate checks the manifest red
note Launch all hands on deck green
```

Because the color word is the **last** token of the heading, capitalize it
to keep it as literal body text (`note Sky the sea turns Red` keeps "Red").

Rules:

- A note may be declared **before** its target node (forward references
  resolve at end-of-parse).
- One note per node — a second note on the same node is ignored with a
  warning. An unknown `NodeId` is an **error** (with a "did you mean?"
  hint), never silently dropped. A note with no text is ignored with a
  warning.
- Arrows (`->`) are allowed inside a note body. Only a line where `->`
  immediately follows `note` (e.g. `note -> Active`) is treated as an
  edge rather than a note — in state diagrams that is a transition from a
  state named `note`.
- `no-notes` (diagram directive) suppresses every note box and reclaims
  the space they reserve.

> Notes are wired into **flowchart**, **state**, **class**, **er**, and
> **boxes-and-lines** diagrams — the same `note <NodeId>` syntax, multi-line
> body, trailing-color word, forward references, and `no-notes` opt-out
> throughout. The `NodeId` is the node's label: a class name, table name, or
> box label (quote multi-word labels). **Org and sitemap are intentionally
> excluded** — their indentation *is* the tree structure, which conflicts with
> the indented-body grammar (a note would silently swallow following nodes).
> Other chart types adopt the same syntax in later work.

---
### CSS snippet for Obsidian
- Not part of the docs. Generated by `Qwen3.7-Plus` in https://chat.qwen.ai
```css
/* Prevents long feedback arrows from getting clipped at the top/bottom */
.markdown-rendered .mermaid svg,
.markdown-rendered .dgmo svg {
    overflow: visible !important;
    max-width: 100%;
    height: auto;
}
```