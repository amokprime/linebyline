<script setup lang="ts">
// Editor area — structure ported from the monolith (#editor-wrapper >
// #editor-scroll > #editor-area > the main field column: header with the
// paren-wrap "( )" and split "↩" toggles, warn bar, lyric line list, and the
// raw textarea behind it). The field column is the tranche-3 layout shell:
// line rendering, textarea contents, the two checkboxes and the warn bar all
// bind to Phase D state composables; secondary field columns arrive with
// SecondaryField.vue.
</script>

<template>
  <div id="editor-wrapper">
    <div id="editor-scroll">
      <div id="editor-area">
        <div
          id="main-col"
          class="field-col"
        >
          <div
            class="field-header"
            style="justify-content: flex-start"
            aria-label="Main field header"
          >
            <span class="field-header-label">Main</span>
            <label
              id="main-paren-label"
              style="display: flex; align-items: center; gap: 4px; font-size: 12px; cursor: pointer; white-space: nowrap; color: var(--muted-foreground)"
              title="Wrap marked translations in parentheses"
            ><input
              id="main-paren-check"
              type="checkbox"
              checked
              style="width: 13px; height: 13px; cursor: pointer; accent-color: var(--primary)"
            > ( )</label>
            <label
              id="main-split-label"
              style="display: flex; align-items: center; gap: 4px; font-size: 12px; cursor: pointer; white-space: nowrap; color: var(--muted-foreground)"
              title="Split trailing parenthesized groups to new translation lines on Ctrl+ArrowLeft"
            ><input
              id="main-split-check"
              type="checkbox"
              style="width: 13px; height: 13px; cursor: pointer; accent-color: var(--primary)"
            > ↩</label>
          </div>
          <div
            id="main-warn"
            class="warn-bar"
            role="alert"
          />
          <div
            id="main-scroll"
            class="lyric-scroll"
          >
            <!-- Phase D: renderMainLines port fills the .lrc-line children -->
            <ul
              id="main-lines"
              class="lyric-area"
              aria-label="Lyric lines"
            />
          </div>
          <textarea
            id="main-textarea"
            spellcheck="false"
            aria-label="Main lyric text"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Monolith CSS, verbatim values; tokens mapped per the Phase B table
   (--surface→--card, --bg→--background, --text→--foreground,
   --text-muted→--muted-foreground, --border-mid→--input); blue accent rules
   (.lrc-line.cursor border, line-flash start) use --primary; the monolith's
   [data-theme="dark"] selectors become .dark. */
#editor-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}
#editor-scroll {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  display: flex;
}
#editor-area {
  display: flex;
  min-width: 100%;
  height: 100%;
}
.field-col {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 286px;
  border-right: 1px solid var(--border);
}
.field-col:last-child {
  border-right: none;
}
.field-header {
  display: flex;
  align-items: center;
  height: 37.4px;
  padding: 0 8.8px;
  gap: 4.4px;
  background: var(--card);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  justify-content: space-between;
}
.field-header-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--foreground);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.fh-btn {
  height: 28.6px;
  padding: 0 8.8px;
  border: 1px solid var(--input);
  border-radius: var(--radius);
  background: transparent;
  cursor: pointer;
  font-size: 13.2px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--foreground);
  white-space: nowrap;
}
.fh-btn:hover {
  background: var(--background);
}
.fh-btn:active {
  filter: brightness(0.88);
  transform: translateY(1px);
}
.warn-bar {
  font-size: 12px;
  padding: 3.3px 8.8px;
  background: var(--warn-bg);
  border-bottom: 1px solid var(--warn-border);
  color: var(--warn-text);
  display: none;
  flex-shrink: 0;
}
.warn-bar.visible {
  display: block;
}
.lyric-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  user-select: text;
}
.lyric-area {
  font-family: var(--editor-font);
  font-size: var(--editor-size);
  line-height: 1.75;
  padding: 4.4px 0;
  min-height: 100%;
  list-style: none;
  margin: 0;
}
.lrc-line {
  padding: 1px 8.8px;
  white-space: nowrap;
  cursor: pointer;
}
.lrc-line:hover {
  background: var(--background);
}
@keyframes line-flash {
  0% {
    background: var(--primary);
    color: #fff;
  }
  100% {
    background: var(--active-bg);
    color: var(--active-text);
  }
}
.lrc-line.active {
  background: var(--active-bg);
  color: var(--active-text);
  font-weight: 600;
}
.lrc-line.active.flash {
  animation: line-flash 0.35s ease-out forwards;
}
.lrc-line .ts {
  color: var(--muted-foreground);
  margin-right: 2px;
}
.lrc-line.active .ts {
  color: var(--active-ts);
}
.lrc-line.end-ts {
  color: var(--muted-foreground);
  font-style: italic;
}
.lrc-line.cursor {
  border-left: 3px solid var(--primary);
  padding-left: calc(8.8px - 3px);
  background: var(--background);
}
.lrc-line.selected {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.lrc-line.active.cursor {
  border-left: 3px solid var(--primary);
  padding-left: calc(8.8px - 3px);
}
.lrc-line.cursor .ts {
  color: var(--active-ts);
}
.dark .lrc-line.cursor {
  background: rgba(88, 166, 255, 0.07);
}
#main-textarea {
  flex: 1;
  font-family: var(--editor-font);
  font-size: var(--editor-size);
  line-height: 1.75;
  padding: 4.4px 8.8px;
  border: none;
  outline: none;
  resize: none;
  background: var(--card);
  color: var(--foreground);
  overflow-y: auto;
  white-space: pre;
  display: none;
  tab-size: 4;
}
#main-textarea.visible {
  display: block;
}
</style>
