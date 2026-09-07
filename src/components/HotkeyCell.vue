<script setup lang="ts">
// One controls-panel hotkey cell — markup/classes ported from
// rebuildHkPanel's cell creation. A div[role=button] with Enter/Space
// activation (monolith parity); clicks and key presses emit `activate` and
// the parent decides what runs (Phase D action table). Dimmed cells don't
// emit, matching the monolith's !dimmed guard. Warn styling on mode cells is
// the monolith's inline palette (warn tokens).
const props = defineProps<{
  label: string
  keys: string[]
  mode?: boolean
  warn?: boolean
  warnKey?: boolean
  dimmed?: boolean
  title?: string
  ariaLabel?: string
}>()

const emit = defineEmits<{ activate: [] }>()

function onClick() {
  if (!props.dimmed) emit('activate')
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    if (!props.dimmed) emit('activate')
  }
}
</script>

<template>
  <div
    :class="['hk-cell', { 'mode half': mode }]"
    role="button"
    tabindex="0"
    :aria-label="ariaLabel ?? label"
    :aria-disabled="dimmed ? 'true' : undefined"
    :title="title ?? label"
    :style="warn
      ? { background: 'var(--warn-bg)', borderColor: 'var(--warn-border)', color: 'var(--warn-text)' }
      : dimmed
        ? { opacity: '0.35' }
        : undefined"
    @click="onClick"
    @keydown="onKeydown"
  >
    <span>{{ label }}</span>
    <span :style="keys.length > 1 ? 'display:flex;gap:3px' : undefined">
      <span
        v-for="(k, i) in keys"
        :key="i"
        class="hk-key"
        :style="warnKey
          ? { background: 'rgba(212,167,44,0.15)', color: 'var(--warn-text)' }
          : undefined"
      >{{ k }}</span>
    </span>
  </div>
</template>

<style scoped>
/* Monolith .hk-cell/.mode CSS, verbatim values; tokens per the Phase B table
   (--bg→--background, --accent-bg tint→--accent); .hk-key itself is global
   (style.css) since the sync-file badge and Settings rows reuse it. */
.hk-cell {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3.3px 5.5px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--background);
  font-size: 12px;
  cursor: pointer;
}
.hk-cell:hover {
  background: var(--border);
}
.hk-cell:active {
  filter: brightness(0.85);
  transform: translateY(1px);
}
.hk-cell.mode {
  background: var(--accent);
  border-color: var(--accent-border);
  color: var(--active-text);
  cursor: pointer;
}
.hk-cell.mode.half {
  grid-column: span 1;
}
.hk-cell.mode:hover {
  filter: brightness(0.95);
}
.hk-cell.mode:active {
  filter: brightness(0.85);
  transform: translateY(1px);
}
.hk-cell.mode .hk-key {
  background: rgba(9, 105, 218, 0.15);
  color: var(--active-text);
}
.dark .hk-cell.mode .hk-key {
  background: rgba(88, 166, 255, 0.15);
}
</style>
