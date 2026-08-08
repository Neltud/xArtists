#!/usr/bin/env bash
# Sprint A — Mainnet SC (blocking /agents buy + NFT market)
# Optimized path: preflight → optional RUN_DEPLOY via deploy_optimized_mainnet.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export CHAIN="${CHAIN:-1}"
export PROXY="${PROXY:-https://gateway.multiversx.com}"
export FEE_BPS="${FEE_BPS:-300}"
RUN_DEPLOY="${RUN_DEPLOY:-0}"

echo "=== Sprint A MAINNET ONLY (CHAIN=$CHAIN FEE_BPS=$FEE_BPS) ==="
if [[ "$CHAIN" != "1" ]]; then
  echo "❌ Refuse non-mainnet"
  exit 1
fi

echo ""
echo "[1–2] Preflight (build + balance + gas estimate)"
./scripts/preflight_deploy_mainnet.sh all || exit $?

echo ""
echo "[3] Deploy"
if [[ "$RUN_DEPLOY" == "1" ]]; then
  RUN_DEPLOY=1 ./scripts/deploy_optimized_mainnet.sh
else
  echo "  skip — export RUN_DEPLOY=1 PEM=... after preflight OK"
  echo "  RUN_DEPLOY=1 ./scripts/deploy_optimized_mainnet.sh"
fi

echo ""
echo "[4] Blackbox — docs/MAINNET_DEPLOY_BLACKBOX.md"
echo "[5] Frontend env — see deploy_optimized output / docs/SC_DEPLOY_OPTIMIZED.md"
echo "[6] git commit data/contracts.json + rebuild Pages"
echo ""
echo "Keep LIA_LIVE_TRADING=0 until micro-trades OK"
