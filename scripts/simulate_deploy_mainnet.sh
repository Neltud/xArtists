#!/usr/bin/env bash
# Preflight + gas guidance for mainnet deploy (no send).
# Prefer: ./scripts/preflight_deploy_mainnet.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export CHAIN="${CHAIN:-1}"
export PROXY="${PROXY:-https://gateway.multiversx.com}"
export FEE_BPS="${FEE_BPS:-300}"
ONLY="${1:-all}"

if [[ "$CHAIN" != "1" ]]; then
  echo "❌ MAINNET ONLY"
  exit 1
fi

echo "=== Simulate / preflight MAINNET (optimized) ==="
exec "$ROOT/scripts/preflight_deploy_mainnet.sh" "$ONLY"
