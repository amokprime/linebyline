---
model: DeepSeek V4 Flash 0731
provider: Logfare
harness: OMP
---
# SSH Setup — human master key + restricted agent key

Two SSH keys, deliberately separate:

- **Master key** — full shell access to the remote. Used by the human interactively.
- **Restricted agent key** — forced into a single wrapper command by the remote's
  `authorized_keys`, so an automated agent (or anything that compromises it)
  **cannot** run arbitrary commands on the remote. It can only run the allowed
  wrapper, which validates every argument.

> Why two keys? A `command=` restriction in `authorized_keys` is enforced by the
> remote's `sshd` itself — it cannot be bypassed by prompt injection, a zero-day,
> or reading the key, because the remote *kernel* refuses to exec anything else
> for that key. A local sandbox (`bwrap`, etc.) cannot do this: it has no authority
> over the remote machine, and `--ro-bind`/`--tmpfs` block *reads/writes* but not
> *use* of a key the process can read. So the restriction must live on the remote.

## Concepts

- `authorized_keys` line with `command="..."` runs that command **with the client's
  original command available via `$SSH_ORIGINAL_COMMAND`** (the appended-`$@` path is
  not reliable across OpenSSH versions; read the env var). The restricted command
  receives the raw client string in `$SSH_ORIGINAL_COMMAND` and must validate it.
- Always add `no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty` to
  cap the damage surface — the restricted key should not be able to tunnel, forward
  the agent, or request a PTY.

## 1. Human master key (one-time)

1. Generate (passphrase-protected is fine for interactive use):
   ```sh
   ssh-keygen -t ed25519 -C "myhost" -f ~/.ssh/id_ed25519_myhost
   ```
2. Push to the remote:
   ```sh
   ssh-copy-id -i ~/.ssh/id_ed25519_myhost.pub user@remote
   ```
3. Add a `Host` block to `~/.ssh/config`:
   ```
   Host remote
       HostName 192.168.1.10
       User user
       IdentityFile ~/.ssh/id_ed25519_myhost
       IdentitiesOnly yes
   ```
4. Test: `ssh remote 'hostname'` → prints the remote hostname.
5. For complex troubleshooting on the server, install OMP on it for proper
   [sandboxing](https://github.com/amokprime/linebyline/tree/main/ai/omp/OMP_SETUP.md#Sandbox),
   and talk to the server OMP agent over SSH (i.e. `ssh remote` to initiate a
   persistent terminal → `cd ~/projectpath` → `omp`).

## 2. Restricted agent key (one-time)

Use a **separate** key, empty passphrase (an agent is unattended; lock it with
`command=`, not a passphrase), with a `command=` line that points at a **whitelist
wrapper** on the remote. Use this to let an agent run specific commands (like
pre-commit Playwright tests) on the server and nothing else. It is not flexible
enough to cover every conceivable troubleshooting command.

### 2a. Build the remote wrapper

On the remote, create a wrapper that validates the client's raw command. It reads
`$SSH_ORIGINAL_COMMAND`, splits it, accepts only an allowlist, and rejects the
rest. Example (adjust the allowed set to your exact need):

```bash
#!/usr/bin/env bash
# whitelisted command runner for an SSH `command=` restricted key.
set -euo pipefail
raw=${SSH_ORIGINAL_COMMAND:-}
# shellcheck disable=SC2206
args=($raw)
declare -a clean=()
skip=0
for i in "${!args[@]}"; do
  [ "$skip" -gt 0 ] && { skip=$((skip-1)); continue; }
  a=${args[$i]}
  case "$a" in
    --list|-h|--help)            clean+=("$a") ;;
    -g)
      val=${args[$((i+1))]:-}
      [ -z "$val" ] && { echo "invalid pattern" >&2; exit 1; }
      printf '%s' "$val" | grep -Eq '^[A-Za-z0-9_/ .-]*$' || { echo "bad pattern" >&2; exit 1; }
      clean+=("$a" "$val"); skip=1 ;;
    -g?*|--grep=*)
      val=${a#-g}; val=${val#--grep=}
      printf '%s' "$val" | grep -Eq '^[A-Za-z0-9_/ .-]*$' || { echo "bad pattern" >&2; exit 1; }
      clean+=("$a") ;;
    path/to/spec/*.spec.js)      clean+=("$a") ;;   # tighten to your layout
    --project=a|--project=b|--project=c) clean+=("$a") ;;
    *) echo "rejected: $a" >&2; exit 1 ;;
  esac
done
# 'exec' the real command with the validated, sanitized args
exec /path/to/real-command "${clean[@]:-}"
```

Make it executable. Keep it on the remote's own filesystem (not in a synced/
network location the client could modify) — it is the policy anchor.

### 2b. Generate the restricted key on the client

```sh
ssh-keygen -t ed25519 -N '' -C "agent-myhost" -f ~/.ssh/id_ed25519_agent_myhost
```

### 2c. Install on the remote

Append a single line to the remote's `~/.ssh/authorized_keys`:

```
command="/path/to/remote-wrapper",no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty ssh-ed25519 AAAA... agent-myhost
```

**The whole entry must be one line** — the `command="..."` options must sit on the
same line as the key. A line break between them yields an options-only line (ignored)
and a bare key line (no restriction), silently defeating the lock.

### 2d. Client config for the restricted key

Give it its own `Host` entry or its own config file so the agent never offers the
master key. The cleanest is a **portable identity folder**:

```
~/.agent-tools/limited-entry/
    config                      # ssh config for this profile
    id_ed25519_agent_myhost     # private key (mode 600)
    id_ed25519_agent_myhost.pub
    known_hosts                 # only the remote's host key
```

`config`:
```
Host remote
    HostName 192.168.1.10
    User user
    IdentitiesOnly yes
    IdentityFile /home/user/.agent-tools/limited-entry/id_ed25519_agent_myhost
    UserKnownHostsFile /home/user/.agent-tools/limited-entry/known_hosts
```

Populate `known_hosts`: `ssh-keyscan -H <remote-ip> >> .../known_hosts`.

Invoke with `-F` so system ssh_config.d files are skipped (some sandboxes have
broken/`nobody: nobody` system ssh config files that abort ssh with a
`Bad owner or permissions` error; `-F` bypasses them):
```sh
ssh -F ~/.agent-tools/limited-entry/config remote -- <args>
```

## 3. Sandbox (bwrap) note

If the agent runs inside `bwrap`:

- Mount the **identity folder read-only** at the standard `~/.ssh` location so
  ssh finds `config` + key + `known_hosts`, but the agent cannot write/modify them:
  ```
  --ro-bind "$HOME/.agent-tools/limited-entry" "$HOME/.ssh"
  ```
- **Remove any `--tmpfs "$HOME/.ssh"` line** — a tmpfs mounted on top shadows the
  `--ro-bind`, leaving `~/.ssh` empty.
- Do **not** bind the master key or its `known_hosts`/`config` into the sandbox at
  all. With only the restricted profile present, `ssh` offers only the restricted
  key, so the master key is unreachable even if the agent is fully compromised.
- The agent should always get the restricted profile via `ssh -F ...` in a wrapper,
  not by expecting a bare `ssh remote` to "just use the right key" — the wrapper
  pins the config and adds `BatchMode=yes`.

## 4. Verification checklist

After setup, prove both properties before trusting it:

1. **Restricted key can run its allowed command:**
   `ssh -F <profile>/config remote -g "pattern"` → runs the whitelisted wrapper with
   the pattern, passes sanitized args to the real command.
2. **Restricted key cannot run arbitrary commands:**
   `ssh -F <profile>/config remote 'rm -rf /'` → wrapper rejects (`rejected: rm`, exit 1),
   nothing executes remotely.
3. **Injection fails:**
   `ssh -F <profile>/config remote '-g "title; whoami"'` → wrapper rejects the bad
   pattern; no shell metacharacters pass the allowlist.
4. **Master key is not usable from the sandbox:** with only the restricted
   `~/.ssh` present, `ssh remote ...` offers no master key and the interactive shell
   path is closed.

## Troubleshooting

- **`Bad owner or permissions on /etc/ssh/ssh_config.d/...`** — the system
  `/etc/ssh/ssh_config.d` files are seen as mis-owned inside the sandbox. Use
  `ssh -F <profile>/config` to skip them. Verify the real host's files are
  root-owned (they usually are; only the sandbox's view is wrong).
- **`ssh` "Could not resolve hostname server"** — the `-F` config dropped the alias
  mapping. Make sure the `Host` block you pass with `-F` is the one with
  `HostName <ip>`.
- **Restricted key runs the full/wrong thing** — check whether `$SSH_ORIGINAL_COMMAND`
  is empty. If the client's args aren't reaching the wrapper, `-F` config or the
  `command=` line may be swallowing them. Log `$SSH_ORIGINAL_COMMAND` in the wrapper
  temporarily to confirm.
- **`command=` line split across lines** in `authorized_keys` — the options end up
  on a bare line and the key on another; the restriction silently vanishes. Keep it
  on one line.

---

## Concrete deployment: LineByLine / OMP agent (worked example)

This is the real instance of the pattern above. It uses **three scripts across two
hosts** — not one combined script — for reasons that are architectural (different
trust domains), not incidental. Do not try to merge them.

### The three scripts and why they cannot be one file

- **`tst`** — **Server**, `~/.local/bin/tst`. Runs
  `podman run … npx playwright test "$@"`. The *untrusted-input sink*: it is what
  the restricted key ultimately executes.
- **`tst-locked`** — **Server**, `~/.local/bin/tst-locked`. The `command=` target;
  reads `$SSH_ORIGINAL_COMMAND`, allowlists args, then `exec tst`. **Must be a
  distinct file**: `authorized_keys` names exactly one path, and the validator must
  not be the thing it validates (confused-deputy).
- **`agent-tst`** — **Client**, `~/.local/bin/agent-tst`. Runs
  `ssh -F $HOME/.agent-tools/limited-entry/config -o BatchMode=yes Server -- "$@"`.
  Runs on a *different host*, so it cannot share code with the server files.

**Why not one script?** The `command=` in `authorized_keys` is a **path to one
file**; you cannot point it at "a function inside another script". And the
validator (`tst-locked`) must guard the executed command (`tst`) — folding the two
together means the thing being validated also does the validating (a confused-
deputy: the untrusted input could, in principle, influence the very check that
constrains it). The client wrapper (`agent-tst`) is a separate machine entirely.

**Why not a Python script?** Same split — Python doesn't collapse the trust-domain
boundary, and it adds a runtime dependency on the Server. `/bin/bash` is guaranteed
on Fedora.

### Server-side files

- `~/.local/bin/tst` — the podman runner (real file, no symlink).
- `~/.local/bin/tst-locked` — the enforcement wrapper (real file, no symlink).
  **This path is baked into `authorized_keys` and `tst-locked`'s own
  `exec /home/user/.local/bin/tst`; renaming either file breaks the lock.**
- `~/.local/bin/tst-locked` last line: `exec /home/user/.local/bin/tst "${clean[@]:-}"`.

**Deliberately NOT in a synced folder.** These live on the Server's own filesystem,
not in `~/GitHub/linebyline/tests/`. Reasons:
1. The human (master key) is the only one who edits them.
2. A future agent editing the *synced repo* cannot silently alter what the restricted
   key runs — the server files are outside any share the agent can write.
3. `authorized_keys` pins absolute paths; a synced copy that could drift is a
   footgun.

### Client-side files

- `~/.local/bin/agent-tst` — the agent's only entry point. It does NOT need a new
  security bind: the whole home is already `--ro-bind` (read-only) in the bwrap, so
  the agent can read but never modify it.
- `~/.agent-tools/limited-entry/` — the restricted SSH profile (config, key,
  known_hosts). Mounted read-only at `~/.ssh` inside the sandbox via
  `--ro-bind "$HOME/.agent-tools/limited-entry" "$HOME/.ssh"`.
- The human's interactive `tst` is a fish `abbr tst 'ssh Server tst'` using the
  **master key** (full shell, for debugging). The agent instead calls `agent-tst`
  (restricted key, `command=` only). The two are deliberately different commands so
  the master key is never offered by the agent.
- Project [RULES.md](https://github.com/amokprime/linebyline/tree/main/.omp/RULES.md) (replace `~/.bash/safe-omp.md` with your actual `bwrap` script path)

### Restriction path (read top to bottom)

```
agent (sandbox)
  └─ runs agent-tst
       (client ~/.local/bin; restricted profile;
        ssh -F on $PATH)
       └─ ssh -F <profile>/config Server -- <args>
            (IdentitiesOnly → ONLY restricted key)
            └─ sshd matches restricted key in authorized_keys
               └─ runs tst-locked
                    (command=; $SSH_ORIGINAL_COMMAND = args)
                    └─ allowlist validates each arg
                         (reject on anything else)
                         └─ exec tst <clean args>
                            └─ podman run …
                               npx playwright test <args>
```

Every layer narrows:
- `agent-tst` pins the restricted config and `BatchMode`.
- sshd's `command=` allows only one executable.
- `tst-locked` allowlists the exact Playwright arguments.
- `tst` runs in a `--rm` container as unprivileged user.

No single layer is sufficient; the defense is the *chain*.

### Verified behavior

- `agent-tst -g title` → 3 passed (restricted key, scoped).
- `agent-tst 'rm -rf /'` → `tst-locked: rejected: rm`, exit 1.
- `agent-tst '-g "title; whoami"'` → `tst-locked: invalid -g pattern`, exit 1.
- Master key unreachable from sandbox (only restricted profile present in `~/.ssh`).
