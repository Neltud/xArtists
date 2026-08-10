#!/usr/bin/env bash
# Build agents-marketplace + nft-marketplace + tro-burn in isolation.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ONLY="${1:-all}"

if ! command -v mxpy >/dev/null 2>&1; then
  echo "❌ mxpy not found"
  exit 1
fi

build_one() {
  local name="$1"
  local dir="$ROOT/contracts/$name"
  if [[ ! -d "$dir" ]]; then
    echo "Skip $name (missing $dir)"
    return 1
  fi
  echo "======== BUILD $name ========"
  cd "$dir"
  if mxpy contract build --help 2>&1 | grep -q -- '--docker'; then
    mxpy contract build --docker || mxpy contract build
  else
    mxpy contract build
  fi
  local WASM
  WASM=$(find output -name "*.wasm" 2>/dev/null | head -1 || true)
  if [[ -z "$WASM" ]]; then
    echo "❌ No wasm in $dir/output"
    return 1
  fi
  echo "✅ $name → $WASM"
}

FAILED=0
[[ "$ONLY" == "all" || "$ONLY" == "agents-marketplace" ]] && build_one agents-marketplace || true
[[ "$ONLY" == "all" || "$ONLY" == "nft-marketplace" ]] && build_one nft-marketplace || true
[[ "$ONLY" == "all" || "$ONLY" == "tro-burn" ]] && build_one tro-burn || true

# re-run failed check properly
FAILED=0
if [[ "$ONLY" == "all" || "$ONLY" == "agents-marketplace" ]]; then build_one agents-marketplace || FAILED=1; fi
if [[ "$ONLY" == "all" || "$ONLY" == "nft-marketplace" ]]; then build_one nft-marketplace || FAILED=1; fi
if [[ "$ONLY" == "all" || "$ONLY" == "tro-burn" ]]; then build_one tro-burn || FAILED=1; fi

if [[ "$FAILED" -ne 0 ]]; then
  echo "Build failed"
  exit 1
fi
echo "All requested builds OK"
