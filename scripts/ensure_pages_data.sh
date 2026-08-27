#!/usr/bin/env bash
# Ensure critical JSON exist under apps/frontend/public/data and docs/data
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUB="$ROOT/apps/frontend/public/data"
DATA="$ROOT/data"
DOCS="$ROOT/docs/data"
mkdir -p "$PUB" "$DOCS"

CRITICAL=(
  lia_board.json
  lia_v6_status.json
  entity_map.json
  live_network_snapshot.json
  greensmoke_forecasts.json
  voyage_agent.json
  agents_catalog.json
  config.json
  oracle_prices.json
  risk_manager_state.json
)

for f in "${CRITICAL[@]}"; do
  if [[ -f "$DATA/$f" ]]; then
    cp -f "$DATA/$f" "$PUB/$f" 2>/dev/null || true
    cp -f "$DATA/$f" "$DOCS/$f" 2>/dev/null || true
  elif [[ -f "$PUB/$f" ]]; then
    cp -f "$PUB/$f" "$DOCS/$f" 2>/dev/null || true
  else
    echo "WARN missing $f"
  fi
done

echo "ensure_pages_data OK"
