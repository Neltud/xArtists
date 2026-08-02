#!/usr/bin/env bash
# Build agents-marketplace + nft-marketplace in isolation (no root workspace).
# Avoids failures from incomplete nft-staking / tro-staking members.
#
# Usage:
#   ./scripts/build_scs_isolated.sh
#   ./scripts/build_scs_isolated.sh agents-marketplace
#   ./scripts/build_scs_isolated.sh nft-marketplace

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ONLY="${1:-all}"

if ! command -v mxpy >/dev/null 2>&1; then
  echo "❌ mxpy not found. Install: pip install multiversx-sdk-cli"
  exit 1
fi

build_one() {
  local name="$1"
  local dir="$ROOT/contracts/$name"
  if [[ ! -d "$dir" ]]; then
    echo "Skip $name (missing $dir)"
    return 1
  fi
  echo ""
  echo "======== BUILD $name (isolated) ========"
  cd "$dir"
  if mxpy contract build --help 2>&1 | grep -q -- '--docker'; then
    mxpy contract build --docker || mxpy contract build
  else
    mxpy contract build
  fi
  local WASM
  WASM=$(find output -name "*.wasm" 2>/dev/null | head -1 || true)
  if [[ -z "$WASM" ]]; then
    echo "❌ No wasm produced in $dir/output"
    return 1
  fi
  echo "✅ $name → $WASM ($(wc -c < "$WASM") bytes)"
}

FAILED=0
if [[ "$ONLY" == "all" || "$ONLY" == "agents-marketplace" ]]; then
  build_one agents-marketplace || FAILED=1
fi
if [[ "$ONLY" == "all" || "$ONLY" == "nft-marketplace" ]]; then
  build_one nft-marketplace || FAILED=1
fi

if [[ "$FAILED" -ne 0 ]]; then
  echo ""
  echo "Build failed. Common fixes:"
  echo "  rustup target add wasm32-unknown-unknown"
  echo "  pip install -U multiversx-sdk-cli"
  exit 1
fi

echo ""
echo "All requested builds OK. Next: ./scripts/deploy_mainnet.sh"
