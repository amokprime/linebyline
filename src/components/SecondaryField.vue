<script setup lang="ts">
// Secondary field column — structure ported from the monolith's
// addSecondary() DOM construction (field header with the positional label,
// 📂 import button and paren-wrap toggle, warn bar, hidden per-field .lrc
// file picker, and the .sec-textarea). Presentational shell only: the
// textarea value, its paste/keydown/scroll handlers, the import flow, and
// the paren checkbox bind to the Phase D state composables (useAppState /
// useMerge). One component per visible column; the parent (EditorArea) owns
// the field list, the 10-field cap, and the pool reuse logic.
defineProps<{ index: number }>()
</script>

<template>
  <div class="field-col">
    <div
      class="field-header"
      style="justify-content: flex-start"
      :aria-label="`Secondary ${index} field header`"
    >
      <span class="field-header-label">Secondary {{ index }}</span>
      <div style="display: flex; align-items: center; gap: 4.4px; flex-shrink: 0">
        <!-- Phase D: click opens the per-field file picker; the import path
             (stripSecLine/meta filter/paren wrap) lands with useAppState -->
        <button
          class="fh-btn"
          style="padding: 0; width: 28.6px; font-size: 15px; flex-shrink: 0"
          title="Open (Middle click)"
          aria-label="Import secondary lyrics file"
        >📂</button>
        <!-- Phase D: paren-wrap state feeds the paste/import handlers -->
        <label
          style="display: flex; align-items: center; gap: 4px; font-size: 12px; cursor: pointer; white-space: nowrap; color: var(--muted-foreground)"
          title="Wrap all secondary lines in parentheses"
        ><input
          type="checkbox"
          checked
          style="width: 13px; height: 13px; cursor: pointer; accent-color: var(--primary)"
        > ( )</label>
      </div>
    </div>
    <!-- Phase D: checkLineCounts fills the text -->
    <div class="warn-bar" />
    <input
      type="file"
      accept=".lrc,.txt"
      style="display: none"
    >
    <!-- Phase D: value, paste cleaning, secondary keydown guard, scroll sync -->
    <textarea
      class="sec-textarea"
      spellcheck="false"
      :aria-label="`Secondary ${index} lyrics`"
    />
  </div>
</template>

<style scoped>
/* Monolith .sec-textarea slice (lives here — the only component that uses
   it); shared .field-col/.field-header/.warn-bar/.fh-btn rules moved to
   style.css (EditorArea + SecondaryField both render field columns). Values
   verbatim; tokens per the Phase B table (--surface→--card, --text→--foreground). */
.sec-textarea {
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
  tab-size: 4;
  min-height: 0;
}
</style>
