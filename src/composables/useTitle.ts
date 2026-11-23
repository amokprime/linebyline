// Phase D Tranche 2 — title extraction, ported from the monolith's
// `updateTitleFromText()`. Pure parsing of [ti:] and [ar:] tags from the
// textarea content into reactive refs that LeftPanel's #song-title /
// #song-artist bind to.
//
// PORT DELTAS from the monolith:
//  - The monolith imperatively sets `document.getElementById('song-title').textContent`
//    and `#song-artist`. Here, `songTitle` and `songArtist` are reactive refs;
//    LeftPanel's template binds `{{ songTitle }}` / `{{ songArtist }}` reactively.
//  - The monolith reads `getTA()` (the textarea value). Here, the text is
//    passed as a parameter — `updateTitleFromText(text)`. App.vue calls it
//    with `mainText.value` from useAppState. This keeps useTitle pure-testable.
//  - `setSongTitle(s)` is new — useAudio.setupAudio calls it to set the title
//    from the audio filename stem (before updateTitleFromText potentially
//    overwrites it with a [ti:] tag). The monolith did this imperatively
//    via `document.getElementById('song-title').textContent = stem`.
//
// Singleton pattern (matches useAppState / useModeSwitch): module-level refs
// shared across the app. vi.resetModules() in tests gives a fresh module.

import { ref } from 'vue'

const songTitle = ref('Unknown Title')
const songArtist = ref('Unknown Artist')

// Port of the monolith updateTitleFromText(). Parses [ti:] and [ar:] tags
// from the text; updates songTitle/songArtist refs. "Unknown" or blank tags
// fall back to "Unknown Title" / "Unknown Artist" (monolith parity).
export function updateTitleFromText(text: string) {
  // [^\]]+ (any non-] char) replaces `.+` to avoid super-linear backtracking
  // (S8786); `.exec` replaces `.match` since the regex is non-global (S6594).
  const tiMatch = /^\[ti:\s*([^\]]+)\]/m.exec(text)
  const ti = tiMatch?.[1]
  const arMatch = /^\[ar:\s*([^\]]+)\]/m.exec(text)
  const ar = arMatch?.[1]

  // Optional chaining replaces `ti && ti.trim()` (S6582).
  const tiTrimmed = ti?.trim()
  songTitle.value = tiTrimmed && tiTrimmed !== 'Unknown' ? tiTrimmed : 'Unknown Title'
  const arTrimmed = ar?.trim()
  songArtist.value = arTrimmed && arTrimmed !== 'Unknown' ? arTrimmed : 'Unknown Artist'
}

// Set the song title directly (from audio filename stem). Used by useAudio.setupAudio
// as a fallback before updateTitleFromText potentially overwrites with [ti:] tag.
export function setSongTitle(s: string) {
  songTitle.value = s
}

export function useTitle() {
  return { songTitle, songArtist, updateTitleFromText, setSongTitle }
}