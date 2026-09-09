// Phase D Tranche 4 — audio playback, ported from the monolith "── Audio ──"
// section. Owns the Audio element lifecycle, volume/mute, play/pause, seek,
// and speed. Does NOT own: updateActiveLineFromTime (Tranche 5), seekPrevLine
// / seekNextLine / replayActiveLine (Tranche 5 — they navigate activeLine),
// tickSeekOffset / setOffsetMode / doSyncFile (Tranche 5 — seek-offset logic),
// renderMainLines / scrollToPlaying / syncSecScroll / announce (Tranche 5/6/9).
//
// PORT DELTAS from the monolith:
//  - **Reactive DOM sync replaces applyVolume()**. The monolith's applyVolume
//    imperatively sets slider.value, vol-pct.textContent, icon display, and
//    audioEl.volume/muted. In Vue, masterVolume and masterMuted are reactive
//    refs; the template binds :value / {{ }} / :style to them, and a watcher
//    syncs audioEl.volume/muted. applyVolume() is gone — the reactivity system
//    IS applyVolume. The skill's single-source-of-truth rule: masterVolume is
//    derived (masterMuted ? 0 : savedVolume), not stored separately.
//  - **_preMuteVolume is gone**. The monolith keeps a separate _preMuteVolume
//    variable because masterVolume is zeroed on mute. With usePersistedState,
//    savedVolume (useVolume()) IS the pre-mute volume — it's never zeroed by
//    muting, only by the slider. masterMuted is a separate flag (useMuted()).
//    On mute: masterMuted=true, masterVolume=0 (computed), savedVolume unchanged.
//    On unmute: masterMuted=false, masterVolume=savedVolume (computed). No
//    save/restore dance.
//  - **_volWheeling guard is gone**. The monolith's guard prevents the vol-slider
//    input event from firing during a wheel-driven applyVolume call (which sets
//    slider.value). In Vue, :value bindings don't emit input events — only user
//    interaction does. The guard was a workaround for direct DOM manipulation.
//  - **getTA() / _setTA() / setMainText() / doAutosave() / updateTitleFromText()
//    are callbacks**. Tranche 2 (useAutosave/useTitle) and Tranche 5/6
//    (textarea + render + undo) haven't shipped yet. Until they do, the
//    callbacks are no-op stubs. The call sites are preserved so those tranches
//    swap in the real functions without re-touching useAudio.
//  - **rebuildHkPanel() call in updatePlayBtn is gone**. Vue's reactivity
//    re-renders ControlsPanel when `playing` changes (the play/pause cell's
//    dimmed state depends on hotkeyMode, not playing, but the icon swap in
//    LeftPanel is reactive). The monolith called rebuildHkPanel to update the
//    play/pause cell's visual state — in Vue, that's automatic.
//  - **setupAudio's [ti:] tag update** calls getMainText()/setMainText()
//    callbacks instead of getTA()/_setTA(). The [ti:] update logic is verbatim:
//    only overwrite if blank or "unknown".
//  - **Speed validate aligned to [0.1, 4]**. The monolith's runtime clamp
//    (changeSpeed + Init) is [0.1, 4]; usePersistedState's useSpeed was (0, 5].
//    Tranche 4 amends useSpeed's validate to [0.1, 4] so a stored 4.5 or 0.05
//    falls back to 1 at load instead of sneaking through.
//
// Singleton pattern (matches useAppState / useModeSwitch): initAudio(refs, callbacks)
// called once in LeftPanel setup. Action functions (togglePlay, toggleMute,
// changeSpeed, doSeek, setupAudio) are exported and imported by LeftPanel +
// the future Tranche 9 keyboard handler. vi.resetModules() in tests gives a
// fresh module each run.

import { computed, ref, watch, type Ref } from 'vue'
import { useAppState } from './useAppState'
import { useMuted, useSpeed, useVolume } from './usePersistedState'
import { setSongTitle } from './useTitle'
import { tsToMs } from '@/utils/lrcParser'

// ── Module-level singleton state ────────────────────────────────────────────
// The Audio element — null until setupAudio creates it. Module-level so the
// Tranche 9 keyboard handler can access it without prop-drilling.
const audioEl = ref<HTMLAudioElement | null>(null)

// Tracks which line was last played — used by _applySeekForPlay to decide
// whether to apply the seek offset (replay_resume_current) or not. The monolith
// keeps this as `lastPlayingLine`; ported as a ref so Tranche 5's
// updateActiveLineFromTime can read it.
const lastPlayingLine = ref(-1)

// Volume state — single source of truth. savedVolume (useVolume) is the
// pre-mute volume; masterMuted (useMuted) is the mute flag. masterVolume is
// derived: 0 when muted, else savedVolume. The monolith keeps masterVolume
// as a separate variable and zeros it on mute — that's the double-flag bug
// pattern the single-file-html-app skill warns about.
const savedVolume = useVolume()
const masterMuted = useMuted()
const masterVolume = computed(() => (masterMuted.value ? 0 : savedVolume.value))

// Speed — from usePersistedState (Tranche 1). The validate was amended to
// [0.1, 4] to match the monolith's runtime clamp.
const currentSpeed = useSpeed()

// Display refs — updated by onTimeUpdate, read by the template.
const currentTime = ref(0)
const duration = ref(0)
const progressPct = computed(() => (duration.value ? (currentTime.value / duration.value) * 100 : 0))
const timePosText = computed(() => fmtTime(currentTime.value))
const timeDurText = computed(() => fmtTime(duration.value))
const ariaValueNow = computed(() => (duration.value ? Math.round(progressPct.value) : 0))
const ariaValueText = computed(() => `${fmtTime(currentTime.value)} of ${fmtTime(duration.value)}`)

// Speed display — the monolith shows '1' for exactly 1, else toFixed(2).
const speedDisplay = computed(() => (currentSpeed.value === 1 ? '1' : currentSpeed.value.toFixed(2)))

// Mute display — muted when masterMuted OR volume is 0 (monolith parity).
const muted = computed(() => masterMuted.value || masterVolume.value === 0)

// `playing` is re-used from useAppState (already a module-level singleton there).

// ── Refs + callbacks (set by initAudio) ─────────────────────────────────────
export interface AudioRefs {
  progressWrap: Ref<HTMLElement | null>
  seekOffset: Ref<HTMLInputElement | null>
}

export interface AudioCallbacks {
  // Tranche 5/6 — textarea access
  getMainText: () => string
  setMainText: (t: string) => void
  // Tranche 2 — persistence (useAutosave, useTitle)
  updateTitleFromText: () => void
  doAutosave: (pathHint?: string) => void
  // Tranche 5 — sync/timestamp
  updateActiveLineFromTime: (posMs: number) => void
  renderMainLines: () => void
  scrollToPlaying: () => void
  // Tranche 6 — secondary fields
  syncSecScroll: () => void
  // Tranche 5/9 — a11y announcer
  announce: (msg: string) => void
}

let _refs: AudioRefs | null = null
const _callbacks: AudioCallbacks = {
  getMainText: () => '',
  setMainText: () => {},
  updateTitleFromText: () => {},
  doAutosave: () => {},
  updateActiveLineFromTime: () => {},
  renderMainLines: () => {},
  scrollToPlaying: () => {},
  syncSecScroll: () => {},
  announce: () => {},
}

export function initAudio(refs: AudioRefs, callbacks: Partial<AudioCallbacks> = {}) {
  _refs = refs
  Object.assign(_callbacks, callbacks)
}

// Separate callback setter — App.vue calls this to wire Tranche 2/5/6
// callbacks (doAutosave, updateTitleFromText, getMainText, etc.) without
// needing to pass audio refs (which live in LeftPanel). Merges with existing
// callbacks — safe to call multiple times.
export function setAudioCallbacks(callbacks: Partial<AudioCallbacks>) {
  Object.assign(_callbacks, callbacks)
}

// ── Pure helpers ────────────────────────────────────────────────────────────
// Exported for Tranche 5 (updateActiveLineFromTime uses fmtTime for _announce).
export function fmtTime(s: number): string {
  s = Math.floor(s)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function currentMs(): number {
  return audioEl.value ? audioEl.value.currentTime * 1000 : 0
}

// Reads the #seek-offset input — Tranche 5 owns the input's change handler
// and tickSeekOffset, but useAudio reads the current value for _applySeekForPlay.
// Falls back to 0 if the ref isn't populated (pre-mount, tests).
function getSeekOffset(): number {
  return Number.parseInt(_refs?.seekOffset.value?.value || '') || 0
}

// ── Volume ──────────────────────────────────────────────────────────────────
// applyVolume is replaced by reactive bindings + this watcher. The watcher
// syncs the audioEl when masterVolume or masterMuted changes. The DOM
// (slider, pct, icons) is handled by the template's reactive bindings.
watch([masterVolume, masterMuted], () => {
  const el = audioEl.value
  if (!el) return
  try {
    el.volume = masterVolume.value
    el.muted = masterVolume.value === 0
  } catch (e) {
    // audioEl.volume can be read-only in some test contexts — monolith parity
    console.warn('audioEl.volume read-only in this context:', e)
  }
})

export function toggleMute() {
  masterMuted.value = !masterMuted.value
  // No explicit save — useMuted auto-persists to lbl_muted.
  // savedVolume is unchanged (it's the pre-mute volume). masterVolume is
  // computed and flips to 0 (muted) or savedVolume (unmuted) automatically.
}

// Volume slider input handler — quantizes to cfg.vol_increment, unmutes.
export function onVolInput(e: Event) {
  const target = e.target as HTMLInputElement
  const raw = Number.parseFloat(target.value)
  if (Number.isNaN(raw)) return
  const inc = useAppState().cfg.value.vol_increment || 0.1
  savedVolume.value = Math.max(0, Math.min(1, +(Math.round(raw / inc) * inc).toFixed(2)))
  masterMuted.value = false
}

// Volume slider wheel handler — steps by cfg.vol_increment, unmutes.
// The monolith's _volWheeling guard is unnecessary in Vue (:value bindings
// don't emit input events on programmatic changes).
export function onVolWheel(e: WheelEvent) {
  e.preventDefault()
  const delta = e.deltaY < 0 ? 1 : -1
  const inc = useAppState().cfg.value.vol_increment || 0.1
  savedVolume.value = Math.max(0, Math.min(1, +(savedVolume.value + delta * inc).toFixed(2)))
  masterMuted.value = false
}

// ── Play / pause ────────────────────────────────────────────────────────────
// _applySeekForPlay — ported verbatim. Decides whether to apply the seek
// offset when pressing play on a line. Uses cfg.replay_resume_current /
// replay_play_other. Calls getSeekOffset() which reads the #seek-offset input.
function _applySeekForPlay(lineMs: number | null, isCurrentLine: boolean) {
  const el = audioEl.value
  if (!el) return
  const cfg = useAppState().cfg.value
  if (isCurrentLine) {
    if (cfg.replay_resume_current && lineMs !== null) {
      el.currentTime = Math.max(0, (lineMs + getSeekOffset()) / 1000)
    }
  } else if (lineMs !== null) {
    el.currentTime = cfg.replay_play_other ? Math.max(0, (lineMs + getSeekOffset()) / 1000) : lineMs / 1000
  }
}

export function togglePlay() {
  const el = audioEl.value
  if (!el) return
  const { playing, activeLine } = useAppState()
  if (playing.value) {
    el.pause()
    playing.value = false
    return
  }
  const lines = _callbacks.getMainText().split('\n')
  const lineMs = activeLine.value >= 0 ? tsToMs(lines[activeLine.value]!) : null
  const isCurrentLine = activeLine.value === lastPlayingLine.value
  _applySeekForPlay(lineMs, isCurrentLine)
  try {
    el.volume = masterVolume.value
    el.muted = masterVolume.value === 0
  } catch (e) {
    console.warn('audioEl.volume read-only in this context:', e)
  }
  void el.play()
  playing.value = true
  lastPlayingLine.value = activeLine.value
  const cfg = useAppState().cfg.value
  const didOffsetSeek =
    (isCurrentLine && cfg.replay_resume_current && lineMs !== null) ||
    (!isCurrentLine && cfg.replay_play_other && lineMs !== null)
  if (!didOffsetSeek || getSeekOffset() === 0) {
    useAppState().playingLine.value = activeLine.value
  }
  _callbacks.renderMainLines()
}

// ── Seek ────────────────────────────────────────────────────────────────────
export function doSeek(dir: number) {
  const el = audioEl.value
  if (!el) return
  const inc = useAppState().cfg.value.seek_increment_s || 5
  el.currentTime = Math.max(0, Math.min(el.duration || 0, el.currentTime + dir * inc))
  const { playing } = useAppState()
  if (!playing.value) {
    void el.play()
    playing.value = true
  }
}

export function doSeekBack() { doSeek(-1) }
export function doSeekFwd() { doSeek(1) }

// Progress bar drag — mousedown on progressWrap, document mousemove/mouseup.
// Returns a cleanup function that removes the document listeners. LeftPanel
// calls this in onMounted and calls the cleanup in onBeforeUnmount.
export function mountProgressDrag(): () => void {
  const wrap = _refs?.progressWrap.value
  if (!wrap) return () => {}
  let seeking = false

  function getPct(clientX: number): number {
    const r = wrap!.getBoundingClientRect()
    return Math.max(0, Math.min(1, (clientX - r.left) / r.width))
  }

  function seekTo(clientX: number) {
    const pct = getPct(clientX)
    const el = audioEl.value
    // Optional chaining replaces `el && el.duration` (S6582). If `el?.duration`
    // is truthy, `el` is necessarily non-null (else `el?.duration` would be
    // undefined), so the `el.currentTime` write is safe.
    if (el?.duration) el.currentTime = pct * el.duration
  }

  function onDown(e: MouseEvent) {
    if (e.button !== 0) return
    seeking = true
    seekTo(e.clientX)
    e.preventDefault()
  }
  function onMove(e: MouseEvent) {
    if (!seeking) return
    seekTo(e.clientX)
    e.preventDefault()
  }
  function onUp(e: MouseEvent) {
    if (e.button === 0 && seeking) {
      seeking = false
      const el = audioEl.value
      const { playing } = useAppState()
      if (el && !playing.value) {
        void el.play()
        playing.value = true
      }
    }
  }

  wrap.addEventListener('mousedown', onDown)
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
  wrap.style.cursor = 'pointer'

  return () => {
    wrap.removeEventListener('mousedown', onDown)
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
}

// ── Speed ───────────────────────────────────────────────────────────────────
export function changeSpeed(dir: number) {
  if (dir === 0) {
    currentSpeed.value = 1
  } else {
    const ratio = useAppState().cfg.value.speed_ratio || 1.1
    const next =
      dir > 0
        ? Math.min(4, +(currentSpeed.value * ratio).toFixed(4))
        : Math.max(0.1, +(currentSpeed.value / ratio).toFixed(4))
    currentSpeed.value = Math.round(next * 100) / 100
  }
  if (audioEl.value) audioEl.value.playbackRate = currentSpeed.value
  // No explicit localStorage write — useSpeed auto-persists.
}

// Speed input @change handler — parse + clamp + set. Matches the monolith's
// empty-then-Enter revert pattern: if NaN, revert to currentSpeed.
export function onSpeedChange(e: Event) {
  const target = e.target as HTMLInputElement
  const v = Number.parseFloat(target.value)
  if (Number.isNaN(v)) {
    // Revert display — the reactive :value binding handles this
    return
  }
  currentSpeed.value = Math.max(0.1, Math.min(4, v))
  if (audioEl.value) audioEl.value.playbackRate = currentSpeed.value
}

// ── Audio element lifecycle ─────────────────────────────────────────────────
export function setupAudio(file: File, pathHint?: string) {
  if (audioEl.value) {
    audioEl.value.pause()
    audioEl.value.src = ''
  }
  const el = new Audio()
  el.src = URL.createObjectURL(file)
  el.volume = masterVolume.value
  el.muted = masterVolume.value === 0
  el.addEventListener('timeupdate', onTimeUpdate)
  el.addEventListener('ended', () => {
    useAppState().playing.value = false
  })
  el.addEventListener('loadedmetadata', () => {
    duration.value = el.duration || 0
  })
  el.addEventListener('volumechange', () => {
    // Sync mute state if the browser externally changes audio muted
    // (e.g. hardware mute button). The watcher handles the icon.
    if (el.muted !== (masterVolume.value === 0)) {
      // Force re-evaluation — toggle masterMuted if there's a disagreement
      masterMuted.value = el.muted
    }
  })
  audioEl.value = el

  // Reset speed to 1 on new audio (monolith parity)
  currentSpeed.value = 1
  el.playbackRate = 1

  // Update song title from filename — useTitle owns the songTitle ref.
  // updateTitleFromText (called by the callback chain) may overwrite this
  // with a [ti:] tag if the LRC text has one.
  const stem = file.name.replace(/\.[^.]+$/, '') || 'Unknown Title'
  setSongTitle(stem)
  const { lastImportStem } = useAppState()
  lastImportStem.value = stem

  // Only overwrite [ti:] if it's blank or still the unknown placeholder
  const current = _callbacks.getMainText()
  const updated = current.replace(/^\[ti:.*\]/m, (m) => {
    const cur = m.replace(/^\[ti:\s*/, '').replace(/\]$/, '').trim()
    return cur === '' || cur.toLowerCase() === 'unknown' ? `[ti: ${stem}]` : m
  })
  if (updated !== current) {
    _callbacks.setMainText(updated)
    _callbacks.updateTitleFromText()
  }
  _callbacks.doAutosave(pathHint || file.name.replace(/\.[^.]+$/, '').toLowerCase())
}

// ── timeupdate handler ──────────────────────────────────────────────────────
function onTimeUpdate() {
  const el = audioEl.value
  if (!el) return
  currentTime.value = el.currentTime
  // duration is also set by loadedmetadata, but onTimeUpdate re-syncs in case
  // loadedmetadata fired before the listener was attached (edge case).
  if (el.duration && duration.value !== el.duration) {
    duration.value = el.duration
  }
  _callbacks.updateActiveLineFromTime(el.currentTime * 1000)
}

// ── Init — restore display from persisted state ─────────────────────────────
// Called by App.vue onMounted (monolith Init: speed-val, vol-slider step,
// applyVolume). In Vue, the reactive bindings handle the display automatically
// — this function just sets the vol-slider step attribute (which can't be
// reactive via :step because the monolith reads cfg.vol_increment at init only,
// and changing it live isn't a supported feature). If the vol-slider ref
// isn't registered yet, no-op.
export function restoreAudioDisplay() {
  // The vol-slider step is set from cfg.vol_increment — bound reactively
  // in the template via :step. No imperative action needed here unless the
  // template doesn't bind :step (LeftPanel binds it).
  // Kept as an explicit call for monolith Init parity and as a future hook
  // if any imperative audio init is needed.
}

// ── Exported state for the template ─────────────────────────────────────────
export function useAudio() {
  return {
    audioEl,
    lastPlayingLine,
    savedVolume,
    masterVolume,
    masterMuted,
    muted,
    currentSpeed,
    speedDisplay,
    currentTime,
    duration,
    progressPct,
    timePosText,
    timeDurText,
    ariaValueNow,
    ariaValueText,
    playing: useAppState().playing,
    // Actions
    togglePlay,
    toggleMute,
    onVolInput,
    onVolWheel,
    onSpeedChange,
    changeSpeed,
    doSeek,
    doSeekBack,
    doSeekFwd,
    mountProgressDrag,
    setupAudio,
    restoreAudioDisplay,
    setAudioCallbacks,
    // Re-export for Tranche 5/9 consumers
    fmtTime,
    currentMs,
    initAudio,
  }
}