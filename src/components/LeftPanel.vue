<script setup lang="ts">
// Left panel — structure ported from the monolith (#left-panel: header with
// the collapse button, #audio-box, #controls-box). The collapse state lives
// in usePanelCollapse (App owns the expand button; this component registers
// the collapse button's ref for focus transfers).
//
// Phase D Tranche 4 wiring: audio controls (play/pause, volume, seek, speed,
// progress bar) are now reactive — bound to useAudio's state refs + action
// functions. The sync-file button and seek-offset arrows stay inert (Tranche 5
// owns tickSeekOffset / doSyncFile / setOffsetMode). The hotkey grid
// (ControlsPanel) was wired in Tranche 3.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { usePanelCollapse } from '../composables/usePanelCollapse'
import { useAudio } from '../composables/useAudio'
import { useTitle } from '../composables/useTitle'
import { useAppState } from '../composables/useAppState'
import ControlsPanel from './ControlsPanel.vue'

const { panelCollapsed, applyPanelCollapse, setCollapseRef } = usePanelCollapse()

// Audio — initAudio is called with the two refs useAudio needs at module
// level (#progress-wrap for the drag, #seek-offset for getSeekOffset). The rest
// of the audio state (volume, speed, play/pause, time display) is consumed
// reactively via the destructured refs + computed values.
const progressWrap = ref<HTMLElement | null>(null)
const seekOffset = ref<HTMLInputElement | null>(null)

const {
  initAudio,
  masterVolume,
  muted,
  speedDisplay,
  progressPct,
  timePosText,
  timeDurText,
  ariaValueNow,
  ariaValueText,
  playing,
  togglePlay,
  toggleMute,
  onVolInput,
  onVolWheel,
  onSpeedChange,
  changeSpeed,
  doSeekBack,
  doSeekFwd,
  mountProgressDrag,
} = useAudio()

initAudio({ progressWrap, seekOffset })

// Song title/artist — from useTitle (Tranche 2). useAudio.setupAudio sets
// songTitle from the filename; updateTitleFromText overwrites with [ti:]/[ar:].
const { songTitle, songArtist } = useTitle()

// Live cfg for the sync-file hotkey badge + vol-slider step (was DEFAULT_CFG
// in Phase C; Tranche 3 swapped ControlsPanel to live cfg, Tranche 4 does the
// same for LeftPanel's badge + vol step).
const { cfg } = useAppState()
const syncFileKey = cfg.value.hotkeys.sync_file || ''
const volStep = cfg.value.vol_increment || 0.1

function collapsePanel() {
  panelCollapsed.value = true
  applyPanelCollapse(false)
}

// Progress bar drag — mount in onMounted, cleanup in onBeforeUnmount.
let cleanupDrag: (() => void) | null = null

// Tranche 5 callback stubs — doSyncFile, tickSeekOffset, setOffsetMode.
// LeftPanel wires the buttons to no-ops until Tranche 5 ships useSync.
function onSyncFile() {
  // Tranche 5: doSyncFile()
}
function onSeekOffsetTick(_delta: number) {
  // Tranche 5: tickSeekOffset(_delta) — reads cfg.seek_offset_tick.
  // Underscore prefix marks the parameter as intentionally unused (S3735:
  // replaces the `void delta` no-op with the conventional TS/JS pattern;
  // matches onSeekOffsetChange's `_e` below).
}
function onSeekOffsetChange(_e: Event) {
  // Tranche 5: sync #seek-offset value to cfg.seek_offset
}

onMounted(() => {
  cleanupDrag = mountProgressDrag()
})
onBeforeUnmount(() => {
  if (cleanupDrag) cleanupDrag()
})
</script>

<template>
  <div
    id="left-panel"
    :class="{ collapsed: panelCollapsed }"
    :inert="panelCollapsed"
  >
    <div id="left-panel-header">
      <div
        id="now-playing-label"
        class="section-label"
        style="margin: 0"
      >
        Now playing
      </div>
      <button
        id="btn-collapse-panel"
        :ref="setCollapseRef"
        title="Collapse panel"
        aria-label="Collapse panel"
        @click="collapsePanel"
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
    </div>
    <section
      id="audio-box"
      aria-labelledby="now-playing-label"
    >
      <div
        id="song-title"
        aria-label="Song title"
      >
        {{ songTitle }}
      </div>
      <div
        id="song-artist"
        aria-label="Song artist"
      >
        {{ songArtist }}
      </div>
      <div
        id="progress-wrap"
        ref="progressWrap"
        role="slider"
        aria-label="Playback position"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="ariaValueNow"
        :aria-valuetext="ariaValueText"
      >
        <div
          id="progress-fill"
          :style="{ width: progressPct + '%' }"
        />
      </div>
      <div id="time-row">
        <span
          id="time-pos"
          aria-label="Current position"
        >{{ timePosText }}</span>
        <span
          id="time-dur"
          aria-label="Duration"
        >{{ timeDurText }}</span>
      </div>
      <div id="media-row">
        <input
          id="speed-val"
          type="number"
          :value="speedDisplay"
          min="0.05"
          max="4"
          step="0.01"
          title="Playback speed"
          aria-label="Playback speed"
          @change="onSpeedChange"
        >
        <span style="font-size: 12px; color: var(--muted-foreground)">x</span>
        <div
          class="fs-spinner"
          style="height: 24.2px"
        >
          <button
            id="speed-up-btn"
            class="fs-tick"
            title="Increase speed"
            @click="changeSpeed(1)"
          >
            ▲
          </button>
          <button
            id="speed-down-btn"
            class="fs-tick"
            title="Reduce speed"
            @click="changeSpeed(-1)"
          >
            ▼
          </button>
        </div>
        <button
          id="btn-seek-back"
          class="media-btn"
          title="Seek back 5s (Ctrl+A)"
          aria-label="Seek back"
          @click="doSeekBack"
        >
          <svg
            aria-hidden="true"
            width="18"
            height="14"
            viewBox="0 0 18 14"
            fill="currentColor"
          ><polygon points="9,0 1,7 9,14" /><rect
            x="10"
            y="0"
            width="4"
            height="14"
            rx="1.5"
          /></svg>
        </button>
        <button
          id="btn-play-pause"
          class="media-btn"
          :title="playing ? 'Pause (Ctrl+Space)' : 'Play (Ctrl+Space)'"
          :aria-label="playing ? 'Pause' : 'Play'"
          @click="togglePlay"
        >
          <svg
            id="media-play-icon"
            aria-hidden="true"
            width="11"
            height="13"
            viewBox="0 0 11 13"
            fill="currentColor"
            :style="{ display: playing ? 'none' : '' }"
          ><polygon points="1,0 11,6.5 1,13" /></svg>
          <svg
            id="media-pause-icon"
            aria-hidden="true"
            width="11"
            height="13"
            viewBox="0 0 11 13"
            fill="currentColor"
            :style="{ display: playing ? '' : 'none' }"
          ><rect
            x="0"
            y="0"
            width="4"
            height="13"
            rx="1.5"
          /><rect
            x="7"
            y="0"
            width="4"
            height="13"
            rx="1.5"
          /></svg>
        </button>
        <button
          id="btn-seek-fwd"
          class="media-btn"
          title="Seek forward 5s (Ctrl+D)"
          aria-label="Seek forward"
          @click="doSeekFwd"
        >
          <svg
            aria-hidden="true"
            width="18"
            height="14"
            viewBox="0 0 18 14"
            fill="currentColor"
          ><rect
            x="4"
            y="0"
            width="4"
            height="14"
            rx="1.5"
          /><polygon points="9,0 17,7 9,14" /></svg>
        </button>
      </div>
      <div id="seek-row">
        <input
          id="seek-offset"
          ref="seekOffset"
          type="number"
          value="0"
          title="Seek offset (ms): shifts playback position when clicking a timestamped line"
          aria-label="Seek offset in milliseconds"
          @change="onSeekOffsetChange"
        >
        <span>ms</span>
        <div
          class="fs-spinner"
          style="height: 24.2px"
        >
          <button
            id="seek-arr-fwd"
            class="fs-tick"
            title="Increase seek offset"
            @click="onSeekOffsetTick(1000)"
          >
            ▲
          </button>
          <button
            id="seek-arr-back"
            class="fs-tick"
            title="Decrease seek offset"
            @click="onSeekOffsetTick(-1000)"
          >
            ▼
          </button>
        </div>
        <button
          id="sync-file-btn"
          title="Sync file"
          aria-label="Sync file"
          @click="onSyncFile"
        >
          Sync file
          <span
            v-if="syncFileKey"
            class="hk-key"
          >{{ syncFileKey }}</span>
        </button>
        <span id="sync-file-hk" />
      </div>
      <div id="vol-row">
        <button
          id="vol-mute-btn"
          :title="muted ? 'Unmute (Ctrl+M)' : 'Mute (Ctrl+M)'"
          :aria-label="muted ? 'Unmute' : 'Mute'"
          @click="toggleMute"
        >
          <svg
            id="vol-icon"
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            :style="{ display: muted ? 'none' : '' }"
          ><path d="M9 2.5v11l-4-3H2a1 1 0 01-1-1v-3a1 1 0 011-1h3l4-3zM12.07 5.07a5 5 0 010 5.86M13.5 3.5a7.5 7.5 0 010 9" /></svg>
          <svg
            id="mute-icon"
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            :style="{ display: muted ? '' : 'none' }"
          ><path d="M9 2.5v11l-4-3H2a1 1 0 01-1-1v-3a1 1 0 011-1h3l4-3zM11.5 6l3 4m0-4l-3 4" /></svg>
        </button>
        <input
          id="vol-slider"
          type="range"
          min="0"
          max="1"
          :step="volStep"
          :value="masterVolume"
          aria-label="Volume"
          @input="onVolInput"
          @wheel="onVolWheel"
        >
        <span
          id="vol-pct"
          aria-label="Volume percentage"
        >{{ Math.round(masterVolume * 100) }}%</span>
      </div>
    </section>
    <section
      id="controls-box"
      aria-labelledby="controls-label"
    >
      <div
        id="controls-label"
        class="section-label"
        style="margin-top: 4px"
      >
        Controls
      </div>
      <fieldset
        id="hk-grid"
        class="hk-grid"
        aria-labelledby="controls-label"
      >
        <ControlsPanel />
      </fieldset>
    </section>
  </div>
</template>

<style scoped>
/* Monolith CSS, verbatim values; tokens mapped per the Phase B table
   (--surface→--card, --bg→--background, --text→--foreground,
   --text-muted→--muted-foreground, --border-mid→--input); the blue accent
   (--progress fill) is --primary. */
#left-panel {
  width: fit-content;
  min-width: 310px;
  border-right: 1px solid var(--border);
  background: var(--card);
  display: flex;
  flex-direction: column;
  padding: 8.8px;
  gap: 6.6px;
  overflow-y: auto;
  flex-shrink: 0;
  transition:
    width 0.2s,
    min-width 0.2s,
    padding 0.2s;
}
#left-panel.collapsed {
  width: 0;
  min-width: 0;
  padding: 0;
  overflow: hidden;
}
#left-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
#btn-collapse-panel {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--muted-foreground);
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: var(--radius);
}
#btn-collapse-panel:hover {
  background: var(--border);
  color: var(--foreground);
}
#btn-collapse-panel:active {
  filter: brightness(0.88);
  transform: scale(0.92);
}
.section-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--foreground);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 2px;
}
#audio-box {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--background);
  padding: 8.8px;
  display: flex;
  flex-direction: column;
  gap: 4.4px;
}
#controls-box {
  display: flex;
  flex-direction: column;
  gap: 3.3px;
}
/* fieldset reset + grid layout (monolith .hk-grid, verbatim); the reset is
   required for the fieldset element per the aria-accessibility skill */
.hk-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3.3px;
  border: none;
  margin: 0;
  padding: 0;
  min-inline-size: 0;
}
#song-title {
  font-size: 13.2px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
#song-artist {
  font-size: 12px;
  color: var(--muted-foreground);
}
#progress-wrap {
  height: 4.4px;
  background: var(--border);
  border-radius: 2px;
  margin: 2px 0;
  cursor: pointer;
}
#progress-fill {
  height: 4.4px;
  background: var(--primary);
  border-radius: 2px;
  width: 0%;
  pointer-events: none;
}
#time-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--muted-foreground);
}
#seek-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--muted-foreground);
  margin-top: 2px;
}
#seek-offset {
  width: 52px;
  height: 24.2px;
  font-size: 12px;
  font-family: inherit;
  text-align: right;
  padding: 0 4px;
  border: 1px solid var(--input);
  border-radius: var(--radius);
  background: transparent;
  color: var(--foreground);
  -moz-appearance: textfield;
}
#seek-offset::-webkit-inner-spin-button,
#seek-offset::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
#media-row {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 2px;
}
#speed-val {
  width: 39px;
  height: 24.2px;
  font-size: 12px;
  font-family: inherit;
  text-align: right;
  padding: 0 4px;
  border: 1px solid var(--input);
  border-radius: var(--radius);
  background: transparent;
  color: var(--foreground);
  -moz-appearance: textfield;
}
#speed-val::-webkit-inner-spin-button,
#speed-val::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
#vol-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}
.media-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 28px;
  border: 1px solid var(--border);
  border-radius: 5px;
  background: transparent;
  color: var(--foreground);
  cursor: pointer;
  padding: 0;
}
.media-btn:hover {
  background: var(--border);
}
.media-btn:active {
  filter: brightness(0.88);
  transform: translateY(1px);
}
#vol-mute-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--muted-foreground);
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
#vol-mute-btn:hover {
  color: var(--foreground);
}
#vol-mute-btn:active {
  transform: scale(0.88);
}
#vol-slider {
  flex: 1;
  accent-color: var(--primary);
  cursor: pointer;
  height: 4px;
}
#vol-pct {
  font-size: 11px;
  color: var(--muted-foreground);
  min-width: 32px;
  text-align: right;
}
#sync-file-btn {
  height: 24.2px;
  font-size: 11px;
  border: 1px solid var(--input);
  border-radius: var(--radius);
  background: var(--background);
  cursor: pointer;
  color: var(--foreground);
  white-space: nowrap;
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
#sync-file-btn:hover {
  background: var(--border);
}
#sync-file-btn:active {
  filter: brightness(0.85);
  transform: translateY(1px);
}
#sync-file-hk {
  display: none;
}
#sync-file-btn .hk-key {
  font-size: 10px;
}
</style>