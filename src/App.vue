<script setup lang="ts">
// Modular app root. Phase C complete: every monolith element lives in a Vue
// component (this shell carries the two app-level hidden nodes — #file-picker
// for the Phase D import composable, #a11y-announcer for the _announce port).
// Next: the Phase D state composables bind the inert controls, with the
// global keyboard handler port landing there (it dispatches to ~30 actions
// and needs the state composables to exist first).
import { onBeforeUnmount, onMounted, ref } from 'vue'
import ThemeProvider from './components/ThemeProvider.vue'
import MenuBar from './components/MenuBar.vue'
import LeftPanel from './components/LeftPanel.vue'
import EditorArea from './components/EditorArea.vue'
import SettingsDialog from './components/SettingsDialog.vue'
import { usePanelCollapse } from './composables/usePanelCollapse'

const { panelCollapsed, applyPanelCollapse, autoCollapseIfNeeded, setExpandRef } =
  usePanelCollapse()

const settingsOpen = ref(false)

function expandPanel() {
  panelCollapsed.value = false
  applyPanelCollapse(false)
}

onMounted(() => {
  // monolith Init: autoCollapseIfNeeded(); applyPanelCollapse(); resize listener
  autoCollapseIfNeeded()
  applyPanelCollapse()
  window.addEventListener('resize', autoCollapseIfNeeded)
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
