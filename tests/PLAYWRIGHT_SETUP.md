## Fedora 44
### Headless
1. Pull the official Microsoft Playwright Podman image
```sh
podman pull mcr.microsoft.com/playwright:v1.61.0-noble
```

2. Run from project root
```sh
# Headless
podman run --rm -it --userns=keep-id \
        -v $PWD:/workspace:z -w /workspace \
        -e HOME=/tmp \
        -e PW_CONTAINER=1 \
        mcr.microsoft.com/playwright:v1.61.0-noble \
        npx playwright test
```

3. Or run with a Fish function:
```sh
# Setup
function tst
    if not test -f playwright.config.js
        echo "tsta: not in a Playwright repo (no playwright.config.js in $PWD)"
        echo "tsta: cd into your repo first, e.g. cd ~/GitHub/linebyline"
        return 1
    end
    # Conditionally propagate LBL_VITE_TARGET into the container (Phase E Tranche 2).
    # The env var selects Vite preview (port 5173) vs monolith serve (port 3004)
    # in playwright.config.js. Without this, Vite-target mode can't reach Playwright.
    set -l env_args -e PW_CONTAINER=1
    if test "$LBL_VITE_TARGET" = "1"
        set -a env_args -e LBL_VITE_TARGET=1
    end
    podman run --rm -it \
                --userns=keep-id \
                --security-opt label=disable \
                -v $PWD:/workspace -w /workspace \
                -v ~/.local/share/podman-npm-cache:/tmp/.npm \
                -e HOME=/tmp \
                -e NPM_CONFIG_CACHE=/tmp/.npm \
                -e NPM_CONFIG_UPDATE_NOTIFIER=false \
                $env_args \
                mcr.microsoft.com/playwright:v1.61.0-noble \
                npx playwright test $argv
end

funcsave tst
# Usage examples: tst, tst tests/fields-merge.spec.js --project firefox
# Vite-target: LBL_VITE_TARGET=1 tst (propagates into Podman via the env_args above)
```

4. Or with a bash script. This can be offloaded to a second machine (i.e. an old laptop) that syncs (i.e. with Syncthing) `tests/` and `node_modules/` (to skip `npm ci`), and started from the main computer over [SSH](https://github.com/amokprime/linebyline/tree/main/tests/SSH_SETUP.md). Not running tests on a PC in active use reduces test flakiness a lot, and a bash script is easier for agents to use to automatically test after building.
```bash
#!/usr/bin/env bash
# ~/.local/bin/tst
set -euo pipefail
image=${TST_IMAGE:-mcr.microsoft.com/playwright:v1.61.0-noble}
host_workspace=${TST_HOST_WS:-/home/user/GitHub/linebyline}
if [ ! -f "$host_workspace/playwright.config.js" ]; then
  echo "tst: $host_workspace/playwright.config.js not found" >&2
  exit 1
fi
podman pull -q "$image" >/dev/null 2>&1 || true
# Conditionally propagate LBL_VITE_TARGET into the container (Phase E Tranche 2).
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

### UI mode

⚠️Webkit is disabled for host in `playwright.config.js` because it's unstable on Linux
1. Install the npm version of Playwright from project root
```sh
npm install
npx playwright install
npx playwright install-deps
```

2. Run from project root
```sh
# Open Playwright Test window
npx playwright test --ui

# Open Codegen
npx serve . -l 3004 #  ← Run this in another terminal tab or window
set -l path (node -e "const{findLatestVersion}=require('@linebyline/test-helpers');process.stdout.write(findLatestVersion())")
npx playwright codegen "http://localhost:3004$path" #default chromium
npx playwright codegen "http://localhost:3004$path" --browser firefox
```

3. Or run with Fish functions:
```sh
function tsta
  cd ~/GitHub/linebyline
  npx playwright test --ui $argv
end
function cgn
    cd ~/GitHub/linebyline
    set -l need_cleanup false
    # Ensure dev server is running on port 3004
    if not ss -tlnq 2>/dev/null | grep -q ':3004 '
        echo "cgn: starting dev server on :3004 …"
        npx serve . -l 3004 >/dev/null 2>&1 &
        set need_cleanup true
        # Wait up to 5s for it to be ready
        for i in (seq 1 20)
            if ss -tlnq 2>/dev/null | grep -q ':3004 '
                break
            end
            sleep 0.25
        end
    end
    npx playwright codegen "http://localhost:3004/docs/index.html" $argv
    # Kill the server we started; leave pre-existing ones alone
    if test "$need_cleanup" = true
        fuser -k 3004/tcp 2>/dev/null; or true
    end
end
funcsave tsta
funcsave cgn
# Usage: tsta, cgn, cgn --browser firefox
```

---

## Vite-target mode (Phase E Tranche 2)

During Phase E (pre-cutover), the Playwright toolchain can target either the
monolith (`docs/index.html` via `npx serve . -l 3004`) or the Vite build
(`dist/` via `npx vite preview --port 5173`). The mode is selected by the
`LBL_VITE_TARGET=1` env var in both `tests/helpers/index.js` (`getAppUrl()`)
and `playwright.config.js` (`webServer.command` + `use.baseURL`).

**No auto-detect**: Vite-target mode is opt-in via env var only. The previous
design auto-detected via `dist/index.html` existence, but that was too
aggressive in the SSH+Syncthing workflow — `dist/` syncs to the server and
persists, so every `tst` run would auto-detect Vite-target, making monolith
tests impossible without `rm -rf dist/` first.

### When to use Vite-target mode

- **Tranche 3 local-test checkpoint** — run the full suite against the Vite
  build before the cutover to catch behavioral gaps.
- **Snapshot regeneration** — the Vue build produces different DOM structure
  (shadcn-vue `Dialog` vs custom overlay, `<button>` vs `<div role=button>`
  in HotkeyCell, etc.). Same ARIA semantics, different element tree. Regenerate
  baselines via `LBL_VITE_TARGET=1 npx playwright test --update-snapshots`,
  then commit the new baselines.
- **After Tranche 6** (monolith deletion) — Vite-target becomes the only mode;
  the env-var branch goes away.

### SSH + Syncthing workflow (the actual `tst` setup)

The `tst` used here is a **server-side bash script** at `~/.local/bin/tst` on the
Server (not a PC fish function). See `tests/SSH_SETUP.md` for the full three-script
architecture: `tst` (Server, podman runner) / `tst-locked` (Server, restricted-key
allowlist wrapper) / `agent-tst` (Client, restricted SSH profile). The human runs
`ssh Server tst` interactively with the master key; the agent runs `agent-tst`
with the restricted key (which routes through `tst-locked`).

The repo's section-4 bash script above is the **template** the Server's `~/.local/bin/tst`
is based on. The Server copy lives outside the synced repo (on the Server's own
filesystem, per SSH_SETUP.md §"Deliberately NOT in a synced folder") so the user
must update it manually when the template changes.

**To enable Vite-target mode, update the Server's `~/.local/bin/tst`** to
propagate `LBL_VITE_TARGET` into Podman (same fix as the repo template above):

```bash
# In ~/.local/bin/tst on the Server — add before the `exec podman run` line:
env_args=(-e PW_CONTAINER=1)
if [ "${LBL_VITE_TARGET:-}" = "1" ]; then
  env_args+=(-e LBL_VITE_TARGET=1)
fi
# Then replace the static env vars in the podman run command with "${env_args[@]}"
```

**Env var propagation through the SSH chain**:

- **Human (master key)**: `ssh Server "LBL_VITE_TARGET=1 tst"` — SSH executes
  the remote command in a shell, so the env-var prefix reaches `tst`, which
  propagates it into Podman. Add a fish abbr:
  ```sh
  abbr --add tst-vite 'ssh Server "LBL_VITE_TARGET=1 tst" && notify-send "Tests done."'
  ```
- **Agent (restricted key)**: `agent-tst` routes through `tst-locked`, which
  allowlists Playwright args but does NOT pass through env-var prefixes. For
  Tranche 3, use the master key interactively (the agent doesn't run Tranche 3 —
  it's a human verification gate). If agent-side Vite-target runs are needed
  later, update `tst-locked` to accept a `--vite` flag and translate it.

**Syncthing sync check** (replace the old `sleep 60` heuristic):

After `npm run build` on the PC, wait for `dist/` to sync to the Server before
running `tst`. The Syncthing REST API gives a precise completion check (see
MEMORY.md → "Delivery script hardening" for the full pattern). Find your folder
ID and API key in the Syncthing GUI (`http://localhost:8384` → Actions → ID /
Settings → GUI → API Key):

```sh
# Trigger a rescan on the Server, then poll until sync completes.
# Run these on the Server (or via ssh Server "...")
curl -X POST -H "X-API-Key: $SYNCTHING_API_KEY" \
  "http://127.0.0.1:8384/rest/db/scan?folder=$LBL_FOLDER_ID"
# Poll until completion == 100%
while true; do
  pct=$(curl -s -H "X-API-Key: $SYNCTHING_API_KEY" \
    "http://127.0.0.1:8384/rest/db/completion?folder=$LBL_FOLDER_ID&device=$SERVER_DEVICE_ID" \
    | jq '.completion')
  [ "$pct" = "100" ] && break
  sleep 2
done
```

For Tranche 3, the simplest human-readable check is the Syncthing GUI itself
(open `http://localhost:8384` and watch the folder status turn to "Up to Date"),
or a quick `stat` with a human-readable format on the Server:

```sh
# On the PC, after `npm run build` — compare the Server's dist/index.html mtime:
ssh Server 'stat -c "%y" ~/GitHub/linebyline/dist/index.html'
# Outputs: 2026-09-16 02:22:05.000000000 +0000 — compare to local `stat -c '%y' dist/index.html`
```

**Tranche 3 commands (full sequence)**:

```sh
# 1. Build on PC
npm run build

# 2. Wait for Syncthing to sync dist/ to the Server (poll or REST API — see above)

# 3. Regenerate baselines inside the container (on the Server)
ssh Server "cd ~/GitHub/linebyline && LBL_VITE_TARGET=1 tst -- --update-snapshots"

# 4. Run the full suite clean
ssh Server "cd ~/GitHub/linebyline && LBL_VITE_TARGET=1 tst"

# 5. The regenerated baselines sync back to the PC via Syncthing — commit them
```

**UI mode + Codegen** (run on the Server host, not inside Podman — these need
a display):

```sh
# SSH into the Server interactively
ssh Server
cd ~/GitHub/linebyline
npm run build  # ensure dist/ exists
env LBL_VITE_TARGET=1 tsta   # UI mode

# Codegen — start vite preview manually, then run codegen against http://localhost:5173/
npx vite preview --port 5173 --strictPort &
npx playwright codegen http://localhost:5173/
```

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


