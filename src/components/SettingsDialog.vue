<script setup lang="ts">
// Settings dialog — the monolith's #settings-overlay ported onto the
// shadcn-vue Dialog (reka-ui gives the focus trap, Escape, and backdrop
// close that the monolith hand-rolled in the keyboard section). Markup and
// values come from openSettings/buildHkRows with DEFAULT_CFG as the source;
// Phase D's config composable swaps in live cfg and wires openSettings/
// saveSettingsNow, the hotkey capture interactions, the settings search, and
// the reset confirm (_doResetDefaults). Port deltas: the search field and
// capture inputs are inert; the monolith's inline reset confirm is kept
// verbatim (the roadmap's AlertDialog swap is a Phase D decision); no visible
// close button (monolith parity — Escape/backdrop close via reka-ui).
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { DEFAULT_CFG, DEFAULT_META, HK_LABELS, HK_SECTIONS } from '../config'

defineProps<{ open: boolean }>()
defineEmits<{ 'update:open': [value: boolean] }>()

// monolith buildHkRows: stored==='Escape'?'Esc':stored — empty stays empty
// (unlike _hkDisp's em dash, capture inputs show the blank)
function captureValue(key: string): string {
  const stored = DEFAULT_CFG.hotkeys[key] || ''
  return stored === 'Escape' ? 'Esc' : stored
}

const replayChecks = [
  { id: 's-replay-prev', field: 'replay_prev_line', label: 'Moving to previous line' },
  { id: 's-replay-next', field: 'replay_next_line', label: 'Moving to next line' },
  { id: 's-replay-resume', field: 'replay_resume_current', label: 'Resuming currently playing line' },
  { id: 's-replay-other', field: 'replay_play_other', label: 'Playing another line' },
  { id: 's-replay-sync', field: 'replay_after_sync', label: 'Syncing line' },
  { id: 's-replay-ts', field: 'replay_after_ts', label: 'Adjusting timestamp' },
  { id: 's-replay-offset', field: 'replay_after_offset', label: 'Adjusting seek offset' },
] as const

const intervalRows: { id: string; label: string; value: string; unit: string; min?: string; max?: string; step?: string }[] = [
  { id: 's-tiny', label: 'Tiny', value: String(DEFAULT_CFG.tiny_ms), unit: 'ms' },
  { id: 's-small', label: 'Small', value: String(DEFAULT_CFG.small_ms), unit: 'ms' },
  { id: 's-medium', label: 'Medium', value: String(DEFAULT_CFG.medium_ms), unit: 'ms' },
  { id: 's-large', label: 'Large', value: String(DEFAULT_CFG.large_ms), unit: 'ms' },
  { id: 's-seek-inc', label: 'Seek increment', value: String(DEFAULT_CFG.seek_increment_s ?? 5), unit: 's', min: '1', max: '600' },
  { id: 's-speed-ratio', label: 'Speed ratio', value: (DEFAULT_CFG.speed_ratio ?? 1.1).toFixed(2), unit: '×', step: '0.01', min: '1.01', max: '2' },
  { id: 's-vol-inc', label: 'Volume increment', value: String(Math.round((DEFAULT_CFG.vol_increment || 0.1) * 100)), unit: '%', min: '1', max: '100' },
  { id: 's-undo-debounce', label: 'Undo window', value: String(DEFAULT_CFG.undo_debounce_ms ?? 150), unit: 'ms', min: '1', max: '5000' },
]
</script>

<template>
  <Dialog
    :open="open"
    @update:open="$emit('update:open', $event)"
  >
    <DialogContent
      class="settings-win flex flex-col gap-0 overflow-hidden rounded-[8.8px] p-0 sm:max-w-[480px]"
      :show-close-button="false"
    >
      <DialogDescription class="sr-only">
        LineByLine settings
      </DialogDescription>
      <div id="settings-title-bar">
        <DialogTitle
          id="settings-heading"
          class="s-heading"
        >
          Settings
        </DialogTitle>
        <output
          id="settings-conflict"
          aria-live="polite"
        />
        <!-- Phase D: settings search (initSettingsSearch / applySettingsFilter) -->
        <div id="s-search-wrap">
          <input
            id="s-search"
            type="text"
            placeholder="Search…"
            autocomplete="off"
            spellcheck="false"
            aria-label="Search settings"
          >
          <button
            id="s-search-kbd"
            title="Switch to hotkey search (or press toggle mode key)"
            aria-label="Switch to hotkey search mode"
          >
            ⌨
          </button>
        </div>
      </div>
      <div id="settings-body">
        <div>
          <div class="s-sec-label">
            Instant Replay
          </div>
          <!-- Phase D: checked values bind to the live config composable -->
          <label
            v-for="c in replayChecks"
            :key="c.id"
            class="s-check"
          >
            <input
              :id="c.id"
              type="checkbox"
              :checked="DEFAULT_CFG[c.field]"
            > {{ c.label }}
          </label>
        </div>
        <div>
          <div class="s-sec-label">
            Intervals
          </div>
          <div
            v-for="r in intervalRows"
            :key="r.id"
            class="s-row"
          >
            <label :for="r.id">{{ r.label }}</label>
            <input
              :id="r.id"
              class="s-num"
              type="number"
              :value="r.value"
              :min="r.min"
              :max="r.max"
              :step="r.step"
            >
            <span class="s-unit">{{ r.unit }}</span>
          </div>
        </div>
        <div>
          <div class="s-sec-label">
            Default metadata tags
          </div>
          <textarea
            id="s-default-meta"
            class="s-meta"
            aria-label="Default metadata tags"
            :value="DEFAULT_META"
          />
        </div>
        <div>
          <div class="s-sec-label">
            Hotkeys
          </div>
          <div id="hk-settings-rows">
            <!-- Phase D: hotkey capture (buildHkRows interaction logic) -->
            <template
              v-for="section in HK_SECTIONS"
              :key="section.label"
            >
              <div class="s-sub-label">
                {{ section.label }}
              </div>
              <div
                v-for="key in section.keys"
                :key="key"
                class="hk-row"
              >
                <button
                  class="hk-clear"
                  title="Clear (Shift+Backspace)"
                  :aria-label="'Clear hotkey for ' + (HK_LABELS[key] || key)"
                >
                  ✕
                </button>
                <label :for="'hk-capture-' + key">{{ HK_LABELS[key] || key }}</label>
                <input
                  :id="'hk-capture-' + key"
                  class="hk-capture"
                  :value="captureValue(key)"
                  readonly
                >
                <button
                  class="hk-replace"
                  :aria-label="'Swap hotkey with ' + (HK_LABELS[key] || key)"
                >
                  Swap
                </button>
                <button
                  class="hk-reset"
                  :aria-label="'Reset hotkey for ' + (HK_LABELS[key] || key) + ' to default'"
                >
                  ↺ Default
                </button>
                <span class="hk-restrict-warn" />
              </div>
            </template>
          </div>
        </div>
      </div>
      <footer
        id="settings-footer"
        aria-label="Settings actions"
      >
        <!-- Phase D: saveSettingsNow / _doResetDefaults + reset confirm -->
        <button
          id="s-reset-defaults"
          class="s-btn"
        >
          Reset defaults
        </button>
        <span
          id="s-confirm-msg"
          style="display: none; font-size: 13.2px; color: var(--warn-text)"
        >Reset all settings to defaults?</span>
        <button
          id="s-confirm-yes"
          class="s-btn primary"
          style="display: none"
          aria-label="Confirm reset"
        >
          Yes
        </button>
        <button
          id="s-confirm-no"
          class="s-btn"
          style="display: none"
          aria-label="Cancel reset"
        >
          No
        </button>
      </footer>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
/* Monolith settings CSS, verbatim values; tokens per the Phase B table
   (--bg→--background, --border-mid→--input, --text→--foreground,
   --text-muted→--muted-foreground); blue accents (s-search focus, s-check
   accent-color) are --primary. Dialog framing (width 480px, max-height 88vh,
   window chrome) overrides the shadcn DialogContent defaults via utility
   classes in the template. */
#settings-title-bar {
  display: flex;
  align-items: center;
  height: 37.4px;
  padding: 0 13.2px;
  background: var(--background);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  gap: 8px;
}
.s-heading {
  font-size: 13.2px;
  font-weight: 600;
  flex-shrink: 0;
}
#settings-conflict {
  display: none;
  font-size: 12px;
  color: var(--warn-text);
  margin-left: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
#s-search-wrap {
  display: flex;
  align-items: center;
  margin-left: auto;
  gap: 4px;
  position: relative;
}
#s-search {
  width: 160px;
  height: 26px;
  font-size: 12px;
  font-family: inherit;
  padding: 0 28px 0 8px;
  border: 1px solid var(--input);
  border-radius: var(--radius);
  background: var(--card);
  color: var(--foreground);
  outline: none;
  transition:
    border-color 0.15s,
    width 0.15s;
}
#s-search:focus {
  border-color: var(--primary);
}
#s-search.hk-mode {
  border-color: var(--primary);
  background: var(--accent);
  color: var(--primary);
}
#s-search-kbd {
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  border-radius: 3px;
  border: 1px solid var(--input);
  background: var(--card);
  cursor: pointer;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted-foreground);
  padding: 0;
  flex-shrink: 0;
}
#s-search-kbd:hover {
  background: var(--border);
  color: var(--foreground);
}
#s-search-kbd:active {
  filter: brightness(0.88);
}
#settings-body {
  overflow-y: auto;
  padding: 15.4px;
  display: flex;
  flex-direction: column;
  gap: 15.4px;
  flex: 1;
}
.s-sec-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--foreground);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--border);
  padding-bottom: 4.4px;
  margin-bottom: 4.4px;
}
.s-sub-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--foreground);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 10px 0 4px 0;
}
.s-check {
  display: flex;
  align-items: center;
  gap: 8.8px;
  font-size: 13.2px;
  height: 28.6px;
  cursor: pointer;
}
.s-check input {
  width: 15.4px;
  height: 15.4px;
  cursor: pointer;
  accent-color: var(--primary);
}
.s-row {
  display: flex;
  align-items: center;
  gap: 8.8px;
  height: 30.8px;
  font-size: 13.2px;
}
.s-row label {
  min-width: 160px;
}
.s-num {
  width: 70.4px;
  height: 28.6px;
  font-size: 13.2px;
  font-family: inherit;
  text-align: right;
  padding: 0 6.6px;
  border: 1px solid var(--input);
  border-radius: var(--radius);
  background: transparent;
  color: var(--foreground);
}
.s-unit {
  font-size: 13.2px;
  color: var(--muted-foreground);
}
.s-meta {
  width: 100%;
  height: 96.8px;
  font-size: 13.2px;
  font-family: inherit;
  padding: 6.6px 8.8px;
  line-height: 1.6;
  border: 1px solid var(--input);
  border-radius: var(--radius);
  background: transparent;
  color: var(--foreground);
  resize: none;
}
.hk-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 30.8px;
  font-size: 13.2px;
  margin-bottom: 2.2px;
  flex-wrap: nowrap;
}
.hk-row label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hk-clear {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid var(--input);
  background: transparent;
  cursor: pointer;
  font-size: 11px;
  display: none;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--muted-foreground);
  padding: 0;
  line-height: 1;
}
.hk-clear.visible {
  display: flex;
}
.hk-clear:hover {
  background: var(--background);
  color: var(--foreground);
}
.hk-clear:active {
  filter: brightness(0.88);
}
.hk-capture {
  width: 110px;
  height: 28.6px;
  font-size: 13.2px;
  font-family: inherit;
  text-align: center;
  padding: 0 6.6px;
  border: 1px solid var(--input);
  border-radius: var(--radius);
  background: transparent;
  color: var(--foreground);
  cursor: pointer;
  outline: none;
  caret-color: transparent;
  flex-shrink: 0;
}
.hk-capture::placeholder {
  color: var(--muted-foreground);
}
.hk-capture:focus {
  border-color: var(--primary);
  background: var(--accent);
  color: var(--primary);
}
.hk-reset {
  height: 28.6px;
  padding: 0 8px;
  font-size: 11px;
  border: 1px solid var(--input);
  border-radius: var(--radius);
  background: transparent;
  color: var(--muted-foreground);
  cursor: pointer;
  white-space: nowrap;
  display: none;
  flex-shrink: 0;
}
.hk-reset.visible {
  display: inline-flex;
  align-items: center;
}
.hk-reset:hover {
  background: var(--background);
  color: var(--foreground);
}
.hk-reset:active {
  filter: brightness(0.88);
}
.hk-replace {
  height: 28.6px;
  padding: 0 8px;
  font-size: 11px;
  border: 1px solid var(--warn-border);
  border-radius: var(--radius);
  background: var(--warn-bg);
  color: var(--warn-text);
  cursor: pointer;
  white-space: nowrap;
  display: none;
  flex-shrink: 0;
}
.hk-replace.visible {
  display: inline-flex;
  align-items: center;
}
.hk-replace:hover {
  filter: brightness(0.95);
}
.hk-replace:active {
  filter: brightness(0.88);
}
.hk-restrict-warn {
  font-size: 11px;
  color: #c0392b;
  display: none;
  white-space: nowrap;
  flex-shrink: 0;
}
.hk-restrict-warn.visible {
  display: inline-block;
}
#settings-footer {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 6.6px;
  height: 46.2px;
  padding: 0 15.4px;
  border-top: 1px solid var(--border);
  background: var(--background);
  flex-shrink: 0;
}
.s-btn {
  height: 28.6px;
  padding: 0 15.4px;
  font-size: 13.2px;
  border: 1px solid var(--input);
  border-radius: var(--radius);
  background: transparent;
  color: var(--foreground);
  cursor: pointer;
}
.s-btn:hover {
  background: var(--border);
}
.s-btn:active {
  filter: brightness(0.85);
  transform: translateY(1px);
}
.s-btn.primary {
  background: var(--accent);
  color: var(--primary);
  border-color: var(--accent-border);
}
.s-btn.primary:hover {
  filter: brightness(0.95);
}
</style>
