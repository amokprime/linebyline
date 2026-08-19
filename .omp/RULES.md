# RULES — LineByLine agent

## Running LineByLine tests
- Run server-side tests ONLY via `agent-tst` (e.g. `agent-tst -g pattern`,
  `agent-tst --list`, `agent-tst tests/foo.spec.js`).
- Never use raw `ssh`, `npx playwright`, or `podman` for tests — those need the
  master key, which is human-only and will be rejected.
- `agent-tst -g <pattern>` (scoped) is preferred; a full run takes ~7 min and will
  exceed the synchronous tool timeout, so keep runs scoped unless a full pass is
  genuinely required.
- `agent-tst` accepts only: `-g <pattern>` / `--grep=<pattern>` (letters, digits,
  `_ / . -`, space only — no shell metachars), `--list`, `tests/*.spec.js`,
  `--project=chromium|firefox|webkit`. Anything else is rejected.

## Never touch the keys
- The **master** key (`~/.ssh/id_ed25519_server`) grants a full shell on the Server.
  It is for the **human** only — do not use it, copy it, or read it.
- The restricted key profile lives at `~/.agent-tools/limited-entry/`; do not modify
  `authorized_keys`, the restricted key, or `~/.agent-tools/`.

## If a test fails or something looks off
- Reproduce with a scoped `agent-tst -g <pattern>` so output stays small.
- You MAY edit source/test files and re-run `agent-tst` to iterate — that is the
  intended loop.
- You are NOT authorized to SSH into the Server to "fix" it, run shell commands
  there, or change the test infrastructure.
- If `agent-tst` itself errors, report the exact output. Do not improvise a
  different SSH invocation.

## Sandbox context
- This agent runs in a `bwrap` sandbox. Its boundaries (read/write/blocked paths)
  are enforced by the kernel; details in `~/.bash/safe-omp.md` and
  `~/.bash/safe-omp.sh`.
- See `tests/SSH_SETUP.md` for the two-key SSH model and why the restricted key can
  only run the whitelisted test wrapper (`agent-tst` → `tst-locked` → `tst`).
