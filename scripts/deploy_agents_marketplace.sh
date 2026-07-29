#!/usr/bin/env bash
# Deploy Agents Marketplace SC (mainnet)
# Usage:
#   export PEM=~/wallet.pem
#   ./scripts/deploy_agents_marketplace.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONTRACT="$ROOT/contracts/agents-marketplace"
PEM="${PEM:-${LIA_WALLET_PEM_PATH:-}}"
FEE_BPS="${FEE_BPS:-250}"  # 2.5%
PROXY="${PROXY:-https://gateway.multiversx.com}"
CHAIN="${CHAIN:-1}"

if [[ -z "$PEM" || ! -f "$PEM" ]]; then
  echo "Set PEM=/path/to/wallet.pem"
  exit 1
fi

echo "== Build =="
cd "$CONTRACT"
if command -v mxpy >/dev/null 2>&1; then
  mxpy contract build || cargo build --release
else
  echo "mxpy not found — install MultiversX SDK / use CI artifact"
  exit 1
fi

WASM=$(find output -name '*.wasm' 2>/dev/null | head -1 || true)
if [[ -z "${WASM}" ]]; then
  echo "No wasm in output/ — build failed"
  exit 1
fi

echo "== Deploy (fee_bps=$FEE_BPS) =="
# Adjust args to match your mxpy version
OUT=$(mxpy contract deploy \
  --bytecode "$WASM" \
  --pem "$PEM" \
  --proxy "$PROXY" \
  --chain "$CHAIN" \
  --gas-limit 80000000 \
  --arguments "$FEE_BPS" \
  --recall-nonce \
  --send 2>&1) || true

echo "$OUT"
ADDR=$(echo "$OUT" | grep -oE 'erd1[a-z0-9]{58}' | head -1 || true)

if [[ -n "$ADDR" ]]; then
  mkdir -p "$ROOT/data"
  cat > "$ROOT/data/contracts.json" <<EOF
{
  "agents_marketplace": "$ADDR",
  "marketplace_nft": "erd1qqqqqqqqqqqqqpgqjzn7zjyevwez8n0zfevpvnrwyp2ln879yj7sj8354t",
  "deployed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "fee_bps": $FEE_BPS
}
EOF
  echo "Wrote data/contracts.json → agents_marketplace=$ADDR"
  echo "Set VITE_AGENTS_MARKETPLACE_ADDRESS=$ADDR in frontend env"
else
  echo "Could not parse contract address — paste manually into data/contracts.json"
fi
