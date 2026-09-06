<script setup lang="ts">
// Menu-bar shell — full markup ported from the monolith <nav id="menu-bar">.
// Wired this tranche: theme toggle (useTheme) and the FontSelector. The
// remaining actions are rendered but inert until their tranches: import/save/
// undo/redo/add-field/hide-field/merge get handlers from the Phase D state
// composables, settings opens the SettingsDialog (later tranche), and the
// dynamic tooltips (updateDynamicTooltips embeds hotkey labels) need the
// config composable — static titles until then.
// Focus-prevention mousedown is ported verbatim (menu-bar slice): clicking a
// button must not steal focus from the editor area.
import FontSelector from './FontSelector.vue'
import { THEME_ICONS, useTheme } from '../composables/useTheme'

const { themeMode, cycleTheme } = useTheme()

function onMousedown(e: MouseEvent) {
  if ((e.target as HTMLElement).closest('button')) e.preventDefault()
}
</script>

<template>
  <nav
    id="menu-bar"
    aria-label="Main toolbar"
    @mousedown="onMousedown"
  >
    <!-- Phase D: import composable (file picker, middle-click, multi-file) -->
    <button
      id="btn-import"
      title="Open (Middle click)"
      aria-label="Open file"
    >
      📂
    </button>
    <!-- Phase D: save/download handler -->
    <button
      id="btn-save"
      title="Save"
      aria-label="Save"
    >
      💾
    </button>
    <div class="mb-sep" />
    <!-- Phase D: undo/redo composables (single-push snapshot model) -->
    <button
      id="btn-undo"
      class="mb-btn icon"
      title="Undo"
      aria-label="Undo"
    >
      <svg
        aria-hidden="true"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      ><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>
    </button>
    <button
      id="btn-redo"
      class="mb-btn icon"
      title="Redo"
      aria-label="Redo"
    >
      <svg
        aria-hidden="true"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      ><path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" /></svg>
    </button>
    <div class="mb-sep" />
    <FontSelector />
    <div class="mb-sep" />
    <!-- Phase D: secondary-field composables (add/remove, 10-field cap) -->
    <button
      class="mb-btn"
      title="Add secondary field"
    >
      Add field
    </button>
    <button
      disabled
      aria-disabled="true"
      title="Hide last secondary field"
    >
      Hide field
    </button>
    <!-- Phase D: merge composable (mergeTranslations) -->
    <button
      class="mb-btn accent"
      disabled
      aria-disabled="true"
      title="Merge fields"
    >
      Merge fields
    </button>
    <div class="mb-sep" />
    <!-- SettingsDialog tranche: opens the settings overlay -->
    <button
      id="btn-settings"
      title="Settings"
      aria-label="Settings"
    >
      ⚙️
    </button>
    <button
      id="btn-theme"
      title="Toggle theme"
      aria-label="Toggle theme"
      @click="cycleTheme"
    >
      {{ THEME_ICONS[themeMode] }}
    </button>
    <a
      id="btn-help"
      href="https://github.com/amokprime/linebyline/blob/main/HELP.md"
      target="_blank"
      rel="noopener"
      title="Help"
    ><strong>?</strong></a>
    <a
      id="btn-issues"
      href="https://github.com/amokprime/linebyline/issues"
      target="_blank"
      rel="noopener"
      title="Issues"
    ><svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    ><path d="M12 20v-9" /><path d="M14 7a4 4 0 0 1 4 4v3a6 6 0 0 1-12 0v-3a4 4 0 0 1 4-4z" /><path d="M14.12 3.88 16 2" /><path d="M21 21a4 4 0 0 0-3.81-4" /><path d="M21 5a4 4 0 0 1-3.55 3.97" /><path d="M22 13h-4" /><path d="M3 21a4 4 0 0 1 3.81-4" /><path d="M3 5a4 4 0 0 0 3.55 3.97" /><path d="M6 13H2" /><path d="m8 2 1.88 1.88" /><path d="M9 7.13V6a3 3 0 1 1 6 0v1.13" /></svg></a>
  </nav>
</template>

<style scoped>
/* Monolith menu-bar CSS, verbatim values; tokens mapped per the Phase B table:
   --surface→--card, --border-mid→--input, --text→--foreground, --bg→--background,
   --text-muted→--muted-foreground; and the documented --accent flip: the
   monolith's blue accent (button text, focus ring) is --primary here, its tint
   (--accent-bg) is --accent. */
#menu-bar {
  display: flex;
  align-items: center;
  height: 39.6px;
  background: var(--card);
  border-bottom: 1px solid var(--border);
  padding: 0 8.8px;
  gap: 4.4px;
  flex-shrink: 0;
  flex-wrap: nowrap;
  overflow-x: auto;
}
.mb-btn {
  height: 28.6px;
  padding: 0 11px;
  border: 1px solid var(--input);
  border-radius: var(--radius);
  background: transparent;
  color: var(--foreground);
  font-size: 13.2px;
  cursor: pointer;
  white-space: nowrap;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.mb-btn:hover {
  background: var(--background);
}
.mb-btn:active {
  filter: brightness(0.88);
  transform: translateY(1px);
}
.mb-btn.icon {
  width: 33px;
  padding: 0;
  justify-content: center;
  font-size: 16.5px;
}
.mb-btn.accent {
  background: var(--accent);
  color: var(--primary);
  border-color: var(--accent-border);
}
.mb-btn.accent:hover {
  filter: brightness(0.95);
}
.mb-btn.accent:disabled {
  opacity: 0.4;
  cursor: default;
  background: transparent;
  color: var(--muted-foreground);
  border-color: var(--input);
}
.mb-btn:disabled {
  opacity: 0.4;
  cursor: default;
}
.mb-sep {
  width: 1px;
  height: 17.6px;
  background: var(--border);
  margin: 0 2.2px;
  flex-shrink: 0;
}
#btn-theme,
#btn-settings,
#btn-import,
#btn-save,
#btn-help,
#btn-issues {
  height: 28.6px;
  width: 33px;
  border: 1px solid var(--input);
  border-radius: var(--radius);
  background: transparent;
  cursor: pointer;
  color: var(--foreground);
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  text-decoration: none;
}
#btn-theme:hover,
#btn-settings:hover,
#btn-import:hover,
#btn-save:hover,
#btn-help:hover,
#btn-issues:hover {
  background: var(--background);
}
#btn-theme:active,
#btn-settings:active,
#btn-import:active,
#btn-save:active,
#btn-help:active,
#btn-issues:active {
  filter: brightness(0.88);
  transform: translateY(1px);
}
</style>
