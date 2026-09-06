// Left-panel collapse — ported from the monolith "Left panel collapse"
// section. Behaviors verbatim: lbl_panel_collapsed persistence ('1'/'0'),
// auto-collapse when the panel would take over half a portrait window
// (<640px), focus transfer to the expand/collapse button when triggered from
// the keyboard (transferFocus). Port delta: the monolith toggles classes and
// .inert via getElementById; here the state is reactive and the components
// bind it — only the focus transfer touches elements, through the template
// refs the panel and the expand button register below.
import { ref } from 'vue'

const panelCollapsed = ref(localStorage.getItem('lbl_panel_collapsed') === '1')
const expandBtn = ref<HTMLElement | null>(null)
const collapseBtn = ref<HTMLElement | null>(null)

export function usePanelCollapse() {
  function applyPanelCollapse(transferFocus = false) {
    localStorage.setItem('lbl_panel_collapsed', panelCollapsed.value ? '1' : '0')
    if (transferFocus) {
      if (panelCollapsed.value) expandBtn.value?.focus()
      else collapseBtn.value?.focus()
    }
  }
  function autoCollapseIfNeeded() {
    // Auto-collapse if panel takes >50% of window width (portrait phone)
    if (!panelCollapsed.value && window.innerWidth < 640) {
      panelCollapsed.value = true
      applyPanelCollapse()
    }
  }
  function setExpandRef(el: unknown) {
    expandBtn.value = (el as HTMLElement) ?? null
  }
  function setCollapseRef(el: unknown) {
    collapseBtn.value = (el as HTMLElement) ?? null
  }
  return { panelCollapsed, applyPanelCollapse, autoCollapseIfNeeded, setExpandRef, setCollapseRef }
}
