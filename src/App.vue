<script setup lang="ts">
// Modular app root. Phase C complete: every monolith element lives in a Vue
// component (this shell carries the two app-level hidden nodes — #file-picker
// for the Phase D import composable, #a11y-announcer for the _announce port).
//
// Phase D Tranche 9 wiring: instantiates useGlobalHotkeys (init with the
// undo/redo + settings + help/issues callbacks), attaches the document-level
// keydown handler in onMounted, calls updateDynamicTooltips after Init and
// after any cfg change (via a watch). Also instantiates useTextareaKeys for
// the main textarea's Enter-trim + bracket autocomplete (EditorArea binds
// @keydown="onMainKeydown" via the useTextareaKeys export).
//
// Phase D Tranche 5 wiring (re-applied): wires useSync callbacks (the full
// setMainText side-effect chain: renderMainLines + checkLineCounts +
// updateMergeBtn + updateTitleFromText + doAutosave + pushSnapshot). Wires
// useAudio's Tranche 5 callbacks (updateActiveLineFromTime + renderMainLines +
// scrollToPlaying + syncSecScroll + announce). Wires useAutosave's
// renderMainLines. Wires useModeSwitch's renderMainLines callback to the real
// function (was a no-op stub). Wires the undo debounce via setOnInputCallback
// so useSync doesn't depend on useUndoRedo (avoids a circular import).
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ThemeProvider from './components/ThemeProvider.vue'
import MenuBar from './components/MenuBar.vue'
import LeftPanel from './components/LeftPanel.vue'
import EditorArea from './components/EditorArea.vue'
import SettingsDialog from './components/SettingsDialog.vue'
import { usePanelCollapse } from './composables/usePanelCollapse'
import { applyMode } from './composables/useModeSwitch'
import {
  restoreAudioDisplay,
  setAudioCallbacks,
  setupAudio,
  useAudio,
} from './composables/useAudio'
import { useAutosave, initAutosave, doAutosave } from './composables/useAutosave'
import { updateTitleFromText, useTitle } from './composables/useTitle'
import { useUndoRedo, type Snapshot } from './composables/useUndoRedo'
import { useAppState } from './composables/useAppState'
import {
  renderMainLines,
  setOnInputCallback,
  setSyncCallbacks,
  updateActiveLineFromTime,
  scrollToPlaying,
} from './composables/useSync'
import {
  initMerge,
  checkLineCounts,
  updateMergeBtn,
  syncSecScroll,
} from './composables/useMerge'
import {
  initImport,
  setFilePickerRef,
  onFilePickerChange,
  onMiddleClick,
} from './composables/useImport'
import {
  initGlobalHotkeys,
  onGlobalKeydown,
  updateDynamicTooltips,
} from './composables/useGlobalHotkeys'

const { panelCollapsed, applyPanelCollapse, autoCollapseIfNeeded, setExpandRef } =
  usePanelCollapse()

const settingsOpen = ref(false)

// ── Tranche 2 wiring: autosave + title + undo/redo ──────────────────────────
// Instantiate useUndoRedo with take/apply callbacks that read from useAppState.
// Tranche 5 amends applySnapshot to run the full side-effect chain via the
// App.vue-wired setMainText — same callback the textarea's @input uses.
const { mainText, secondaryPool, mergeDone, playingLine, cfg } = useAppState()

// Phase D Tranche 7 — #file-picker ref (hidden input at the app root).
// useImport reads it to trigger the picker click + the change handler.
const filePicker = ref<HTMLInputElement | null>(null)
setFilePickerRef(filePicker)

// The setMainText side-effect chain: the monolith inlines this everywhere
// (`_setTA(t); renderMainLines(); checkLineCounts(); updateMergeBtn();
// updateTitleFromText(); doAutosave(); pushSnapshot();`). Tranche 5 collapses
// it into one function so the composable's setMainText calls are one-liners.
// `pushSnapshot` is wholesale-replacement → pre + post (single-push model
// from the code-quality skill + useUndoRedo).
function setMainText(t: string) {
  // Pre-change snapshot (only if mainText is changing — wholesale replacement)
  if (mainText.value !== t) {
    undoRedo.pushSnapshot()
  }
  mainText.value = t
  renderMainLines()
  // Tranche 6: real checkLineCounts + updateMergeBtn (the warn bars + merge
  // button disabled state recompute on every setMainText call).
  checkLineCounts()
  updateMergeBtn()
  updateTitleFromText(mainText.value)
  doAutosave()
  undoRedo.pushSnapshot()
}

const undoRedo = useUndoRedo({
  takeSnapshot: (): Snapshot => ({
    main: mainText.value,
    secondaries: secondaryPool.value.map((e) => e.text),
    mergeDone: mergeDone.value,
  }),
  applySnapshot: (snap: Snapshot) => {
    mainText.value = snap.main
    // Tranche 6: clear extra secondaries beyond the snapshot's length (the
    // documented invariant — undoing to a pre-add snapshot must not leave
    // stale text in still-visible columns). Restore text for each snap entry.
    for (let i = 0; i < secondaryPool.value.length; i++) {
      if (i < snap.secondaries.length) {
        secondaryPool.value[i]!.text = snap.secondaries[i]!
      } else {
        secondaryPool.value[i]!.text = ''
      }
    }
    renderMainLines()
    checkLineCounts()
    updateMergeBtn()
    mergeDone.value = snap.mergeDone
    playingLine.value = -1
    doAutosave()
  },
})

// Wire useAutosave callbacks — Tranche 5 swaps renderMainLines from no-op
// to the real function.
initAutosave({
  getMainText: () => mainText.value,
  setMainText: (t: string) => { mainText.value = t },
  updateTitleFromText: (text: string) => updateTitleFromText(text),
  takeSnapshot: () => ({
    main: mainText.value,
    secondaries: secondaryPool.value.map((e) => e.text),
    mergeDone: mergeDone.value,
  }),
  seedUndo: undoRedo.seed,
  // Tranche 5: real renderMainLines; Tranche 6 stub:
  renderMainLines,
  checkLineCounts: () => {},
})

// Wire useAudio callbacks — Tranche 5 swaps renderMainLines + adds
// updateActiveLineFromTime + scrollToPlaying + syncSecScroll + announce.
const { audioEl, lastPlayingLine, currentMs } = useAudio()
// Tranche 7: useImport needs setSongTitle/setSongArtist to reset on pair import.
const { songTitle, songArtist } = useTitle()
setAudioCallbacks({
  getMainText: () => mainText.value,
  setMainText: (t: string) => { mainText.value = t },
  doAutosave: (pathHint?: string) => doAutosave(pathHint),
  updateTitleFromText: () => updateTitleFromText(mainText.value),
  // Tranche 5 wires these:
  renderMainLines,
  updateActiveLineFromTime,
  scrollToPlaying,
  // Tranche 6 stubs:
  syncSecScroll: () => {},
  announce: (msg: string) => {
    const el = document.getElementById('a11y-announcer')
    if (el) el.textContent = msg
  },
})

// Wire useSync callbacks — App.vue owns the setMainText chain + audio helpers.
// The audio helpers wrap useAudio's audioEl ref so useSync doesn't import
// useAudio directly (avoids a circular import: useAudio imports useAppState,
// useSync imports useAppState + utils, App.vue wires them together).
setSyncCallbacks({
  setMainText,
  getMainText: () => mainText.value,
  doAutosave: (pathHint?: string) => doAutosave(pathHint),
  updateTitleFromText: () => updateTitleFromText(mainText.value),
  // Tranche 6: real checkLineCounts + updateMergeBtn + syncSecScroll (were no-ops).
  checkLineCounts,
  updateMergeBtn,
  syncSecScroll,
  announce: (msg: string) => {
    const el = document.getElementById('a11y-announcer')
    if (el) el.textContent = msg
  },
  getCurrentMs: () => currentMs(),
  seekToMs: (ms: number) => {
    const el = audioEl.value
    if (el) el.currentTime = ms / 1000
  },
  playIfNotPlaying: () => {
    const el = audioEl.value
    if (!el) return
    el.play()
    useAppState().playing.value = true
  },
  setLastPlayingLine: (i: number) => {
    lastPlayingLine.value = i
  },
  getAudioDurationMs: () => {
    const el = audioEl.value
    return el && el.duration ? Math.floor(el.duration * 1000) : null
  },
  isAudioReady: () => audioEl.value !== null,
})

// ── Tranche 6 wiring: useMerge callbacks ──────────────────────────────────
// initMerge is called once with the callback set. The setMainText chain +
// pushSnapshot + scheduleSecInputSnapshot are the same callbacks useSync uses
// (App.vue owns them). markGeniusSource stays a no-op until Tranche 9.
initMerge({
  setMainText,
  getMainText: () => mainText.value,
  doAutosave: () => doAutosave(),
  pushSnapshot: () => undoRedo.pushSnapshot(),
  scheduleSecInputSnapshot: () =>
    undoRedo.scheduleInputSnapshot(useAppState().cfg.value.undo_debounce_ms || 150),
  markGeniusSource: () => {
    // Tranche 9 owns markGeniusSource (writes to the [re:] tag).
  },
})

// ── Tranche 7 wiring: useImport callbacks ──────────────────────────────────
// initImport wires the setMainText chain + setupAudio/clearAudio + song title
// setters + undo seed. The middle-click + file-picker @change handlers are
// attached in onMounted (document-level + element-level listeners).
initImport({
  setMainText,
  getMainText: () => mainText.value,
  doAutosave: (pathHint?: string) => doAutosave(pathHint),
  setupAudio: (file: File, pathHint?: string) => setupAudio(file, pathHint),
  clearAudio: () => {
    const el = audioEl.value
    if (el) {
      el.pause()
      el.src = ''
      audioEl.value = null
    }
    useAppState().playing.value = false
  },
  setSongTitle: (s: string) => { songTitle.value = s },
  setSongArtist: (s: string) => { songArtist.value = s },
  pushSnapshot: () => undoRedo.pushSnapshot(),
  seedUndo: (snap: Snapshot) => undoRedo.seed(snap),
  takeSnapshot: (): Snapshot => ({
    main: mainText.value,
    secondaries: secondaryPool.value.map((e) => e.text),
    mergeDone: mergeDone.value,
  }),
  renderMainLines,
  checkLineCounts,
  updateMergeBtn,
  updateTitleFromText: () => updateTitleFromText(mainText.value),
})

// Wire the undo debounce for useSync's onMainInput — the typing-mode input
// handler schedules a debounced snapshot push. useSync exposes setOnInputCallback
// so it doesn't depend on useUndoRedo (avoids a circular import).
setOnInputCallback(() => {
  undoRedo.scheduleInputSnapshot(useAppState().cfg.value.undo_debounce_ms || 150)
})

// ── Tranche 9 wiring: global keyboard handler ────────────────────────────
// initGlobalHotkeys receives the undo/redo + settings + help/issues callbacks.
// The document-level keydown handler is attached in onMounted (below).
initGlobalHotkeys({
  isSettingsOpen: () => settingsOpen.value,
  toggleSettings: () => {
    settingsOpen.value = !settingsOpen.value
  },
  openHelp: () => {
    window.open('https://github.com/amokprime/linebyline/blob/main/HELP.md', '_blank', 'noopener')
  },
  openIssues: () => {
    window.open('https://github.com/amokprime/linebyline/issues', '_blank', 'noopener')
  },
  doUndo: () => undoRedo.doUndo(),
  doRedo: () => undoRedo.doRedo(),
})

// Re-run updateDynamicTooltips whenever cfg changes (Settings save, capture
// input commit, reset). The watch is deep so nested hotkeys changes trigger.
watch(
  () => useAppState().cfg.value,
  () => updateDynamicTooltips(),
  { deep: true },
)

function expandPanel() {
  panelCollapsed.value = false
  applyPanelCollapse(false)
}

// ── Phase E Tranche 1 — beforeunload dirty check ────────────────────────────
// Parity with the monolith's beforeunload (docs/index.html lines 2766-2770).
// Reads mainText + secondaryPool directly so a stale isDirty (e.g. the watch
// in useAppState hasn't fired yet) can never suppress the warning. The
// returnValue string matches the monolith verbatim.
//
// Port delta: the monolith reads cfg.default_meta (live global); here we read
// cfg.value.default_meta (cfg is now a ref). The secondary check reads
// secondaryPool (all entries) — not secondaryCols (visible-only computed) —
// so hidden entries that still hold text from a previous session trigger the
// warning. This preserves the monolith's intent (warn before losing any text)
// even though the Vue port's secondaryCols semantics differ.
function onBeforeUnload(e: BeforeUnloadEvent) {
  const hasMain =
    mainText.value.trim() !== cfg.value.default_meta.trim() &&
    mainText.value.trim() !== ''
  const hasSec = secondaryPool.value.some((entry) => entry.text.trim() !== '')
  if (hasMain || hasSec) {
    e.preventDefault()
    e.returnValue = 'Progress will not be saved. Are you sure?'
  }
}

onMounted(() => {
  // monolith Init: autoCollapseIfNeeded(); applyPanelCollapse(); resize listener
  autoCollapseIfNeeded()
  applyPanelCollapse()
  window.addEventListener('resize', autoCollapseIfNeeded)
  // monolith Init: restoreAudioDisplay — reactive bindings handle display
  restoreAudioDisplay()
  // monolith Init: loadAutosave — restores text + secondaries + seeds undo.
  // **Port delta**: the monolith clears sessionStorage before loadAutosave
  // (`sessionStorage.removeItem('lbl_autosave')`), which means autosave never
  // restores. The Vue port does NOT clear — the single-file-html-app skill
  // says "reload on init to survive accidental refresh". If the user wants
  // the clear behavior, add `sessionStorage.removeItem('lbl_autosave')` here.
  useAutosave().loadAutosave()
  // monolith Init: renderMainLines — already called by loadAutosave's callback,
  // but call once more to ensure the line list reflects post-init state.
  renderMainLines()
  // monolith Init tail: rebuildHkPanel(); applyMode();
  applyMode()
  // Tranche 9: monolith Init's updateDynamicTooltips() call.
  updateDynamicTooltips()
  // Tranche 7: middle-click → doImport (or open secondary picker if hovering).
  document.addEventListener('mousedown', onMiddleClick)
  // Tranche 7: #file-picker @change → onFilePickerChange (multi-file dispatch).
  const fp = filePicker.value
  if (fp) fp.addEventListener('change', onFilePickerChange)
  // Tranche 9: document-level keydown for hotkey dispatch.
  document.addEventListener('keydown', onGlobalKeydown)
  // Phase E Tranche 1: beforeunload dirty check (warn before losing unsaved work).
  window.addEventListener('beforeunload', onBeforeUnload)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', autoCollapseIfNeeded)
  document.removeEventListener('mousedown', onMiddleClick)
  document.removeEventListener('keydown', onGlobalKeydown)
  const fp = filePicker.value
  if (fp) fp.removeEventListener('change', onFilePickerChange)
  // Phase E Tranche 1: remove the beforeunload listener to avoid leaks on
  // hot-reload during dev (Vite HMR re-mounts App.vue without a page reload).
  window.removeEventListener('beforeunload', onBeforeUnload)
})
</script>

<template>
  <ThemeProvider>
    <div class="app-shell">
      <MenuBar @open-settings="settingsOpen = true" />
      <main id="main">
        <h1 class="sr-only">
          LineByLine
        </h1>
        <LeftPanel />
        <button
          id="btn-expand-panel"
          :ref="setExpandRef"
          :class="{ visible: panelCollapsed }"
          title="Expand panel"
          aria-label="Expand panel"
          @click="expandPanel"
          @mousedown.prevent
        >
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          ><rect
            width="18"
            height="18"
            x="3"
            y="3"
            rx="2"
          /><path d="M9 3v18" /></svg>
        </button>
        <EditorArea />
      </main>
      <SettingsDialog v-model:open="settingsOpen" />
      <!-- Tranche 7: #file-picker — doImport opens it via ref; the @change
           handler dispatches to useImport.onFilePickerChange (multi-file:
           audio-only / lrc-only / audio+lrc pair). -->
      <input
        id="file-picker"
        ref="filePicker"
        type="file"
        multiple
        accept="audio/*,.lrc,.txt"
        style="display: none"
        aria-label="File picker"
      >
      <div
        id="a11y-announcer"
        class="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />
    </div>
  </ThemeProvider>
</template>

<style scoped>
/* Monolith body + #main frame, verbatim values; tokens per the Phase B table.
   Port delta: the monolith's html{font-size:14.3px} + body{font-size:1rem}
   pair becomes an explicit shell font-size — the root font stays untouched so
   Tailwind's rem utilities keep their standard scale. */
.app-shell {
  font-family: system-ui, sans-serif;
  font-size: 14.3px;
  background: var(--background);
  color: var(--foreground);
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
}
#main {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}
#btn-expand-panel {
  display: none;
  width: 28px;
  height: 100%;
  border: none;
  background: var(--card);
  border-right: 1px solid var(--border);
  cursor: pointer;
  color: var(--muted-foreground);
  padding: 13px 0 0 0;
  align-items: flex-start;
  justify-content: center;
  flex-shrink: 0;
}
#btn-expand-panel:hover {
  background: var(--background);
  color: var(--foreground);
}
#btn-expand-panel:active {
  filter: brightness(0.88);
}
#btn-expand-panel.visible {
  display: flex;
}
</style>
