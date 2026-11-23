<script setup lang="ts">
// Menu-bar font picker — markup and behaviors from the monolith menu bar
// (font select, size input with Enter-commit + blur, ▲/▼ tick buttons).
// State and persistence live in useEditorFont(); setup applies the font so a
// stored value takes effect without waiting for user input (monolith Init
// parity).
import { useEditorFont } from '../composables/useEditorFont'

const { editorFont, editorSize, applyEditorFont, setFont, setSizeFromInput, sizeUp, sizeDown } =
  useEditorFont()

applyEditorFont()

function onFontChange(e: Event) {
  setFont((e.target as HTMLSelectElement).value)
}
function parseSize(e: Event): number {
  return Number.parseFloat((e.target as HTMLInputElement).value)
}
function onSizeChange(e: Event) {
  setSizeFromInput(parseSize(e))
}
function onSizeEnter(e: KeyboardEvent) {
  e.preventDefault()
  setSizeFromInput(parseSize(e))
  ;(e.target as HTMLInputElement).blur()
}
</script>

<template>
  <select
    id="font-select"
    :value="editorFont"
    title="Editor font"
    aria-label="Editor font"
    @change="onFontChange"
  >
    <option value="system-ui,sans-serif">
      System Sans
    </option>
    <option value="serif">
      System Serif
    </option>
  </select>
  <div id="font-size-wrap">
    <input
      id="font-size-inp"
      type="number"
      :value="editorSize"
      min="8"
      max="32"
      title="Font size"
      aria-label="Font size"
      @change="onSizeChange"
      @keydown.enter="onSizeEnter"
    >
    <div class="fs-spinner">
      <button
        id="fs-up"
        class="fs-tick"
        title="Increase font size"
        @click="sizeUp"
      >
        ▲
      </button>
      <button
        id="fs-down"
        class="fs-tick"
        title="Decrease font size"
        @click="sizeDown"
      >
        ▼
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Monolith menu-bar CSS, verbatim values; tokens mapped per the Phase B table:
   --surface→--card, --border-mid→--input, --text→--foreground. */
#font-select {
  height: 28.6px;
  font-size: 12px;
  border: 1px solid var(--input);
  border-radius: var(--radius);
  background: var(--card);
  color: var(--foreground);
  padding: 0 6px;
  cursor: pointer;
}
#font-size-wrap {
  display: flex;
  align-items: center;
  position: relative;
}
#font-size-inp {
  width: 30px;
  height: 28.6px;
  font-size: 12px;
  font-family: inherit;
  text-align: center;
  border: 1px solid var(--input);
  border-radius: var(--radius);
  background: transparent;
  color: var(--foreground);
  -moz-appearance: textfield;
}
#font-size-inp::-webkit-inner-spin-button,
#font-size-inp::-webkit-outer-spin-button {
  -webkit-appearance: none;
}
</style>
