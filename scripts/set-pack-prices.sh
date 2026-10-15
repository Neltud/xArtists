#!/usr/bin/env bash
# Local helper: setPackPrice for Pulse/Yield/Sentinel on agents-marketplace.
# Usage:
#   export SC_DEPLOYER_PEM=/path/to/deployer.pem
#   ./scripts/set-pack-prices.sh 1 2 3          # EGLD amounts
#   ./scripts/set-pack-prices.sh 1.5 2.5 3.5
#
# Requires: mxpy, python3, multiversx-sdk (pip)
set -euo pipefail

SC="${SC_ADDRESS:-erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg}"
PROXY="${PROXY:-https://gateway.multiversx.com}"
API="${API:-https://api.multiversx.com}"
CHAIN="${CHAIN:-1}"
PEM="${SC_DEPLOYER_PEM:-}"

PULSE_EGLD="${1:-1}"
YIELD_EGLD="${2:-2}"
SENTINEL_EGLD="${3:-3}"

if [[ -z "$PEM" || ! -f "$PEM" ]]; then
  echo "ERROR: set SC_DEPLOYER_PEM to a valid PEM file path" >&2
  exit 1
fi

egld_to_atomic() {
  python3 -c "from decimal import Decimal; print(int(Decimal('$1') * 10**18))"
}

get_nonce() {
  local addr="$1"
  curl -sS "${API}/accounts/${addr}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('nonce',0))"
}

DEPLOYER=$(python3 -c "from pathlib import Path; from multiversx_sdk import UserPEM; print(UserPEM.from_file(Path('$PEM')).public_key.to_address().to_bech32())")
echo "deployer=$DEPLOYER sc=$SC"

declare -A PRICES=(
  [01]="$(egld_to_atomic "$PULSE_EGLD")"
  [02]="$(egld_to_atomic "$YIELD_EGLD")"
  [03]="$(egld_to_atomic "$SENTINEL_EGLD")"
)

for PT in 01 02 03; do
  ATOMIC="${PRICES[$PT]}"
  NONCE=$(get_nonce "$DEPLOYER")
  echo "setPackPrice 0x${PT} → ${ATOMIC} (EGLD input matched) nonce=$NONCE"
  mxpy contract call "$SC" \
    --function=setPackPrice \
    --arguments "0x${PT}" "$ATOMIC" \
    --pem="$PEM" \
    --proxy="$PROXY" --chain="$CHAIN" \
    --nonce="$NONCE" \
    --gas-limit=12000000 \
    --send --wait-result
  sleep 4
done

echo "Done. Pulse=$PULSE_EGLD Yield=$YIELD_EGLD Sentinel=$SENTINEL_EGLD EGLD"
