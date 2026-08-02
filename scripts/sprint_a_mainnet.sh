#!/usr/bin/env bash
# Sprint A — Mainnet SC (blocking /agents buy)
# Does NOT send txs unless RUN_DEPLOY=1 and PEM set.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export CHAIN="${CHAIN:-1}"
export PROXY="${PROXY:-https://gateway.multiversx.com}"
export FEE_BPS="${FEE_BPS:-300}"
export GAS_LIMIT="${GAS_LIMIT:-200000000}"
RUN_DEPLOY="${RUN_DEPLOY:-0}"
RUN_SIMULATE="${RUN_SIMULATE:-0}"

echo "=== Sprint A MAINNET ONLY (CHAIN=$CHAIN FEE_BPS=$FEE_BPS) ==="
if [[ "$CHAIN" != "1" ]]; then
  echo "❌ Refuse non-mainnet"
  exit 1
fi

echo ""
echo "[1] Build isolé"
if [[ -x scripts/build_scs_isolated.sh ]]; then
  ./scripts/build_scs_isolated.sh || echo "⚠️  build script failed — run sc-meta manually"
else
  for d in agents-marketplace nft-marketplace; do
    echo "  → contracts/$d"
    (cd "contracts/$d" && (sc-meta all build 2>/dev/null || mxpy contract build 2>/dev/null || true))
  done
fi

echo ""
echo "[2] Simulate (set RUN_SIMULATE=1 + PEM)"
if [[ "$RUN_SIMULATE" == "1" ]]; then
  ./scripts/simulate_deploy_mainnet.sh agents-marketplace || true
  ./scripts/simulate_deploy_mainnet.sh nft-marketplace || true
else
  echo "  skip — export RUN_SIMULATE=1 PEM=... to run"
fi

echo ""
echo "[3] Deploy (set RUN_DEPLOY=1 + PEM)"
if [[ "$RUN_DEPLOY" == "1" ]]; then
  ./scripts/deploy_mainnet.sh agents-marketplace
  ./scripts/deploy_mainnet.sh nft-marketplace
  echo "  → check data/contracts.json"
else
  echo "  skip — export RUN_DEPLOY=1 PEM=... after successful simulate"
fi

echo ""
echo "[4] Blackbox — follow docs/MAINNET_DEPLOY_BLACKBOX.md section 3–4"
echo "[5] Frontend env:"
echo "  VITE_AGENTS_MARKETPLACE_ADDRESS=<erd1 from contracts.json>"
echo "  VITE_AGENTS_FEE_BPS=300"
echo "  VITE_MARKETPLACE_ADDRESS=<nft>"
echo "[6] git add data/contracts.json && commit && Pages rebuild"
echo ""
echo "Vellum Sprint B after A:"
echo "  LIA_LIVE_TRADING=0"
echo "  python -m lia.vellum.orchestrator"
