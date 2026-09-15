#!/usr/bin/env bash
# Deploy allowlist — MAINNET. Hard-refuses experimental btc-bridge.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ONLY="${1:-all}"
PEM="${PEM:-${LIA_WALLET_PEM_PATH:-}}"
PROXY="${PROXY:-https://gateway.multiversx.com}"
CHAIN="${CHAIN:-1}"
FEE_BPS="${FEE_BPS:-300}"

if [[ "$CHAIN" != "1" ]]; then
  echo "❌ MAINNET ONLY"
  exit 1
fi

# P0: never deploy btc-bridge
if [[ "$ONLY" == *"btc"* ]] || [[ "$ONLY" == *"bridge"* ]]; then
  echo "❌ REFUSED: btc-bridge / experimental bridge is NOT deployable (P0 security)."
  exit 1
fi

ALLOW=(agents-marketplace nft-marketplace)

deploy_one() {
  local name="$1"
  if [[ "$name" == "btc-bridge" ]]; then
    echo "❌ REFUSED btc-bridge"
    exit 1
  fi
  echo "→ deploy $name (see contracts/README + mxpy path in ops runbook)"
  # Actual mxpy deploy is environment-specific; call existing per-contract scripts if present
  case "$name" in
    agents-marketplace)
      if [[ -x "$ROOT/scripts/deploy_agents_marketplace.sh" ]]; then
        "$ROOT/scripts/deploy_agents_marketplace.sh" || true
      else
        echo "WARN: deploy_agents_marketplace.sh missing — manual mxpy required"
      fi
      ;;
    nft-marketplace)
      echo "WARN: use project mxpy recipe for nft-marketplace (wasm in contracts/nft-marketplace)"
      ;;
    *)
      echo "Unknown target $name"
      exit 1
      ;;
  esac
}

if [[ "$ONLY" == "all" ]]; then
  for n in "${ALLOW[@]}"; do deploy_one "$n"; done
else
  deploy_one "$ONLY"
fi

echo "Done. Run: python3 scripts/ops_sc_status.py && python3 scripts/ops_p0_verify.py"
