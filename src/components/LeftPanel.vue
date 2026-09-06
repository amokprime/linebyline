<script setup lang="ts">
// Left panel — structure ported from the monolith (#left-panel: header with
// the collapse button, #audio-box, #controls-box). The collapse state lives
// in usePanelCollapse (App owns the expand button; this component registers
// the collapse button's ref for focus transfer).
// Inert until later tranches/Phase D: audio playback, progress, seek offset,
// volume and the hotkey grid have no composables yet — controls render with
// the monolith's initial markup and no handlers.
import { usePanelCollapse } from '../composables/usePanelCollapse'

const { panelCollapsed, applyPanelCollapse, setCollapseRef } = usePanelCollapse()

function collapsePanel() {
  panelCollapsed.value = true
  applyPanelCollapse(false)
}
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
        Unknown Title
      </div>
      <div
        id="song-artist"
        aria-label="Song artist"
      >
        Unknown Artist
      </div>
      <div
        id="progress-wrap"
        role="slider"
        aria-label="Playback position"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow="0"
        aria-valuetext="0:00 of 0:00"
      >
        <div id="progress-fill" />
      </div>
      <div id="time-row">
        <span
          id="time-pos"
          aria-label="Current position"
        >0:00</span>
        <span
          id="time-dur"
          aria-label="Duration"
        >0:00</span>
      </div>
      <div id="media-row">
        <input
          id="speed-val"
          type="number"
          value="1"
          min="0.05"
          max="4"
          step="0.01"
          title="Playback speed"
          aria-label="Playback speed"
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
          >
            ▲
          </button>
          <button
            id="speed-down-btn"
            class="fs-tick"
            title="Reduce speed"
          >
            ▼
          </button>
        </div>
        <button
          id="btn-seek-back"
          class="media-btn"
          title="Seek back 5s (Ctrl+A)"
          aria-label="Seek back"
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
          title="Play/pause (Ctrl+Space)"
          aria-label="Play"
        >
          <svg
            id="media-play-icon"
            aria-hidden="true"
            width="11"
            height="13"
            viewBox="0 0 11 13"
            fill="currentColor"
          ><polygon points="1,0 11,6.5 1,13" /></svg>
          <svg
            id="media-pause-icon"
            aria-hidden="true"
            width="11"
            height="13"
            viewBox="0 0 11 13"
            fill="currentColor"
            style="display: none"
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
          type="number"
          value="0"
          title="Seek offset (ms): shifts playback position when clicking a timestamped line"
          aria-label="Seek offset in milliseconds"
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
          >
            ▲
          </button>
          <button
            id="seek-arr-back"
            class="fs-tick"
            title="Decrease seek offset"
          >
            ▼
          </button>
        </div>
        <button
          id="sync-file-btn"
          title="Sync file"
          aria-label="Sync file"
        >
          Sync file
        </button>
        <span id="sync-file-hk" />
      </div>
      <div id="vol-row">
        <button
          id="vol-mute-btn"
          title="Mute (Ctrl+M)"
          aria-label="Mute"
        >
          <svg
            id="vol-icon"
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
          ><path d="M9 2.5v11l-4-3H2a1 1 0 01-1-1v-3a1 1 0 011-1h3l4-3zM12.07 5.07a5 5 0 010 5.86M13.5 3.5a7.5 7.5 0 010 9" /></svg>
          <svg
            id="mute-icon"
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            style="display: none"
          ><path d="M9 2.5v11l-4-3H2a1 1 0 01-1-1v-3a1 1 0 011-1h3l4-3zM11.5 6l3 4m0-4l-3 4" /></svg>
        </button>
        <input
          id="vol-slider"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value="1"
          aria-label="Volume"
        >
        <span
          id="vol-pct"
          aria-label="Volume percentage"
        >100%</span>
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
      <!-- tranche 4 (ControlsPanel/HotkeyCell) fills the hotkey grid -->
      <fieldset
        id="hk-grid"
        class="hk-grid"
        aria-labelledby="controls-label"
      />
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
</style>
