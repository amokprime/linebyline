<script setup lang="ts">
// Modular app root. Phase C complete: every monolith element lives in a Vue
// component (this shell carries the two app-level hidden nodes — #file-picker
// for the Phase D import composable, #a11y-announcer for the _announce port).
// Next: the Phase D state composables bind the inert controls, with the
// global keyboard handler port landing there (it dispatches to ~30 actions
// and needs the state composables to exist first).
//
// Phase D Tranche 3 wiring: calls applyMode() in onMounted as the last step
// of the Init sequence (monolith line ~10217: `rebuildHkPanel(); applyMode();`).
// EditorArea's setup calls initModeSwitch() with its template refs, so by the
// time App.vue's onMounted fires (children mount before parents), the
// mode-switch singleton is bound and applyMode() can read the refs.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import ThemeProvider from './components/ThemeProvider.vue'
import MenuBar from './components/MenuBar.vue'
import LeftPanel from './components/LeftPanel.vue'
import EditorArea from './components/EditorArea.vue'
import SettingsDialog from './components/SettingsDialog.vue'
import { usePanelCollapse } from './composables/usePanelCollapse'
import { applyMode } from './composables/useModeSwitch'
import { restoreAudioDisplay, setAudioCallbacks } from './composables/useAudio'
import { useAutosave, initAutosave, doAutosave } from './composables/useAutosave'
import { updateTitleFromText } from './composables/useTitle'
import { useUndoRedo, type Snapshot } from './composables/useUndoRedo'
import { useAppState } from './composables/useAppState'

const { panelCollapsed, applyPanelCollapse, autoCollapseIfNeeded, setExpandRef } =
  usePanelCollapse()

const settingsOpen = ref(false)

// ── Tranche 2 wiring: autosave + title + undo/redo ──────────────────────────
// Instantiate useUndoRedo with take/apply callbacks that read from useAppState.
// Tranche 5 ports applySnapshot's full side-effect chain (renderMainLines,
// checkLineCounts, updateMergeBtn, etc.); for now applySnapshot is a stub that
// writes mainText + mergeDone — enough for undo/redo to not crash.
const { mainText, secondaryPool, mergeDone } = useAppState()

const undoRedo = useUndoRedo({
  takeSnapshot: (): Snapshot => ({
    main: mainText.value,
    secondaries: secondaryPool.value.map((e) => e.text),
    mergeDone: mergeDone.value,
  }),
  applySnapshot: (snap: Snapshot) => {
    mainText.value = snap.main
    // Tranche 5/6: renderMainLines, checkLineCounts, updateMergeBtn, clear extra secondaries
    mergeDone.value = snap.mergeDone
  },
})

// Wire useAutosave callbacks — read/write mainText, call useTitle, seed undo.
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
  // Tranche 5/6 stubs:
  renderMainLines: () => {},
  checkLineCounts: () => {},
})

// Wire useAudio callbacks — doAutosave + updateTitleFromText + getMainText.
// setAudioCallbacks is separate from initAudio (which LeftPanel calls with
// the DOM refs). App.vue doesn't have the audio refs, only the callbacks.
setAudioCallbacks({
  getMainText: () => mainText.value,
  setMainText: (t: string) => { mainText.value = t },
  doAutosave: (pathHint?: string) => doAutosave(pathHint),
  updateTitleFromText: () => updateTitleFromText(mainText.value),
  // Tranche 5/6/9 stubs:
  renderMainLines: () => {},
  updateActiveLineFromTime: () => {},
  scrollToPlaying: () => {},
  syncSecScroll: () => {},
  announce: () => {},
})

function expandPanel() {
  panelCollapsed.value = false
  applyPanelCollapse(false)
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
  // monolith Init tail: rebuildHkPanel(); applyMode();
  applyMode()
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', autoCollapseIfNeeded)
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
      <!-- Phase D: doImport opens #file-picker; _announce writes to the
           announcer (monolith body tail, ported inert) -->
      <input
        id="file-picker"
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
