If asked to run Playwright tests, use `agent-tst` ([[tests/SSH_SETUP|SSH_SETUP]] has full details). If a test fails or something looks off:
- Reproduce with a scoped `agent-tst -g <pattern>` so output stays small.
- You MAY edit source/test files and re-run `agent-tst` to iterate — that is the
  intended loop.
- You are NOT authorized to SSH into the Server to "fix" it, run shell commands
  there, or change the test infrastructure.
- If `agent-tst` itself errors, report the exact output. Do not improvise a
  different SSH invocation.

Syncthing and file sync:
- `agent-tst -g <pattern>` skips the Server-side Syncthing sync check **by
  design** (`scripts/tst` skips it for scoped runs). The "could not read
  Syncthing API key" warning on a scoped run is cosmetic — the run is not
  skipped.
- Run `scripts/agent-sync` before `agent-tst` when the Server must see the
  current working tree (optional convenience: symlink it as
  `~/.local/bin/agent-sync` from outside the sandbox). It rescans the LineByLine
  folder on the local Syncthing instance (127.0.0.1:8384) and waits for the
  Server to report completion 100% / needBytes 0. The sandbox reaches that API
  directly; it does not need the SSH master key.

Blocked paths (read-only inside the sandbox):
- `scripts/tst`, `.omp/`, `archive/`, `skills/delivery/unpack.sh`. Stage edits
  under `scratch/` and hand the user a copy command.