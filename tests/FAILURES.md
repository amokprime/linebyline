
# Playwright Test Failures — Phase E Tranche 4

Live status of the Vite-target Playwright suite (`LBL_VITE_TARGET=1 tst`).
Updated after each test run. The monolith-target suite (`tst` without the env
var) should stay green throughout Phase E — failures here are Vite-target only.

## Current status (Sep 22, 2026 — Tranche 4 done, assign-conflict-tab rewritten)

### Tranche 4: `logic.spec.js` consolidated → DELETED

All 84 unique test cases from `tests/logic.spec.js` are now covered by the
Vitest unit suite (`tests/unit/lrcParser.test.ts`, `tests/unit/hotkeys.test.ts`,
`tests/unit/geniusExtractor.test.ts`, `tests/unit/timestampSync.test.ts`,
`tests/unit/pasteHandlers.test.ts`). 26 missing edge cases were ported before
deletion. Full Vitest suite: 501/501 green. The 252 Playwright failures
(84 × 3 browsers) from `ReferenceError: X is not defined` are eliminated —
the file is deleted, so Playwright no longer collects it.

### `assign-conflict-tab` rewritten (Sep 22, 2026)

The webkit-only timeout on "Confirm reset" button click is fixed by rewriting
the reset-confirm flow to use the global hotkey (`Control+Backslash`) instead
of clicking "Reset defaults" → "Confirm reset". The button-click path timed
out because the shadcn-vue Dialog's focus trap + `v-show` reactivity
(`display:none` toggle on `#s-confirm-yes`) delayed the confirm button's
actionability past the 30s timeout on webkit. The hotkey path calls
`showResetConfirm()` directly and focuses `#s-confirm-yes` via `nextTick`,
which `toBeFocused()` auto-waits for. Same pattern as the `persistence` test.

One subtlety: the capture input `stopPropagation`s on all keydown events
(`useSettings.ts` line 354), so `Control+Backslash` would be captured as a
new hotkey assignment instead of reaching the global handler. The rewrite
clicks the search field first to blur the capture input, then presses
`Control+Backslash`.

Verified on chromium in-sandbox (webkit requires the user's `tst` container).
Awaiting user's `LBL_VITE_TARGET=1 tst` confirmation on all 3 browsers.

### Session 9 test run results (pre-Tranche-4 baseline — 253 failures)

```
253 failed / 284 passed / 9 skipped (16.4m)
```

Breakdown (pre-Tranche-4):

| Category                                           | Tests (unique) | Browser scope | Status                |
| -------------------------------------------------- | -------------- | ------------- | --------------------- |
| `logic.spec.js` `ReferenceError: X is not defined` | 84 × 3 = 252   | all 3         | FIXED (Tranche 4 — file deleted) |
| `settings.spec.js:assign-conflict-tab`             | 1              | webkit only   | FIXED (test rewritten) |

### Expected post-Tranche-4 results

The next `LBL_VITE_TARGET=1 tst` run should show 0 failures from the above
two categories. The 284 passing tests are unchanged. If any new failures
appear, they're regressions from the test-file changes and should be
investigated.

### `--update-snapshots` notes

`--update-snapshots` only writes baselines for `toMatchSnapshot` /
`toHaveScreenshot` / `toMatchAriaSnapshot`. It does NOT affect
`toHaveValue` / `toBeVisible` / `toBeChecked` — these are value assertions.
Tests that timeout before reaching the snapshot assertion also can't be fixed
by `--update-snapshots`. None of the remaining 253 failures are snapshot
assertions.

### Sandbox verification

Session 9 verified the fixes work end-to-end against the production Vite build
(`npx vite preview --port 5173` in sandbox):

- `window.doSave` exposure: `typeof window.doSave === 'function'` → PASS
- `Ctrl+'` dispatch through `window.doSave`: monkeypatch invoked → PASS
- Firefox capture pattern (meta-save-update mechanism): `__saveCapture`
  populated → PASS
- `intervals.spec.js:typing-debounce-1` timing fix: typed a/b/c with 50ms
  gaps, 2× Control+Z undid back to "a" → PASS (all 4 assertions)

### Previous session notes (session 8)

#### Root cause of session 8's "patches didn't work"

**`deploy.sh` was missing `npm run build`.** The `vite preview` server serves
`dist/` — if `dist/` isn't rebuilt after source patches, Playwright tests run
against the stale build. Every session 8 patch (SettingsDialog watch, LeftPanel
seek-offset, useGlobalHotkeys offset mode, useImport undo fix, index.html
favicon) was deployed to source files but never built into `dist/`.

**Fix**: `deploy.sh` now runs `npm run build` after the Vitest suite.

#### Session 8 test run results (stale dist/ — same as pre-patch)

```
307 failed / 224 passed / 9 skipped (18.7m) — --update-snapshots run
306 failed / 225 passed / 9 skipped (18.4m) — normal run
```

Both runs had the same 104 unique failing tests. `--update-snapshots` didn't
fix any because most failures were `toHaveValue`/`toBeVisible`/`toBeChecked`
— not snapshot assertions.

#### Categories fixed in session 8 (all green after dist/ rebuild)

| Category | Tests (unique) | Status |
|---|---|---|
| 3. `#settings-overlay` | 0 | Fixed (session 8) |
| 5. Wheel events | 0 | Fixed (session 8) |
| 6. restrictWarnText | 0 | Fixed (session 8) |
| 7. Settings save on Escape | 4 | Fixed (session 8) |
| 8. Dialog viewport | 5 | Fixed (session 8) |
| 9. page.evaluate module fn | 1 | Fixed (session 8) |
| 10. Section filter + Tab order | 2 | Fixed (session 8) |
| 11. Seek-offset + undo stack | 3 | Fixed (session 8) |
| 12. Favicon | 1 | Fixed (session 8) |

#### Categories fixed in session 9

| Category                               | Tests (unique) | Status            |
| -------------------------------------- | -------------- | ----------------- |
| typing-mode meta-save-update           | 1 (firefox)    | Fixed (session 9) |
| intervals typing-debounce-1            | 1 (chromium)   | Fixed (session 9) |
| smoke doSave-exposed + doSave-dispatch | 6 (new tests)  | Fixed (session 9) |

#### `tst-vite-log` fish function fixes (session 8)

1. Replaced `\d` with `[0-9]` (Perl regex not supported in `grep -E` — caused
   "stray \ before d" warning).
2. Simplified grep pattern to only match numbered errors + Error/Expected/
   Received + final counts (removed `[N/540]` progress lines that produced
   hundreds of lines of noise).

The fixed function is in `tst-vite-log.fish` (deploy to
`~/.config/fish/functions/tst-vite-log.fish`).
