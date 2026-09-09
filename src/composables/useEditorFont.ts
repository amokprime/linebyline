// Editor font/size — ported from the monolith "Font settings" section.
// Behaviors verbatim, including quirks: default size 14 in JS (the 13.2px CSS
// token is only the pre-JS fallback), the size-input path applies `|| 14`
// BEFORE clamping (so "0" and "" become 14), while the tick buttons clamp only
// the side they step toward (a stored out-of-range value can exceed a bound
// until the ticks bring it back). Persisted to lbl_font / lbl_fsize, applied
// as inline CSS vars on <html>. Port delta: the monolith's applyEditorFont()
// also synced the select/input values via getElementById — Vue's refs are the
// inputs' state, so no DOM sync exists here.
import { ref } from 'vue'

export const FONT_DEFAULT = 'system-ui,sans-serif'
export const SIZE_DEFAULT = 14
export const SIZE_MIN = 8
export const SIZE_MAX = 32

const editorFont = ref(localStorage.getItem('lbl_font') || FONT_DEFAULT)
const editorSize = ref(Number.parseFloat(localStorage.getItem('lbl_fsize') || '') || SIZE_DEFAULT)

export function useEditorFont() {
  function applyEditorFont() {
    document.documentElement.style.setProperty('--editor-font', editorFont.value)
    document.documentElement.style.setProperty('--editor-size', editorSize.value + 'px')
  }
  function saveEditorFont() {
    localStorage.setItem('lbl_font', editorFont.value)
    localStorage.setItem('lbl_fsize', String(editorSize.value))
    applyEditorFont()
  }
  function setFont(font: string) {
    editorFont.value = font
    saveEditorFont()
  }
  // change/Enter path — matches the monolith's inline input handler expression
  function setSizeFromInput(parsed: number) {
    editorSize.value = Math.max(SIZE_MIN, Math.min(SIZE_MAX, parsed || SIZE_DEFAULT))
    saveEditorFont()
  }
  function sizeUp() {
    editorSize.value = Math.min(SIZE_MAX, editorSize.value + 1)
    saveEditorFont()
  }
  function sizeDown() {
    editorSize.value = Math.max(SIZE_MIN, editorSize.value - 1)
    saveEditorFont()
  }
  return { editorFont, editorSize, applyEditorFont, saveEditorFont, setFont, setSizeFromInput, sizeUp, sizeDown }
}
