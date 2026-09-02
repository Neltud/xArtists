#!/usr/bin/env bash
# Vellum / cron: oracles + board + mirror frontend data. LIA_LIVE_TRADING stays 0.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export LIA_LIVE_TRADING="${LIA_LIVE_TRADING:-0}"
export CHAIN="${CHAIN:-1}"
export PYTHONPATH="$ROOT${PYTHONPATH:+:$PYTHONPATH}"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] cadence start LIVE=$LIA_LIVE_TRADING"

# 1) On-chain-leaning price oracles first (marks portfolio / gas / board)
python3 -m lia.oracles.publish || echo "WARN oracle publish failed"

# 2) Board positions / series / arb
python3 -m lia.board.publish || echo "WARN board.publish failed"

# 3) Mirror critical JSON for Pages / Vite
python3 -m lia.vellum.publish_data_for_frontend || echo "WARN mirror failed"

python3 -m lia.gas.publish 2>/dev/null || true
python3 -m lia.vellum.publish_hatom 2>/dev/null || true

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] done — commit data/ if reporter does not push"
