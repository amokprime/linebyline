<script setup lang="ts">
// Modular app root. Phase C tranche 5: the frame plus the SettingsDialog
// (menu-bar settings button opens it; reka-ui owns focus trap/Escape/
// backdrop). Remaining: the global keyboard handler tranche, with the Phase D
// state composables binding the inert controls as they land.
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
