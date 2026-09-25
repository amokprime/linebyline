<script setup lang="ts">
// Secondary field column — structure ported from the monolith's
// addSecondary() DOM construction (field header with the positional label,
// 📂 import button and paren-wrap toggle, warn bar, hidden per-field .lrc
// file picker, and the .sec-textarea). Phase D Tranche 6 wiring: the
// textarea value, paste/keydown/scroll/input handlers, the import flow, and
// the warn bar now bind to useAppState.secondaryPool + useMerge composables.
// The `index` prop is 1-based (matches the monolith's "Secondary N" label).
import { computed, ref } from 'vue'
import { useAppState } from '../composables/useAppState'
import {
  onSecFileImport,
  onSecInput,
  onSecKeydown,
  onSecPaste,
  syncScrollFrom,
} from '../composables/useMerge'

const props = defineProps<{ index: number }>()

// The pool index is 0-based; the `index` prop is 1-based. Secondary 1 → pool[0].
const poolIdx = computed(() => props.index - 1)

// Reactive entry — reads from useAppState.secondaryPool. The warn-bar
// `:class` + `{{ }}` bindings update when useMerge.checkLineCounts writes
// `warnText` / `warnVisible` on the entry.
const { secondaryPool } = useAppState()
const entry = computed(() => secondaryPool.value[poolIdx.value])

// Local paren-checkbox state. The monolith creates a fresh checkbox per
// secondary field, defaulting to checked. Vue keeps it as a local ref per
// component instance (the checkbox is internal to this column, not shared
// state across secondaries).
const parenChecked = ref(true)

// Register the textarea element ref with the pool entry so useMerge's
// syncScrollFrom can reach the DOM. Cleared on unmount to avoid stale refs.
const textareaEl = ref<HTMLTextAreaElement | null>(null)

function onTextareaMount() {
  if (entry.value) entry.value.textareaEl = textareaEl.value
}
function onTextareaUnmount() {
  if (entry.value) entry.value.textareaEl = null
}

// File picker — the hidden <input type="file"> is opened by the 📂 button.
// Reads .lrc/.txt, strips meta + headers, collapses blanks, paren-wraps per
// the checkbox, replaces the textarea content, pushes a snapshot.
const filePicker = ref<HTMLInputElement | null>(null)

function openFilePicker() {
  if (filePicker.value) {
    filePicker.value.value = ''
    filePicker.value.click()
  }
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  onSecFileImport(poolIdx.value, file, parenChecked.value)
}

// `:value` binding for the textarea — reads from the pool entry's text.
// `@input` writes back to the pool entry via onSecInput (which also collapses
// 3+ consecutive newlines + runs checkLineCounts + updateMergeBtn).
// `@paste` cleans + paren-wraps the clipboard content.
// `@keydown` blocks hotkey-mode-only actions from firing while the user types
// (the always-block set is here; Tranche 9 will replace onSecKeydown with the
// full dispatch).
// `@scroll` syncs all other scrollable fields to match this one's ratio.
function onScroll(e: Event) {
  const ta = e.target as HTMLTextAreaElement
  syncScrollFrom(ta)
}
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
        <button
          class="fh-btn"
          style="padding: 0; width: 28.6px; font-size: 15px; flex-shrink: 0"
          title="Open (Middle click)"
          aria-label="Import secondary lyrics file"
          @click="openFilePicker"
          @mousedown.prevent
        >
          📂
        </button>
        <label
          style="display: flex; align-items: center; gap: 4px; font-size: 12px; cursor: pointer; white-space: nowrap; color: var(--muted-foreground)"
          title="Wrap all secondary lines in parentheses"
        ><input
          v-model="parenChecked"
          type="checkbox"
          style="width: 13px; height: 13px; cursor: pointer; accent-color: var(--primary)"
        > ( )</label>
      </div>
    </div>
    <div
      class="warn-bar"
      :class="{ visible: entry?.warnVisible }"
    >
      {{ entry?.warnText }}
    </div>
    <input
      :id="`sec-file-${index}`"
      ref="filePicker"
      type="file"
      accept=".lrc,.txt"
      style="display: none"
      :aria-label="`Secondary ${index} lyrics file`"
      @change="onFileChange"
    >
    <textarea
      ref="textareaEl"
      class="sec-textarea"
      spellcheck="false"
      :aria-label="`Secondary ${index} lyrics`"
      :value="entry?.text"
      @vue:mounted="onTextareaMount"
      @vue:unmounted="onTextareaUnmount"
      @input="onSecInput(poolIdx, $event)"
      @paste="onSecPaste(poolIdx, $event, parenChecked)"
      @keydown="onSecKeydown"
      @scroll="onScroll"
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
