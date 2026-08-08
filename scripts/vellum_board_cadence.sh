#!/usr/bin/env bash
# Vellum / cron: publish board + mirror frontend data. LIA_LIVE_TRADING stays 0.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export LIA_LIVE_TRADING="${LIA_LIVE_TRADING:-0}"
export CHAIN="${CHAIN:-1}"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] board cadence start LIVE=$LIA_LIVE_TRADING"

python3 -m lia.board.publish || echo "WARN board.publish failed"
python3 -m lia.vellum.publish_data_for_frontend || echo "WARN mirror failed"

# Optional: gas + hatom snapshots if modules present
python3 -m lia.gas.publish 2>/dev/null || true
python3 -m lia.vellum.publish_hatom 2>/dev/null || true

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] done — commit data/ if reporter does not push"
echo "Suggested cadence: every 5–15 min via Vellum Timer or system cron"
