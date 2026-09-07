<script setup lang="ts">
// Editor area — structure ported from the monolith (#editor-wrapper >
// #editor-scroll > #editor-area > the main field column: header with the
// paren-wrap "( )" and split "↩" toggles, warn bar, lyric line list, and the
// raw textarea behind it, followed by the secondary field columns). The main
// column is the tranche-3 layout shell: line rendering, textarea contents,
// the two checkboxes and the warn bar all bind to Phase D state composables.
import { ref } from 'vue'
import SecondaryField from './SecondaryField.vue'

// Visible secondary-field column count — the monolith starts with zero
// (addSecondary/removeSecondary grow and shrink it). Phase D's useAppState
// pool (10-field cap, hide/reuse) replaces this local count.
const secCount = ref(0)
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
        <SecondaryField
          v-for="i in secCount"
          :key="i"
          :index="i"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Monolith CSS, verbatim values; tokens mapped per the Phase B table
   (--surface→--card, --bg→--background, --text→--foreground,
   --text-muted→--muted-foreground, --border-mid→--input); blue accent rules
   (.lrc-line.cursor border, line-flash start) use --primary; the monolith's
   [data-theme="dark"] selectors become .dark. The shared field-column rules
   (.field-col/.field-header/.field-header-label/.fh-btn/.warn-bar) moved to
   style.css — SecondaryField renders the same column structure. */
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
