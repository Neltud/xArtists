#!/usr/bin/env bash
# Verify venue-split SC codeHash on MultiversX (devnet or mainnet).
# Usage:
#   VENUE_SC_ADDRESS=erd1qqq... CHAIN=devnet ./scripts/verify_venue_codehash.sh
#   VENUE_SC_ADDRESS=erd1qqq... CHAIN=mainnet ./scripts/verify_venue_codehash.sh
set -euo pipefail

ADDR="${VENUE_SC_ADDRESS:-}"
CHAIN="${CHAIN:-devnet}"

if [[ -z "$ADDR" ]]; then
  echo "❌ Set VENUE_SC_ADDRESS=erd1…"
  exit 1
fi

if [[ "$CHAIN" == "mainnet" ]]; then
  API="https://api.multiversx.com"
  EXPLORER="https://explorer.multiversx.com"
else
  API="https://devnet-api.multiversx.com"
  EXPLORER="https://devnet-explorer.multiversx.com"
fi

echo "→ Query $API/accounts/$ADDR"
JSON=$(curl -fsSL "$API/accounts/$ADDR")
echo "$JSON" | head -c 2000
echo

CODEHASH=$(echo "$JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('codeHash') or d.get('code_hash') or '')" 2>/dev/null || true)
OWNER=$(echo "$JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('ownerAddress') or d.get('owner') or '')" 2>/dev/null || true)

if [[ -z "$CODEHASH" || "$CODEHASH" == "None" || "$CODEHASH" == "null" ]]; then
  echo "❌ No codeHash — account empty or not a SC. Do NOT set VITE_VENUE_CODEHASH_OK."
  echo "   Explorer: $EXPLORER/accounts/$ADDR"
  exit 2
fi

echo "✅ codeHash: $CODEHASH"
echo "   owner:    $OWNER"
echo "   explorer: $EXPLORER/accounts/$ADDR"
echo
echo "Next (Pages secrets / build env):"
echo "  VITE_VENUE_SC_ADDRESS=$ADDR"
echo "  VITE_VENUE_CODEHASH_OK=1   # ONLY after you match wasm hash from build"
echo
echo "Micro-test rentPay (0.001 EGLD) after fund wallet:"
echo "  mxpy contract call $ADDR --function=rentPay --arguments str:iconic \\"
echo "    --value=1000000000000000 --gas-limit=15000000 --pem=\$SC_DEPLOYER_PEM \\"
echo "    --proxy=https://devnet-gateway.multiversx.com --chain=D --send"
