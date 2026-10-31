#!/usr/bin/env bash
# ensure-shellcheck.sh -- make a ShellCheck binary available for lint_gate.sh.
#
# Lives at skills/delivery/scripts/ (delivery owns installing lint dependencies;
# lint_gate.sh itself stays in skills/code-quality/scripts/). Sourced by
# prepare.sh and deploy.sh, and called by setup-sandbox.sh at Onboard.
#
# The npm `shellcheck` package is NOT a dependency: its 4.1.0 tarball pins the
# unmaintained decompress@4.2.1 (critical path-traversal advisory) and wraps a
# stale 0.11.0 binary. This script fetches the official release instead and
# verifies its published SHA256 before using it.
#
# Resolution order (first hit wins):
#   1. $SHELLCHECK_BIN                -- explicit override, trusted as-is
#   2. shellcheck on PATH             -- distro/CI package (e.g. /usr/bin/shellcheck)
#   3. node_modules/.bin/shellcheck   -- only if someone installed the npm package
#   4. ~/.cache/linebyline/shellcheck/<version>/shellcheck  -- cached download
#   5. download + verify + install (4)
#
# Usage (sourced by lint_gate.sh, or standalone):
#   . skills/delivery/scripts/ensure-shellcheck.sh
#   bin="$(resolve_shellcheck)" || bin=""
#
# CI notes: pinned version + checksum, no build step. Set SHELLCHECK_BIN to skip
# all resolution. Downloads are unauthenticated (checksum is the integrity gate).

SHELLCHECK_VERSION="${SHELLCHECK_VERSION:-0.11.0}"

# SHA256 of the official release archive (shellcheck-v<version>.<os>.<arch>.tar.xz).
# Upstream ships no .sha256 sidecar; these were computed from the downloaded
# release assets and cross-checked against the per-asset `digest` field the
# GitHub Releases API publishes for tag v0.11.0 (all four matched 2026-10-31).
# Re-verify both ways when bumping SHELLCHECK_VERSION. A platform with no entry
# here fails closed rather than running an unverified binary.
_shellcheck_sha256() {
  case "${1:-}:${2:-}" in
    linux:x86_64)   echo "8c3be12b05d5c177a04c29e3c78ce89ac86f1595681cab149b65b97c4e227198" ;;
    linux:aarch64)  echo "12b331c1d2db6b9eb13cfca64306b1b157a86eb69db83023e261eaa7e7c14588" ;;
    darwin:x86_64)  echo "3c89db4edcab7cf1c27bff178882e0f6f27f7afdf54e859fa041fca10febe4c6" ;;
    darwin:aarch64) echo "56affdd8de5527894dca6dc3d7e0a99a873b0f004d7aabc30ae407d3f48b0a79" ;;
    *)              echo "" ;;
  esac
}

_shellcheck_os() {
  case "$(uname -s)" in
    Linux)  echo linux ;;
    Darwin) echo darwin ;;
    *)      echo unknown ;;
  esac
}

_shellcheck_arch() {
  case "$(uname -m)" in
    x86_64|amd64)  echo x86_64 ;;
    aarch64|arm64) echo aarch64 ;;
    *)             uname -m ;;
  esac
}

# Prints the path of a usable shellcheck binary, or nothing (returns 1).
resolve_shellcheck() {
  if [[ -n "${SHELLCHECK_BIN:-}" ]]; then
    if [[ -x "$SHELLCHECK_BIN" ]]; then
      echo "$SHELLCHECK_BIN"
      return 0
    fi
    echo "ensure-shellcheck: SHELLCHECK_BIN=$SHELLCHECK_BIN is not executable" >&2
    return 1
  fi

  if command -v shellcheck >/dev/null 2>&1; then
    command -v shellcheck
    return 0
  fi

  local root="${TARGET_DIR:-.}"
  if [[ -x "$root/node_modules/.bin/shellcheck" ]]; then
    echo "$root/node_modules/.bin/shellcheck"
    return 0
  fi

  local os arch sha cache_dir cache_bin
  os="$(_shellcheck_os)"
  arch="$(_shellcheck_arch)"
  sha="$(_shellcheck_sha256 "$os" "$arch")"
  cache_dir="${SHELLCHECK_CACHE:-$HOME/.cache/linebyline/shellcheck/$SHELLCHECK_VERSION}"
  cache_bin="$cache_dir/shellcheck"

  if [[ -x "$cache_bin" ]]; then
    echo "$cache_bin"
    return 0
  fi

  # Fail closed: an unpinned platform must not silently run an unverified binary.
  if [[ -z "$sha" ]]; then
    echo "ensure-shellcheck: no pinned checksum for ${os}/${arch} (version $SHELLCHECK_VERSION)" >&2
    echo "  Set SHELLCHECK_BIN, or install ShellCheck via your package manager." >&2
    return 1
  fi

  if ! command -v curl >/dev/null 2>&1; then
    echo "ensure-shellcheck: curl is required to download ShellCheck" >&2
    return 1
  fi

  local url tmp
  url="https://github.com/koalaman/shellcheck/releases/download/v${SHELLCHECK_VERSION}/shellcheck-v${SHELLCHECK_VERSION}.${os}.${arch}.tar.xz"
  tmp="$(mktemp -d)" || return 1
  # shellcheck disable=SC2064 # expand $tmp now; the trap must not see later values
  trap "rm -rf '$tmp'" RETURN

  echo "ensure-shellcheck: downloading $url" >&2
  if ! curl -fsSL --retry 2 --max-time 120 -o "$tmp/archive.tar.xz" "$url"; then
    echo "ensure-shellcheck: download failed (offline? set SHELLCHECK_BIN)" >&2
    return 1
  fi

  local got
  got="$( (command -v sha256sum >/dev/null && sha256sum "$tmp/archive.tar.xz") || shasum -a 256 "$tmp/archive.tar.xz" 2>/dev/null | awk '{print $1}')"
  got="${got%% *}"
  if [[ "$got" != "$sha" ]]; then
    echo "ensure-shellcheck: checksum mismatch for $url" >&2
    echo "  expected $sha" >&2
    echo "  got      $got" >&2
    return 1
  fi

  mkdir -p "$cache_dir" || return 1
  if ! tar -xJf "$tmp/archive.tar.xz" -C "$tmp"; then
    echo "ensure-shellcheck: extraction failed (needs xz support in tar)" >&2
    return 1
  fi
  cp "$tmp/shellcheck-v${SHELLCHECK_VERSION}/shellcheck" "$cache_bin" || return 1
  chmod 755 "$cache_bin" || return 1

  echo "$cache_bin"
}

# Standalone use: print the resolved path (or exit 1).
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  resolve_shellcheck
fi
