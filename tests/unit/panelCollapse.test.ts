// @vitest-environment happy-dom
// Pins the usePanelCollapse composable (monolith "Left panel collapse" port):
// lbl_panel_collapsed persistence, applyPanelCollapse semantics, and the
// portrait auto-collapse. Module state initializes from localStorage at
// import, so each test re-imports fresh.
import { beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  localStorage.clear()
  vi.resetModules()
})

async function loadCollapse() {
  const mod = await import('@/composables/usePanelCollapse')
  return mod.usePanelCollapse()
}

describe('usePanelCollapse init', () => {
  it('defaults to expanded when storage is empty', async () => {
    const { panelCollapsed } = await loadCollapse()
    expect(panelCollapsed.value).toBe(false)
  })

  it('picks up a stored collapsed state ("1")', async () => {
    localStorage.setItem('lbl_panel_collapsed', '1')
    const { panelCollapsed } = await loadCollapse()
    expect(panelCollapsed.value).toBe(true)
  })
})

describe('applyPanelCollapse', () => {
  it('persists the flag on every apply (monolith behavior)', async () => {
    const { panelCollapsed, applyPanelCollapse } = await loadCollapse()
    panelCollapsed.value = true
    applyPanelCollapse(false)
    expect(localStorage.getItem('lbl_panel_collapsed')).toBe('1')
    panelCollapsed.value = false
    applyPanelCollapse(false)
    expect(localStorage.getItem('lbl_panel_collapsed')).toBe('0')
  })

  it('transferFocus focuses the expand button when collapsed, the collapse button when expanded', async () => {
    const { panelCollapsed, applyPanelCollapse, setExpandRef, setCollapseRef } = await loadCollapse()
    const expand = document.createElement('button')
    const collapse = document.createElement('button')
    document.body.append(expand, collapse)
    setExpandRef(expand)
    setCollapseRef(collapse)
    const expandFocus = vi.spyOn(expand, 'focus')
    const collapseFocus = vi.spyOn(collapse, 'focus')

    panelCollapsed.value = true
    applyPanelCollapse(true)
    expect(expandFocus).toHaveBeenCalled()

    panelCollapsed.value = false
    applyPanelCollapse(true)
    expect(collapseFocus).toHaveBeenCalled()

    // no focus transfer without the flag (click path passes false)
    panelCollapsed.value = true
    applyPanelCollapse(false)
    expect(expandFocus).toHaveBeenCalledTimes(1)
  })
})

describe('autoCollapseIfNeeded', () => {
  it('collapses and persists on a portrait-width window (<640px)', async () => {
    const { panelCollapsed, autoCollapseIfNeeded } = await loadCollapse()
    Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true })
    autoCollapseIfNeeded()
    expect(panelCollapsed.value).toBe(true)
    expect(localStorage.getItem('lbl_panel_collapsed')).toBe('1')
  })

  it('leaves an expanded panel alone on a wide window', async () => {
    const { panelCollapsed, autoCollapseIfNeeded } = await loadCollapse()
    Object.defineProperty(window, 'innerWidth', { value: 1000, configurable: true })
    autoCollapseIfNeeded()
    expect(panelCollapsed.value).toBe(false)
    expect(localStorage.getItem('lbl_panel_collapsed')).toBeNull()
  })

  it('never re-expands on resize (only auto-collapses)', async () => {
    localStorage.setItem('lbl_panel_collapsed', '1')
    const { panelCollapsed, autoCollapseIfNeeded } = await loadCollapse()
    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true })
    autoCollapseIfNeeded()
    expect(panelCollapsed.value).toBe(true)
  })
})
