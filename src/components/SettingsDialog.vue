<script setup lang="ts">
// Settings dialog — the monolith's #settings-overlay ported onto the
// shadcn-vue Dialog (reka-ui gives the focus trap, Escape, and backdrop
// close that the monolith hand-rolled in the keyboard section).
//
// Phase D Tranche 2: rows render from live `cfg` (via useAppState) instead
// of DEFAULT_CFG. When the user changes a setting, the dialog re-renders
// automatically.
//
// Phase D Tranche 8 wiring: full settings interactions now live in
// useSettings — capture input KD (Tab trap, Shift+Backspace=clear, Backspace=
// reset+advance, Enter=swap+advance), conflict detection with Swap, reset
// to default with swap pattern, search/filter (text + hk modes), save now,
// and the inline footer Yes/No reset confirm. The capture inputs are still
// readonly (they intercept keydown, not text input); the Clear/Swap/Reset
// buttons render their .visible state from useSettings computeds.
//
// Port deltas from the monolith:
//  - The search input + the capture inputs use Vue event bindings (@input,
//    @keydown, @focus, @blur) instead of imperative addEventListener.
//  - The capture inputs' "focus placeholder" ('…') comes from captureDisplay()
//    which reads the per-row isFocused flag — the same closure-variable trick
//    the monolith used, but exposed reactively.
//  - Thehk-clear / hk-reset / hk-replace button .visible classes bind to
//    isClearVisible / isResetVisible / isReplaceVisible — the monolith toggled
//    them imperatively.
//  - The reset confirm flow uses v-if on a ref instead of style.display.
//  - saveSettingsNow takes a values object built from the template's bindings;
//    the composable doesn't reach into the DOM.
import { computed, watch, nextTick, ref } from 'vue'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { DEFAULT_META } from '../config'
import { useAppState } from '../composables/useAppState'
import {
  HK_SECTIONS,
  HK_LABELS,
  useSettings,
  setSearchQuery,
  type SettingsFormValues,
} from '../composables/useSettings'
import { useEditorFont } from '../composables/useEditorFont'
import { useAudio } from '../composables/useAudio'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const { cfg } = useAppState()

const {
  captureDisplay,
  isClearVisible,
  isResetVisible,
  isReplaceVisible,
  restrictWarnText,
  isRowInConflict,
  isRowHidden,
  isSectionHidden,
  isNonHkRowHidden,
  searchQuery,
  searchHkMode,
  conflictMessage,
  isResetConfirmVisible,
  onCaptureFocus,
  onCaptureBlur,
  onCaptureKeydown,
  onSearchKeydown,
  clearHotkey,
  resetHotkey,
  swapHotkey,
  setSearchHkMode,
  saveSettingsNow,
  showResetConfirm,
  hideResetConfirm,
  doResetDefaults,
  setResetCallbacks,
  initSettings,
  consumePendingAdvance,
} = useSettings()

// Reset callbacks for the editor font + audio speed + seek-offset display.
// useEditorFont doesn't expose resetEditorFont — we use setFont + setSizeFromInput
// with the defaults to achieve the same effect.
const { setFont, setSizeFromInput } = useEditorFont()
const { changeSpeed } = useAudio()
setResetCallbacks({
  resetEditorFont: () => {
    setFont('system-ui,sans-serif')
    setSizeFromInput(14)
  },
  resetSpeed: () => changeSpeed(0),
  resetSeekOffsetDisplay: () => {
    // The #seek-offset input value lives in LeftPanel; we can't reach it from
    // here without a ref. Setting cfg.value.seek_offset will re-render the
    // binding if LeftPanel's template uses :value — LeftPanel.vue's #seek-offset
    // uses value="0" hardcoded; this remains a known post-cutover fix.
  },
})

// Initialize settings state when the dialog opens.
watch(
  () => props.open,
  (open) => {
    if (open) initSettings()
  },
)

// When the dialog opens, focus the search field.
watch(
  () => props.open,
  (open) => {
    if (open) {
      nextTick(() => {
        const el = document.getElementById('s-search') as HTMLInputElement | null
        if (el) el.focus()
      })
    }
  },
)

// Re-sync form values from cfg when the dialog opens (covers external cfg
// changes like a reset-to-defaults).
watch(
  () => props.open,
  (open) => {
    if (open) {
      tinyMs.value = String(cfg.value.tiny_ms)
      smallMs.value = String(cfg.value.small_ms)
      mediumMs.value = String(cfg.value.medium_ms)
      largeMs.value = String(cfg.value.large_ms)
      seekInc.value = String(cfg.value.seek_increment_s ?? 5)
      speedRatio.value = (cfg.value.speed_ratio ?? 1.1).toFixed(2)
      volInc.value = String(Math.round((cfg.value.vol_increment || 0.1) * 100))
      undoDebounce.value = String(cfg.value.undo_debounce_ms ?? 150)
      defaultMeta.value = cfg.value.default_meta ?? DEFAULT_META
    }
  },
)

const replayChecks = [
  { id: 's-replay-prev', field: 'replay_prev_line', label: 'Moving to previous line' },
  { id: 's-replay-next', field: 'replay_next_line', label: 'Moving to next line' },
  { id: 's-replay-resume', field: 'replay_resume_current', label: 'Resuming currently playing line' },
  { id: 's-replay-other', field: 'replay_play_other', label: 'Playing another line' },
  { id: 's-replay-sync', field: 'replay_after_sync', label: 'Syncing line' },
  { id: 's-replay-ts', field: 'replay_after_ts', label: 'Adjusting timestamp' },
  { id: 's-replay-offset', field: 'replay_after_offset', label: 'Adjusting seek offset' },
] as const

// Reactive form values bound to number/text inputs.
const tinyMs = ref(String(cfg.value.tiny_ms))
const smallMs = ref(String(cfg.value.small_ms))
const mediumMs = ref(String(cfg.value.medium_ms))
const largeMs = ref(String(cfg.value.large_ms))
const seekInc = ref(String(cfg.value.seek_increment_s ?? 5))
const speedRatio = ref((cfg.value.speed_ratio ?? 1.1).toFixed(2))
const volInc = ref(String(Math.round((cfg.value.vol_increment || 0.1) * 100)))
const undoDebounce = ref(String(cfg.value.undo_debounce_ms ?? 150))
const defaultMeta = ref(cfg.value.default_meta ?? DEFAULT_META)

const intervalRows = computed(() => [
  { id: 's-tiny', label: 'Tiny', v: tinyMs, unit: 'ms', min: '1', max: '60000' },
  { id: 's-small', label: 'Small', v: smallMs, unit: 'ms', min: '1', max: '60000' },
  { id: 's-medium', label: 'Medium', v: mediumMs, unit: 'ms', min: '1', max: '60000' },
  { id: 's-large', label: 'Large', v: largeMs, unit: 'ms', min: '1', max: '60000' },
  { id: 's-seek-inc', label: 'Seek increment', v: seekInc, unit: 's', min: '1', max: '600' },
  { id: 's-speed-ratio', label: 'Speed ratio', v: speedRatio, unit: '×', step: '0.01', min: '1.01', max: '2' },
  { id: 's-vol-inc', label: 'Volume increment', v: volInc, unit: '%', min: '1', max: '100' },
  { id: 's-undo-debounce', label: 'Undo window', v: undoDebounce, unit: 'ms', min: '1', max: '5000' },
])

function readFormValues(): SettingsFormValues {
  return {
    replay_prev_line: (document.getElementById('s-replay-prev') as HTMLInputElement)?.checked ?? cfg.value.replay_prev_line,
    replay_next_line: (document.getElementById('s-replay-next') as HTMLInputElement)?.checked ?? cfg.value.replay_next_line,
    replay_resume_current: (document.getElementById('s-replay-resume') as HTMLInputElement)?.checked ?? cfg.value.replay_resume_current,
    replay_play_other: (document.getElementById('s-replay-other') as HTMLInputElement)?.checked ?? cfg.value.replay_play_other,
    replay_after_offset: (document.getElementById('s-replay-offset') as HTMLInputElement)?.checked ?? cfg.value.replay_after_offset,
    replay_after_sync: (document.getElementById('s-replay-sync') as HTMLInputElement)?.checked ?? cfg.value.replay_after_sync,
    replay_after_ts: (document.getElementById('s-replay-ts') as HTMLInputElement)?.checked ?? cfg.value.replay_after_ts,
    tiny_ms: Number.parseInt(tinyMs.value, 10),
    small_ms: Number.parseInt(smallMs.value, 10),
    medium_ms: Number.parseInt(mediumMs.value, 10),
    large_ms: Number.parseInt(largeMs.value, 10),
    seek_increment_s: Number.parseInt(seekInc.value, 10),
    speed_ratio: Number.parseFloat(speedRatio.value),
    vol_increment: Number.parseInt(volInc.value, 10),
    undo_debounce_ms: Number.parseInt(undoDebounce.value, 10),
    default_meta: defaultMeta.value,
  }
}

function onSaveNow() {
  saveSettingsNow(readFormValues())
}

// Capture input keydown — wraps onCaptureKeydown to handle the focus advance
// for Backspace (reset+advance) and Enter (swap+advance).
function onCaptureKd(key: string, e: KeyboardEvent) {
  const handled = onCaptureKeydown(key, e)
  if (!handled) return
  // If Backspace was pressed and Reset was visible, click Reset then advance.
  if (e.key === 'Backspace' && !e.shiftKey) {
    if (isResetVisible(key)) {
      resetHotkey(key)
    }
    advanceFocus(key)
    return
  }
  // If Enter was pressed, click Swap if visible, then advance.
  if (e.key === 'Enter') {
    if (isReplaceVisible(key)) {
      swapHotkey(key)
    }
    advanceFocus(key)
    return
  }
  // Consume the pending advance key for any other handled case (defensive).
  consumePendingAdvance()
}

function advanceFocus(fromKey: string) {
  // Find all visible capture inputs in document order, move to the next one
  // after fromKey. If at the end, wrap to the search field.
  const captures = Array.from(
    document.querySelectorAll<HTMLInputElement>('#hk-settings-rows .hk-capture'),
  ).filter((el) => el.offsetParent !== null)
  const idx = captures.findIndex((el) => el.id === 'hk-capture-' + fromKey)
  if (idx < 0) return
  const next = captures[idx + 1]
  if (next) {
    next.focus()
  } else {
    const search = document.getElementById('s-search') as HTMLInputElement | null
    if (search) search.focus()
  }
}

function onFocus(key: string) {
  onCaptureFocus(key)
}
function onBlur(key: string) {
  onCaptureBlur(key)
}

// Search field handlers.
function onSearchInput(e: Event) {
  // Text-mode: read the input value into the search query ref so the filter
  // computeds re-run. Hotkey-mode: the keydown handler sets the query string
  // directly; this @input is a no-op (the input is effectively write-only).
  if (searchHkMode()) return
  const v = (e.target as HTMLInputElement).value
  setSearchQuery(v)
}

function onSearchKd(e: KeyboardEvent) {
  onSearchKeydown(e)
}

function onSearchBtnClick() {
  setSearchHkMode(!searchHkMode())
}

// Reset confirm handlers.
function onResetClick() {
  showResetConfirm()
  nextTick(() => {
    const yes = document.getElementById('s-confirm-yes') as HTMLButtonElement | null
    if (yes) yes.focus()
  })
}
function onConfirmYes() {
  hideResetConfirm()
  doResetDefaults()
  nextTick(() => {
    const search = document.getElementById('s-search') as HTMLInputElement | null
    if (search) search.focus()
  })
}
function onConfirmNo() {
  hideResetConfirm()
  nextTick(() => {
    const search = document.getElementById('s-search') as HTMLInputElement | null
    if (search) search.focus()
  })
}
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
          class="s-heading"
        >
          Settings
        </DialogTitle>
        <output
          id="settings-conflict"
          aria-live="polite"
          :style="{ display: conflictMessage() ? '' : 'none' }"
        >{{ conflictMessage() }}</output>
        <div id="s-search-wrap">
          <input
            id="s-search"
            type="text"
            :value="searchQuery()"
            :placeholder="searchHkMode() ? 'Press a key…' : 'Search…'"
            :class="{ 'hk-mode': searchHkMode() }"
            :readonly="searchHkMode()"
            autocomplete="off"
            spellcheck="false"
            aria-label="Search settings"
            @input="onSearchInput"
            @keydown="onSearchKd"
          >
          <button
            id="s-search-kbd"
            :class="{ active: searchHkMode() }"
            title="Switch to hotkey search (or press toggle mode key)"
            aria-label="Switch to hotkey search mode"
            @click="onSearchBtnClick"
          >
            ⌨
          </button>
        </div>
      </div>
      <div id="settings-body">
        <div :class="{ 's-hidden': isNonHkRowHidden('Instant Replay') }">
          <div class="s-sec-label">
            Instant Replay
          </div>
          <label
            v-for="c in replayChecks"
            :key="c.id"
            class="s-check"
            :class="{ 's-hidden': isNonHkRowHidden(c.label) }"
          >
            <input
              :id="c.id"
              type="checkbox"
              :checked="cfg[c.field]"
              @change="onSaveNow"
            > {{ c.label }}
          </label>
        </div>
        <div :class="{ 's-hidden': isNonHkRowHidden('Intervals') }">
          <div class="s-sec-label">
            Intervals
          </div>
          <div
            v-for="r in intervalRows"
            :key="r.id"
            class="s-row"
            :class="{ 's-hidden': isNonHkRowHidden(r.label) }"
          >
            <label :for="r.id">{{ r.label }}</label>
            <input
              :id="r.id"
              class="s-num"
              type="number"
              :value="r.v.value"
              :min="r.min"
              :max="r.max"
              :step="r.step"
              @input="r.v.value = ($event.target as HTMLInputElement).value"
              @change="onSaveNow"
            >
            <span class="s-unit">{{ r.unit }}</span>
          </div>
        </div>
        <div :class="{ 's-hidden': isNonHkRowHidden('Default metadata tags') }">
          <div class="s-sec-label">
            Default metadata tags
          </div>
          <textarea
            id="s-default-meta"
            class="s-meta"
            aria-label="Default metadata tags"
            :value="defaultMeta"
            @input="defaultMeta = ($event.target as HTMLTextAreaElement).value; onSaveNow()"
          />
        </div>
        <div :class="{ 's-hidden': isSectionHidden('Hotkeys', HK_SECTIONS.flatMap(s => s.keys)) }">
          <div class="s-sec-label">
            Hotkeys
          </div>
          <div id="hk-settings-rows">
            <template
              v-for="section in HK_SECTIONS"
              :key="section.label"
            >
              <div
                class="s-sub-label"
                :class="{ 's-hidden': isSectionHidden(section.label, section.keys) }"
              >
                {{ section.label }}
              </div>
              <div
                v-for="key in section.keys"
                :key="key"
                class="hk-row"
                :class="{ 's-hidden': isRowHidden(key), 'hk-conflict': isRowInConflict(key) }"
              >
                <button
                  class="hk-clear"
                  :class="{ visible: isClearVisible(key) }"
                  title="Clear (Shift+Backspace)"
                  :aria-label="'Clear hotkey for ' + (HK_LABELS[key] || key)"
                  @mousedown.prevent
                  @click="clearHotkey(key, false)"
                >
                  ✕
                </button>
                <label :for="'hk-capture-' + key">{{ HK_LABELS[key] || key }}</label>
                <input
                  :id="'hk-capture-' + key"
                  class="hk-capture"
                  :value="captureDisplay(key)"
                  readonly
                  @focus="onFocus(key)"
                  @blur="onBlur(key)"
                  @keydown="onCaptureKd(key, $event)"
                >
                <button
                  class="hk-replace"
                  :class="{ visible: isReplaceVisible(key) }"
                  :aria-label="'Swap hotkey with ' + (HK_LABELS[key] || key)"
                  @click="swapHotkey(key)"
                >
                  Swap
                </button>
                <button
                  class="hk-reset"
                  :class="{ visible: isResetVisible(key) }"
                  :aria-label="'Reset hotkey for ' + (HK_LABELS[key] || key) + ' to default'"
                  @click="resetHotkey(key)"
                >
                  ↺ Default
                </button>
                <span
                  class="hk-restrict-warn"
                  :class="{ visible: restrictWarnText(key) !== '' }"
                >{{ restrictWarnText(key) }}</span>
              </div>
            </template>
          </div>
        </div>
      </div>
      <footer
        id="settings-footer"
        aria-label="Settings actions"
      >
        <!-- Monolith parity: the confirm elements stay in the DOM with
             display:none toggled by v-show (not v-if) so the test that pins
             `style.display === 'none'` continues to pass. -->
        <button
          id="s-reset-defaults"
          class="s-btn"
          v-show="!isResetConfirmVisible()"
          @click="onResetClick"
        >
          Reset defaults
        </button>
        <span
          id="s-confirm-msg"
          v-show="isResetConfirmVisible()"
          style="font-size: 13.2px; color: var(--warn-text)"
        >Reset all settings to defaults?</span>
        <button
          id="s-confirm-yes"
          v-show="isResetConfirmVisible()"
          class="s-btn primary"
          aria-label="Confirm reset"
          @click="onConfirmYes"
        >
          Yes
        </button>
        <button
          id="s-confirm-no"
          v-show="isResetConfirmVisible()"
          class="s-btn"
          aria-label="Cancel reset"
          @click="onConfirmNo"
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
#s-search-kbd.active {
  background: var(--accent);
  color: var(--primary);
  border-color: var(--accent-border);
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
/* Hidden rows (search filter) — same as the monolith's .s-hidden class. */
.s-hidden {
  display: none !important;
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
