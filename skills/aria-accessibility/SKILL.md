---
name: aria-accessibility
description: Proactively avoid ARIA and accessibility issues in the LineByLine single-file HTML app. Use this skill whenever writing or modifying HTML structure, adding interactive elements, creating overlays/modals, adding labels or announcements, or changing any element that screen readers or assistive technology interact with. Also use when the user mentions accessibility, a11y, ARIA, axe-scan, WCAG, SonarQube rules S6819/S7927/S6825, or when building new UI components that need to be accessible. This skill prevents issues before they reach SonarQube or axe scans.
---

Codifies the accessibility issues that SonarQube Cloud (S6819, S7927, S6825) and axe-core scans have flagged in this project, so you can avoid them proactively rather than fixing them reactively.

---

Rule 1: Prefer semantic HTML over ARIA roles

Native HTML elements have built-in accessibility semantics, keyboard behavior, and browser support. Adding an ARIA role to a `<div>` gives it semantics but not behavior — you must implement all the interaction yourself. SonarQube S6819 flags every case where a semantic element exists for the role you're using.

When you write `role="X"`, check if there's a native `<X>` element instead:

| ARIA role | Use this instead | CSS reset needed |
|---|---|---|
| `role="region"` | `<section>` | None |
| `role="group"` | `<fieldset>` | `.hk-grid { border:none; margin:0; padding:0; min-inline-size:0 }` |
| `role="list"` | `<ul>` or `<ol>` | `.lyric-area { list-style:none; margin:0 }` |
| `role="status"` | `<output>` | None |
| `role="contentinfo"` | `<footer>` | None |
| `role="banner"` | `<header>` | None |
| `role="navigation"` | `<nav>` | None |
| `role="button"` | `<button>` | None |
| `role="dialog"` | `<dialog>` (or use `role="dialog"` with `aria-modal`) | None |

Exception: if the element has a custom mouse/keyboard interaction model that can't be replicated with the native element (e.g. mousedown+drag+wheel on a progress bar that can't be an `<input type="range">`), keep the ARIA role and document the Won't Fix rationale.

---

Rule 2: Accessible name must contain visible label text

SonarQube S7927 requires that the `aria-label` contains the visible text. Screen readers announce the `aria-label`, not the visible text. If they differ, voice-control users who say "click Add field" won't match an `aria-label` of "Add secondary field".

Apply it: `aria-label` must be a superset of the visible text. If the button says "Add field", the `aria-label` must be "Add field" (not "Add secondary field"). If visible text already describes the element, no `aria-label` is needed at all — the inner text is the accessible name.

Noncompliant:
```html
<button aria-label="Add secondary field">Add field</button>
```

Compliant:
```html
<button>Add field</button>
<!-- or if extra context is needed for screen readers: -->
<button aria-label="Add field">Add field</button>
```

---

Rule 3: Never put aria-hidden on focusable elements

SonarQube S6825 flags `aria-hidden="true"` on any element that can receive focus. This creates an impossible situation — the element is in the tab order (focusable) but invisible to screen readers. A blind user Tab-ing through the page will land on an element they can't identify.

To hide from both sighted and assistive technology users: use `display:none` or `visibility:hidden` — these remove the element from both the visual layout and the accessibility tree. To hide from screen readers only: use `aria-hidden="true"` but only on non-interactive elements (decorative icons, visual-only labels). Never combine `aria-hidden="true"` with `tabindex`, `href`, or any interactive behavior.

Noncompliant:
```html
<input type="file" id="file-picker" aria-hidden="true">
```

Compliant:
```html
<input type="file" id="file-picker" style="display:none">
```

---

Rule 4: Landmarks must be top-level

The `banner` landmark (and `contentinfo`) must be direct children of `<body>`, not nested inside `<main>` or other landmarks. axe-core flags nested landmarks.

`<header>` with `role="banner"` only at the top level of the page. Field header bars inside `<main>` should not use `role="banner"` — use `aria-label` on a plain `<div>` if naming is needed. `<footer>` with `role="contentinfo"` only at the top level; footers inside sections are just `<footer>` without the landmark role.

---

Rule 5: Color contrast must meet WCAG AA (4.5:1 for text)

axe-core flags low-contrast text. In this project, `--text-faint` (#9198a1) was only 2.73:1 — below the 4.5:1 AA minimum for normal text.

Timestamp text (`.ts`, `.end-ts`) must use at least `--text-muted` (#656d76) which provides sufficient contrast. When adding new text colors, verify contrast against both light and dark theme backgrounds. Large text (18px+ bold, 24px+ normal) only needs 3:1 contrast. Use a contrast checker tool if unsure.

---

Rule 6: Dialog/modal accessibility

Use `role="dialog" aria-modal="true" aria-labelledby="heading-id"` on modal windows. Provide a visible heading inside the modal that the `aria-labelledby` points to. Implement a keyboard focus trap (Tab/Shift+Tab stay inside the modal). Esc key closes the modal. On close, return focus to the element that opened the modal.

Exclude transient buttons (`.hk-clear`, `.hk-reset`, `.hk-replace`) from the Tab order — they appear/disappear contextually and shouldn't be persistent Tab stops.

---

Rule 7: Live regions for dynamic content

Use `aria-live="polite"` for non-urgent announcements (the assistive technology finishes speaking before announcing the change). Use `aria-live="assertive"` only for critical, time-sensitive information. Use `<output>` with `aria-live="polite"` for settings conflict messages. Use a hidden `#a11y-announcer` region with `aria-live="polite"` for programmatic announcements (auto-advance, sync events). Use `role="alert"` for inline warnings that need immediate announcement (trailing timestamp warnings, line count mismatch text).

---

Rule 8: Interactive elements need accessible names

Every `<button>`, `<input>`, `<select>`, `<textarea>` needs an accessible name (via inner text, `aria-label`, or `aria-labelledby`). Hotkey grid cells (`role="button"`) need `aria-label` describing the action. Secondary textareas need `aria-label="Secondary N lyrics"`. Import buttons need `aria-label="Import secondary lyrics file"`. Progress bars need `aria-valuetext` for human-readable current position.

---

Rule 9: Collapsed panels and inert

Use `panel.inert = true` when collapsing a panel — this removes all children from Tab order and screen reader navigation in one operation. Use `panel.inert = false` when expanding. Don't try to manually set `tabindex="-1"` on every child — `inert` handles it comprehensively.

---

Before adding any interactive or structural element, verify: you're using a semantic HTML element (not `<div>` + ARIA role); any `aria-label` contains the visible text; no `aria-hidden` on focusable elements; landmarks at top level only; text color contrast meets 4.5:1 AA; modals have `role="dialog" aria-modal="true" aria-labelledby`; dynamic announcements use `aria-live` or `role="alert"`; every interactive element has an accessible name; collapsed regions use the `inert` attribute.
