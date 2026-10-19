<script setup lang="ts">
// Controls panel — the hotkey grid filling #hk-grid, ported from the
// monolith's rebuildHkPanel: a mode row (offset-seek + hotkey/typing toggle,
// warn-styled when the non-default mode is active) and the ordered action
// cells (prev/play/next/sync/replay/end + the eight ts-adjust cells with ms
// labels from cfg). Display rules live in utils/hotkeyDisplay.ts.
//
// Phase D Tranche 3 wiring: hotkeyMode/offsetSeekMode now come from the
// shared useAppState refs (the module singleton) — replaced the local refs
// that held monolith defaults. Mode cell @activate dispatches through
// useModeSwitch's toggleMode / toggleOffsetSeek. Action cells remain inert
// (their dispatch table lands in Tranche 9 with the global keyboard handler;
// Tranche 5 wires the sync/timestamp actions, Tranche 4 the audio ones).
import { computed } from 'vue'
import HotkeyCell from './HotkeyCell.vue'
import { HK_LABELS } from '../config'
import { hkCellKeys, hkPanelActions, HOTKEY_ONLY, TYPING_AVAILABLE } from '../utils/hotkeyDisplay'
import { useAppState } from '../composables/useAppState'
import { toggleMode, toggleOffsetSeek } from '../composables/useModeSwitch'

const { hotkeyMode, offsetSeekMode, cfg } = useAppState()

const actions = computed(() => hkPanelActions(cfg.value, offsetSeekMode.value))

function cellAria(key: string, label: string, dimmed: boolean): string {
  // monolith quirk: the "(disabled in typing mode)" suffix only applies when
  // no HK_LABELS entry exists for the action (|| short-circuit)
  return HK_LABELS[key] || label + (dimmed ? ' (disabled in typing mode)' : '')
}

function isDimmed(key: string): boolean {
  return !hotkeyMode.value && HOTKEY_ONLY.has(key) && !TYPING_AVAILABLE.has(key)
}

const modeCells = computed(() => [
  { key: 'offset_mode_toggle', label: offsetSeekMode.value ? 'Offset seek' : 'Offset time', warn: offsetSeekMode.value, onClick: toggleOffsetSeek },
  { key: 'toggle_mode', label: hotkeyMode.value ? 'Hotkey mode' : 'Typing mode', warn: !hotkeyMode.value, onClick: toggleMode },
])
</script>

<template>
  <!-- Phase D Tranche 9: action cell activation dispatches through the CTRL_ACTIONS table -->
  <div class="mode-row">
    <HotkeyCell
      v-for="m in modeCells"
      :key="m.key"
      mode
      :warn="m.warn"
      :warn-key="m.warn"
      :label="m.label"
      :keys="[hkCellKeys(m.key, cfg.hotkeys, hotkeyMode)[0]]"
      :aria-label="HK_LABELS[m.key] || m.label"
      :title="HK_LABELS[m.key] || m.label"
      @activate="m.onClick"
    />
  </div>
  <HotkeyCell
    v-for="a in actions"
    :key="a.key"
    :label="a.label"
    :keys="hkCellKeys(a.key, cfg.hotkeys, hotkeyMode)"
    :dimmed="isDimmed(a.key)"
    :aria-label="cellAria(a.key, a.label, isDimmed(a.key))"
    :title="HK_LABELS[a.key] || a.label"
  />
</template>

<style scoped>
/* The mode row spans both grid columns as an inner 1fr 1fr grid (monolith
   modeRow cssText, verbatim). */
.mode-row {
  grid-column: span 2;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3.3px;
}
</style>
