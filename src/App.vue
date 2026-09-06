<script setup lang="ts">
// Modular app root. Phase C tranche 2: the menu-bar shell (theme + font
// functional). The main region fills in over the coming tranches: main layout
// (panels, editor columns, lyric area) → ControlsPanel/HotkeyCell →
// SettingsDialog → global keyboard handler (Phase D composables behind them).
import ThemeProvider from './components/ThemeProvider.vue'
import MenuBar from './components/MenuBar.vue'
</script>

<template>
  <ThemeProvider>
    <div class="flex flex-col overflow-hidden bg-background text-foreground h-dvh">
      <MenuBar />
      <main class="min-h-0 flex-1">
        <h1 class="sr-only">
          LineByLine
        </h1>
      </main>
    </div>
  </ThemeProvider>
</template>
