// Test-injected window properties (page.evaluate capture patterns), same
// pattern as src/globals.d.ts: the `export {}` makes this a module so
// `declare global` merges with Window under moduleDetection: "force".
// window.doSave (the app-exposed global) stays declared in src/globals.d.ts.
export {};

declare global {
  interface Window {
    /** smoke.spec.ts — set inside page.evaluate to observe doSave dispatch. */
    __doSaveCalled: boolean;
    /** typing-mode.spec.ts — Firefox save-workaround capture object. */
    __saveCapture: { text: string; filename: string } | null;
  }
}
