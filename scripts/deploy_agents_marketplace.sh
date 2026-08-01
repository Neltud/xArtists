#!/usr/bin/env bash
# Deploy Agents Marketplace SC (mainnet) and print address for frontend env.
# Usage: PEM=/path/to/wallet.pem FEE_BPS=250 ./scripts/deploy_agents_marketplace.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CDIR="$ROOT/contracts/agents-marketplace"
PEM="${PEM:-}"
FEE_BPS="${FEE_BPS:-250}"
CHAIN="${CHAIN:-1}"
PROXY="${PROXY:-https://gateway.multiversx.com}"

if [[ -z "$PEM" || ! -f "$PEM" ]]; then
  echo "Set PEM=/path/to/wallet.pem (never commit PEM)"
  exit 1
fi

cd "$CDIR"
if command -v mxpy >/dev/null 2>&1; then
  echo "Building & deploying agents-marketplace fee_bps=$FEE_BPS chain=$CHAIN"
  mxpy contract build
  # Adjust bytecode path after build
  WASM="$(find output -name '*.wasm' 2>/dev/null | head -1 || true)"
  if [[ -z "$WASM" ]]; then
    echo "No wasm found — run mxpy contract build in $CDIR first"
    exit 1
  fi
  mxpy contract deploy \
    --bytecode "$WASM" \
    --arguments "$FEE_BPS" \
    --pem "$PEM" \
    --proxy "$PROXY" \
    --chain "$CHAIN" \
    --recall-nonce \
    --gas-limit 80000000 \
    --send
  echo ""
  echo ">>> Copy contract address into:"
  echo "    VITE_AGENTS_MARKETPLACE_ADDRESS=erd1..."
  echo "    data/contracts.json → agents_marketplace"
  echo "    src/config/contracts.ts → CONTRACTS.agentsMarketplace"
else
  echo "mxpy not installed. Install MultiversX SDK CLI, then re-run."
  exit 1
fi
