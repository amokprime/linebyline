
## Fedora 44

### Headless — SSH + Syncthing workflow (primary)

The primary test workflow offloads Playwright to a second machine (the Server)
via SSH + Syncthing. Not running tests on a PC in active use reduces test
flakiness, and a bash script is easier for agents to use to automatically test
after building. See [SSH_SETUP.md](SSH_SETUP.md) for the full three-script
architecture: `tst` (Server, podman runner) / `tst-locked` (Server,
restricted-key allowlist wrapper) / `agent-tst` (Client, restricted SSH profile).

1. Pull the official Microsoft Playwright Podman image on the Server:
```sh
podman pull mcr.microsoft.com/playwright:v1.61.0-noble
```

2. The Server's `~/.local/bin/tst` bash script runs Playwright inside Podman.
   The repo template below is the source of truth — the Server copy lives
   outside the synced repo (per SSH_SETUP.md §"Deliberately NOT in a synced
   folder") so it must be updated manually when the template changes.
```bash
#!/usr/bin/env bash
# ~/.local/bin/tst — Server-side script. Invoke via SSH from the client,
# or run directly when sitting at the Server.
#
# Usage: tst [playwright args...]
#   e.g. tst --list
#        tst tests/foo.spec.js
#        tst -g "login"
#
# Env:
#   TST_IMAGE     podman image (default: mcr.microsoft.com/playwright:v1.61.0-noble)
#   TST_HOST_WS   server-side path to the working tree (default: /home/user/GitHub/linebyline)
#   LBL_VITE_TARGET  set to 1 to target Vite preview instead of monolith serve
set -euo pipefail
image=${TST_IMAGE:-mcr.microsoft.com/playwright:v1.61.0-noble}
host_workspace=${TST_HOST_WS:-/home/user/GitHub/linebyline}
if [ ! -f "$host_workspace/playwright.config.js" ]; then
  echo "tst: $host_workspace/playwright.config.js not found" >&2
  exit 1
fi
podman pull -q "$image" >/dev/null 2>&1 || true
env_args=(-e PW_CONTAINER=1)
if [ "${LBL_VITE_TARGET:-}" = "1" ]; then
  env_args+=(-e LBL_VITE_TARGET=1)
fi
exec podman run --rm \
  --userns=keep-id --security-opt label=disable \
  -v "$host_workspace:/workspace" -w /workspace \
  -e HOME=/tmp \
  -e NPM_CONFIG_UPDATE_NOTIFIER=false \
  "${env_args[@]}" \
  "$image" npx playwright test "$@"
```

3. On the Client PC, install the `tst` fish function (always targets Vite,
   filtered streaming output):
```fish
function tst --description 'Run Playwright tests against the Vite build on the Server (filtered streaming output)'
    ssh Server "LBL_VITE_TARGET=1 tst $argv" 2>&1 | \
        grep -E "^\s+[0-9]+\) \[|Error:|Expected:|Received:|at /workspace/tests/|passed|failed|skipped"
    notify-send "Tests done."
end
funcsave tst
# Usage: tst, tst tests/fields-merge.spec.js, tst -g "title", tst -- --update-snapshots
```

The grep filter shows only numbered errors, Error/Expected/Received lines,
test file locations, and the final passed/failed/skipped summary — cutting
the hundreds of `[N/540]` progress lines that would otherwise flood the
terminal. Output streams live (no log file buffering).

4. After `dpl` deploys + builds on the PC, wait for Syncthing to sync `dist/`
   to the Server, then run `tst` from the Client PC. The simplest sync check
   is a `stat` mtime comparison:
```sh
# On the PC — compare the Server's dist/index.html mtime to local:
ssh Server 'stat -c "%y" ~/GitHub/linebyline/dist/index.html'
stat -c '%y' dist/index.html
```

### UI mode + Codegen (run on the Client PC)

⚠️ Webkit is disabled for host in `playwright.config.js` because it's unstable
on Linux. Use `tst` (Server, container) for full 3-browser verification including
webkit.

1. One-time setup on the Client PC:
```sh
npm install
npx playwright install chromium firefox
npx playwright install-deps
```

2. `tsta` — Playwright UI mode against the Vite build. Starts `vite preview`
   on demand (port 5173) and shuts it down on exit:
```fish
function tsta --description 'Playwright UI mode against the Vite build'
    if not test -f playwright.config.js
        echo "tsta: not in a Playwright repo (no playwright.config.js in $PWD)"
        echo "tsta: cd into your repo first, e.g. cd ~/GitHub/linebyline"
        return 1
    end
    # vite preview requires dist/ — build if missing
    if not test -d dist
        echo "tsta: building dist/ first…"
        npm run build
    end
    set -l need_cleanup false
    if not curl -s -o /dev/null -w '' http://localhost:5173/linebyline/ 2>/dev/null
        echo "tsta: starting Vite preview on :5173 …"
        npx vite preview --port 5173 --strictPort >/dev/null 2>&1 &
        set need_cleanup true
        for i in (seq 1 20)
            if curl -s -o /dev/null -w '' http://localhost:5173/linebyline/ 2>/dev/null
                break
            end
            sleep 0.25
        end
    end
    env LBL_VITE_TARGET=1 npx playwright test --ui $argv
    if test "$need_cleanup" = true
        fuser -k 5173/tcp 2>/dev/null; or true
    end
end
funcsave tsta
# Usage: tsta, tsta --project chromium, tsta -g "title"
```

3. `cgn` — Playwright Codegen against the Vite build. Starts `vite preview`
   on demand (port 5173) and shuts it down on exit:
```fish
function cgn --description 'Playwright Codegen against the Vite build'
    cd ~/GitHub/linebyline
    if not test -d dist
        echo "cgn: building dist/ first…"
        npm run build
    end
    set -l need_cleanup false
    if not curl -s -o /dev/null -w '' http://localhost:5173/linebyline/ 2>/dev/null
        echo "cgn: starting Vite preview on :5173 …"
        npx vite preview --port 5173 --strictPort >/dev/null 2>&1 &
        set need_cleanup true
        for i in (seq 1 20)
            if curl -s -o /dev/null -w '' http://localhost:5173/linebyline/ 2>/dev/null
                break
            end
            sleep 0.25
        end
    end
    npx playwright codegen "http://localhost:5173/linebyline/" $argv
    if test "$need_cleanup" = true
        fuser -k 5173/tcp 2>/dev/null; or true
    end
end
funcsave cgn
# Usage: cgn, cgn --browser firefox
```

`vite preview` serves at `/linebyline/` (the `base` config for GitHub Pages
project URLs). Both `tsta` and `cgn` build `dist/` automatically if missing,
and set `LBL_VITE_TARGET=1` (or rely on the config's `reuseExistingServer`) so
`playwright.config.js` expects Vite preview on :5173.

### `srv` — manual testing server (MANUAL.md)

For real-browser manual testing (the `tests/MANUAL.md` checklist — audio
playback, OS file picker, undo debounce timing, etc. — things Playwright
can't automate). Starts `vite preview` in the foreground; Ctrl+C stops it.

```fish
function srv --description 'Start Vite preview server for manual testing (MANUAL.md)'
    cd ~/GitHub/linebyline
    if not test -d dist
        echo "srv: building dist/ first…"
        npm run build
    end
    if curl -s -o /dev/null -w '' http://localhost:5173/linebyline/ 2>/dev/null
        echo "srv: Vite preview already running on http://localhost:5173/linebyline/"
        echo "srv: Open that URL in your browser for MANUAL.md testing."
        return 0
    end
    echo "srv: starting Vite preview on http://localhost:5173/linebyline/"
    echo "srv: Press Ctrl+C to stop the server."
    npx vite preview --port 5173 --strictPort
end
funcsave srv
# Usage: srv, then open http://localhost:5173/linebyline/ in a real browser
```

Unlike `tsta`/`cgn` (which manage the server lifecycle automatically), `srv`
runs in the foreground — the server stays up until you press Ctrl+C, so you
can test across multiple browser tabs / reloads / manual interactions.

---

## Vite-target mode (Phase E Tranche 2)

During Phase E (pre-cutover), the Playwright toolchain targets the Vite build
(`dist/` via `npx vite preview --port 5173`). The `LBL_VITE_TARGET=1` env var
selects this mode in both `tests/helpers/index.js` (`getAppUrl()`) and
`playwright.config.js` (`webServer.command` + `use.baseURL`). The client `tst`
function always sets this env var; `tsta` and `cgn` set it or rely on the
config's `reuseExistingServer`.

After Tranche 6 (monolith deletion), the env-var branch goes away and Vite
preview is the only mode.

### Notes

- **`--strictPort`**: `playwright.config.js` uses `vite preview --port 5173
  --strictPort` so Vite fails fast if 5173 is taken (instead of silently
  picking another port, which would break `baseURL`).
- **Font-fragile screenshots**: the Vite build uses the same `system-ui,
  sans-serif` stack as the monolith, so font metrics don't shift. Most
  font-fragile tests already have the `!CI && !PW_CONTAINER` skip guard.
- **Snapshot baselines**: expect `.aria.yml` snapshot regen on first
  Vite-target run (different DOM structure, same ARIA semantics). The monolith
  baselines stay in place — Vite-target snapshots go in the same
  `-snapshots/` directories (Playwright overwrites them). Commit the
  regenerated baselines after the Tranche 3 checkpoint passes.
