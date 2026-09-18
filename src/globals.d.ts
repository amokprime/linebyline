// Global type augmentations for app-level window properties.
//
// The monolith (docs/index.html) exposed doSave implicitly as a top-level
// function declaration (which becomes a window property). The Vue port imports
// doSave from useImport, but App.vue also registers it on window so the
// global hotkey handler can dispatch through the runtime-resolved reference
// (allowing Playwright tests to monkeypatch window.doSave on Firefox, which
// blocks the download event that chromium/webkit use).
//
// `export {}` + `declare global` is required because @vue/tsconfig sets
// `moduleDetection: "force"` — without it, `interface Window` would be
// module-scoped and wouldn't merge with the global Window type.

export {}

declare global {
  interface Window {
    /** App global — set by App.vue onMounted, dispatch target for the save hotkey. */
    doSave: () => void
  }
}
