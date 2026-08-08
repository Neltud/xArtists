#!/usr/bin/env bash
# Copy critical JSON into every place Pages / Vite may serve.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CRITICAL=(
  lia_board.json
  lia_v6_status.json
  contracts.json
  lia_trades.json
  lia_trailing_state.json
  lia_portfolio.json
  hatom_lia.json
  greensmoke_top.json
  ads_active.json
  config.json
  xartists_collections.index.json
  treasury_wallets.json
  post_deploy_report.json
  marketplace_codehash_live.json
)

DESTS=(
  "apps/frontend/public/data"
  "docs/data"
)

for dest in "${DESTS[@]}"; do
  mkdir -p "$dest"
done

for f in "${CRITICAL[@]}"; do
  if [[ -f "data/$f" ]]; then
    for dest in "${DESTS[@]}"; do
      cp -f "data/$f" "$dest/$f"
    done
    echo "ok $f"
  else
    echo "miss data/$f"
  fi
done

echo "ensure_pages_data done"
