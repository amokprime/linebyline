<script setup lang="ts">
// Editor area — structure ported from the monolith (#editor-wrapper >
// #editor-scroll > #editor-area > the main field column: header with the
// paren-wrap "( )" and split "↩" toggles, warn bar, lyric line list, and the
// raw textarea behind it, followed by the secondary field columns). The main
// column is the tranche-3 layout shell: line rendering, textarea contents,
// the two checkboxes and the warn bar all bind to Phase D state composables.
//
// Phase D Tranche 3 wiring: registers template refs for #main-scroll,
// #main-textarea, #main-lines and passes them to useModeSwitch.initModeSwitch
// so the composable can read/write the DOM during applyMode().
//
// Phase D Tranche 5 wiring: registers the same refs with useSync.initSync,
// ports renderMainLines from the monolith (delegated mousedown handler on
// #main-lines), adds @input + @paste on #main-textarea, and @paste on
// #main-lines (hotkey-mode overwrite path). The two-way textarea binding
// is :value + @input (NOT v-model — programmatic mainText writes shouldn't
// trigger the input side-effect chain, only user typing should).
//
// Phase D Tranche 6 wiring: secondary field columns now render from
// useAppState.secondaryCols (computed over the pool — Tranche 1 made
// secondaryPool the single source of truth). The main warn bar binds to
// useAppState.mainWarnText / mainWarnVisible (Tranche 6 additions — the
// monolith imperatively wrote #main-warn.textContent; Vue binds reactively).
// The #main-scroll @scroll handler syncs secondary fields via useMerge.syncScrollFrom.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import SecondaryField from './SecondaryField.vue'
import { initModeSwitch } from '../composables/useModeSwitch'
import { useAppState } from '../composables/useAppState'
import {
  initSync,
  onMainInput,
  onMainLinesContextMenu,
  onMainLinesMouseDown,
  onMainLinesPaste,
  onMainPaste,
  renderMainLines,
} from '../composables/useSync'
import { syncScrollFrom } from '../composables/useMerge'

// mainText + secondaryPool + main warn-bar state from useAppState.
// Tranche 6 iterates over secondaryPool (not the secondaryCols computed)
// so each SecondaryField receives its actual pool index as a prop — the
// `:index` is positional to the pool, not to the visible-column list. This
// matches the monolith's "Secondary N" label where N is the pool position + 1
// (preserved across hide/reuse — the monolith's removeSecondary pops the
// last visible, so hidden entries are always at the end of the pool, and
// addSecondary reuses the first hidden — pool index always matches the
// visible position when hidden entries are contiguous at the end).
const { mainText, secondaryPool, mainWarnText, mainWarnVisible } = useAppState()

// Template refs consumed by useModeSwitch.applyMode() + useSync.renderMainLines().
// The refs are empty until mount; both composables read .value at call time
// and no-op pre-mount.
const mainScroll = ref<HTMLElement | null>(null)
const mainTextarea = ref<HTMLTextAreaElement | null>(null)
const mainLines = ref<HTMLElement | null>(null)

// Phase D Tranche 5 ports renderMainLines from the monolith — fills #main-lines
// with .lrc-line <li> children parsed from mainText. Imported from useSync; the
// call site in useModeSwitch (applyMode's hotkey-mode branch) calls the same
// function via the renderMainLines callback parameter. LeftPanel registers
// the #seek-offset input ref separately via setSeekOffsetRef.
initSync({ mainLines, mainTextarea, mainScroll }, {})

// Register the refs + the real renderMainLines with the mode-switch singleton.
// App.vue's onMounted calls applyMode() (monolith Init parity: rebuildHkPanel +
// applyMode at the end of the startup sequence).
initModeSwitch({ mainScroll, mainTextarea, mainLines }, renderMainLines)

// Attach delegated mousedown + contextmenu + paste handlers to #main-lines
// in onMounted (the refs are populated by then). Also attaches @scroll to
// #main-scroll for secondary-field scroll sync (the monolith's syncScrollFrom
// was attached to #main-scroll directly).
onMounted(() => {
  const ml = mainLines.value
  if (ml) {
    ml.addEventListener('mousedown', onMainLinesMouseDown)
    ml.addEventListener('contextmenu', onMainLinesContextMenu)
    ml.addEventListener('paste', onMainLinesPaste)
  }
  const ms = mainScroll.value
  if (ms) {
    ms.addEventListener('scroll', () => syncScrollFrom(ms))
  }
})
onBeforeUnmount(() => {
  const ml = mainLines.value
  if (ml) {
    ml.removeEventListener('mousedown', onMainLinesMouseDown)
    ml.removeEventListener('contextmenu', onMainLinesContextMenu)
    ml.removeEventListener('paste', onMainLinesPaste)
  }
})
</script>

<template>
  <div id="editor-wrapper">
    <div id="editor-scroll">
      <div id="editor-area">
        <div
          id="main-col"
          class="field-col"
        >
          <div
            class="field-header"
            style="justify-content: flex-start"
            aria-label="Main field header"
          >
            <span class="field-header-label">Main</span>
            <label
              id="main-paren-label"
              style="display: flex; align-items: center; gap: 4px; font-size: 12px; cursor: pointer; white-space: nowrap; color: var(--muted-foreground)"
              title="Wrap marked translations in parentheses"
            ><input
              id="main-paren-check"
              type="checkbox"
              checked
              style="width: 13px; height: 13px; cursor: pointer; accent-color: var(--primary)"
            > ( )</label>
            <label
              id="main-split-label"
              style="display: flex; align-items: center; gap: 4px; font-size: 12px; cursor: pointer; white-space: nowrap; color: var(--muted-foreground)"
              title="Split trailing parenthesized groups to new translation lines on Ctrl+ArrowLeft"
            ><input
              id="main-split-check"
              type="checkbox"
              style="width: 13px; height: 13px; cursor: pointer; accent-color: var(--primary)"
            > ↩</label>
          </div>
          <div
            id="main-warn"
            class="warn-bar"
            role="alert"
            :class="{ visible: mainWarnVisible }"
          >{{ mainWarnText }}</div>
          <div
            id="main-scroll"
            ref="mainScroll"
            class="lyric-scroll"
          >
            <!-- Phase D Tranche 5: renderMainLines (useSync) fills the .lrc-line children -->
            <ul
              id="main-lines"
              ref="mainLines"
              class="lyric-area"
              aria-label="Lyric lines"
            />
          </div>
          <textarea
            id="main-textarea"
            ref="mainTextarea"
            spellcheck="false"
            aria-label="Main lyric text"
            :value="mainText"
            @input="onMainInput"
            @paste="onMainPaste"
          />
        </div>
        <!-- Phase D Tranche 6: renders from secondaryPool (the single source
             of truth — Tranche 1). `v-if="entry.visible"` hides pool entries
             that were hidden by removeSecondary; the `:key` is the pool
             index + 1 (1-based, matches the "Secondary N" label) so Vue can
             track entries across hide/reuse without remounting. -->
        <SecondaryField
          v-for="(entry, i) in secondaryPool"
          v-show="entry.visible"
          :key="i + 1"
          :index="i + 1"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Monolith CSS, verbatim values; tokens mapped per the Phase B table
   (--surface→--card, --bg→--background, --text→--foreground,
   --text-muted→--muted-foreground, --border-mid→--input); blue accent rules
   (.lrc-line.cursor border, line-flash start) use --primary; the monolith's
   [data-theme="dark"] selectors become .dark. The shared field-column rules
   (.field-col/.field-header/.field-header-label/.fh-btn/.warn-bar) moved to
   style.css — SecondaryField renders the same column structure. */
#editor-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}
#editor-scroll {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  display: flex;
}
#editor-area {
  display: flex;
  min-width: 100%;
  height: 100%;
}
.lyric-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  user-select: text;
}
.lyric-area {
  font-family: var(--editor-font);
  font-size: var(--editor-size);
  line-height: 1.75;
  padding: 4.4px 0;
  min-height: 100%;
  list-style: none;
  margin: 0;
}
.lrc-line {
  padding: 1px 8.8px;
  white-space: nowrap;
  cursor: pointer;
}
.lrc-line:hover {
  background: var(--background);
}
@keyframes line-flash {
  0% {
    background: var(--primary);
    color: #fff;
  }
  100% {
    background: var(--active-bg);
    color: var(--active-text);
  }
}
.lrc-line.active {
  background: var(--active-bg);
  color: var(--active-text);
  font-weight: 600;
}
.lrc-line.active.flash {
  animation: line-flash 0.35s ease-out forwards;
}
.lrc-line .ts {
  color: var(--muted-foreground);
  margin-right: 2px;
}
.lrc-line.active .ts {
  color: var(--active-ts);
}
.lrc-line.end-ts {
  color: var(--muted-foreground);
  font-style: italic;
}
.lrc-line.blank-line {
  cursor: default;
}
.lrc-line.cursor {
  border-left: 3px solid var(--primary);
  padding-left: calc(8.8px - 3px);
  background: var(--background);
}
.lrc-line.selected {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.lrc-line.active.cursor {
  border-left: 3px solid var(--primary);
  padding-left: calc(8.8px - 3px);
}
.lrc-line.cursor .ts {
  color: var(--active-ts);
}
.dark .lrc-line.cursor {
  background: rgba(88, 166, 255, 0.07);
}
#main-textarea {
  flex: 1;
  font-family: var(--editor-font);
  font-size: var(--editor-size);
  line-height: 1.75;
  padding: 4.4px 8.8px;
  border: none;
  outline: none;
  resize: none;
  background: var(--card);
  color: var(--foreground);
  overflow-y: auto;
  white-space: pre;
  display: none;
  tab-size: 4;
}
#main-textarea.visible {
  display: block;
}
</style>