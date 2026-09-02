#!/usr/bin/env bash
# Interactive checklist for production sequence. Does NOT deploy without PEM.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export LIA_LIVE_TRADING="${LIA_LIVE_TRADING:-0}"
export CHAIN="${CHAIN:-1}"

echo "=== xArtists OPS SEQUENCE ==="
echo "LIA_LIVE_TRADING=$LIA_LIVE_TRADING (must be 0 until micro-trades OK)"
echo "CHAIN=$CHAIN"

if [[ "$CHAIN" != "1" ]]; then
  echo "❌ MAINNET only"
  exit 1
fi

echo ""
echo "[1/6] Pages — trigger Actions deploy-pages OR:"
echo "  cd apps/frontend && npm ci && npm run build"
echo ""
echo "[2/6] Vellum next_run..."
if command -v python3 >/dev/null; then
  python3 -m lia.vellum.next_run || python3 -m lia.board.publish || echo "(publish partial — check deps)"
else
  echo "python3 missing — run on Vellum host"
fi

echo ""
echo "[3/6] Deploy SC — requires PEM + EGLD:"
echo "  ./scripts/simulate_deploy_mainnet.sh"
echo "  PEM=... ./scripts/deploy_mainnet.sh agents-marketplace"
echo ""
echo "[4/6] Blackbox — docs/MAINNET_DEPLOY_BLACKBOX.md"
echo ""
echo "[5/6] post_deploy + VITE + rebuild Pages"
echo "  python scripts/post_deploy_contracts.py --agents erd1... --marketplace erd1..."
echo ""
echo "[6/6] KEEP LIA_LIVE_TRADING=0 until signature + micro-trades OK"
echo "=== done preflight ==="
