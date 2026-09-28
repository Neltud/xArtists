#!/usr/bin/env bash
# Micro rentPay test on venue-split (devnet default).
# Requires: SC live with codeHash, funded PEM, VENUE_SC_ADDRESS
set -euo pipefail

ADDR="${VENUE_SC_ADDRESS:-}"
PEM="${SC_DEPLOYER_PEM:-}"
TIER="${TIER_ID:-xartists}"
VALUE="${VALUE_ATOMS:-1000000000000000}"  # 0.001 EGLD
CHAIN="${CHAIN:-D}"
PROXY="${PROXY:-https://devnet-gateway.multiversx.com}"

if [[ -z "$ADDR" || -z "$PEM" ]]; then
  echo "❌ VENUE_SC_ADDRESS and SC_DEPLOYER_PEM required"
  exit 1
fi
if ! command -v mxpy >/dev/null 2>&1; then
  echo "❌ mxpy not found"
  exit 1
fi

echo "→ rentPay tier=$TIER value=$VALUE → $ADDR"
mxpy contract call "$ADDR" \
  --function=rentPay \
  --arguments "str:${TIER}" \
  --value="$VALUE" \
  --gas-limit=15000000 \
  --pem="$PEM" \
  --proxy="$PROXY" \
  --chain="$CHAIN" \
  --send \
  --recall-nonce

echo "✅ Submitted. Check explorer for rentPaid event + bucket balances."
