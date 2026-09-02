#!/usr/bin/env bash
# Deploy treasury-splitter on MultiversX MAINNET ONLY.
# Hard split init: Mission 40% · Reserve 30% · Reward 20% · Ops 10%
#
# Required env:
#   PEM=/path/mainnet.pem
#   MISSION_ADDR=erd1...
#   RESERVE_ADDR=erd1...
#   REWARD_ADDR=erd1...
#   OPS_ADDR=erd1...
#
# Usage:
#   export PEM=... MISSION_ADDR=... RESERVE_ADDR=... REWARD_ADDR=... OPS_ADDR=...
#   ./scripts/deploy_treasury_splitter.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export CHAIN="${CHAIN:-1}"
export PROXY="${PROXY:-https://gateway.multiversx.com}"
PEM="${PEM:-${LIA_WALLET_PEM_PATH:-}}"
GAS_LIMIT="${GAS_LIMIT:-80000000}"

MISSION_BPS=4000
RESERVE_BPS=3000
REWARD_BPS=2000
OPS_BPS=1000

if [[ "$CHAIN" != "1" ]]; then
  echo "❌ MAINNET ONLY (CHAIN=1). Refusing CHAIN=$CHAIN"
  exit 1
fi

if [[ -z "$PEM" || ! -f "$PEM" ]]; then
  echo "❌ Set PEM=/path/to/mainnet.pem (never commit)"
  exit 1
fi

for v in MISSION_ADDR RESERVE_ADDR REWARD_ADDR OPS_ADDR; do
  if [[ -z "${!v:-}" ]]; then
    echo "❌ Missing $v (erd1… treasury destination)"
    exit 1
  fi
done

if [[ "$MISSION_ADDR" == "$RESERVE_ADDR" ]] || [[ "$MISSION_ADDR" == "$REWARD_ADDR" ]] \
  || [[ "$MISSION_ADDR" == "$OPS_ADDR" ]] || [[ "$RESERVE_ADDR" == "$REWARD_ADDR" ]] \
  || [[ "$RESERVE_ADDR" == "$OPS_ADDR" ]] || [[ "$REWARD_ADDR" == "$OPS_ADDR" ]]; then
  echo "❌ Destinations must be four distinct addresses"
  exit 1
fi

echo "======== BUILD treasury-splitter ========"
"$ROOT/scripts/build_scs_isolated.sh" treasury-splitter

DIR="$ROOT/contracts/treasury-splitter"
WASM=$(find "$DIR/output" -name "*.wasm" 2>/dev/null | head -1)
if [[ -z "$WASM" || ! -f "$WASM" ]]; then
  echo "❌ wasm not found under $DIR/output"
  exit 1
fi

WASM_SHA=$(sha256sum "$WASM" | awk '{print $1}')
WASM_BYTES=$(wc -c < "$WASM")
echo "wasm: $WASM ($WASM_BYTES bytes)"
echo "wasm SHA-256: $WASM_SHA"

ARGS="$MISSION_ADDR $RESERVE_ADDR $REWARD_ADDR $OPS_ADDR $MISSION_BPS $RESERVE_BPS $REWARD_BPS $OPS_BPS"

echo "======== DEPLOY mainnet ========"
echo "split: $MISSION_BPS/$RESERVE_BPS/$REWARD_BPS/$OPS_BPS (must sum 10000)"

LOG=$(mktemp)
set +e
mxpy contract deploy \
  --bytecode="$WASM" \
  --pem="$PEM" \
  --proxy="$PROXY" \
  --chain="$CHAIN" \
  --gas-limit="$GAS_LIMIT" \
  --arguments $ARGS \
  --recall-nonce \
  --send \
  2>&1 | tee "$LOG"
RC=${PIPESTATUS[0]}
set -e

ADDR=$(grep -Eo 'erd1[a-z0-9]{58}' "$LOG" | head -1 || true)
if [[ -z "$ADDR" ]]; then
  ADDR=$(grep -iE 'contract address|address:' "$LOG" | grep -Eo 'erd1[a-z0-9]{58}' | head -1 || true)
fi

OUT_JSON="$ROOT/data/deploy_treasury_splitter_last.json"
mkdir -p "$ROOT/data"
python3 - << PY
import json, time
from pathlib import Path
payload = {
  "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
  "network": "mainnet",
  "chain_id": "1",
  "contract": "treasury-splitter",
  "wasm_path": "$WASM",
  "wasm_sha256": "$WASM_SHA",
  "wasm_bytes": int("$WASM_BYTES"),
  "address": "$ADDR" or None,
  "init": {
    "mission": "$MISSION_ADDR",
    "reserve": "$RESERVE_ADDR",
    "reward": "$REWARD_ADDR",
    "ops": "$OPS_ADDR",
    "mission_bps": $MISSION_BPS,
    "reserve_bps": $RESERVE_BPS,
    "reward_bps": $REWARD_BPS,
    "ops_bps": $OPS_BPS,
  },
  "mxpy_rc": $RC,
  "note": "Owner = deployer PEM. Transfer ownership 2-step to multisig after verify.",
}
Path("$OUT_JSON").write_text(json.dumps(payload, indent=2) + "\n")
print(json.dumps(payload, indent=2))
PY

if [[ $RC -ne 0 || -z "$ADDR" ]]; then
  echo "❌ Deploy failed or address not parsed. See $OUT_JSON"
  exit 1
fi

echo "✅ Deployed treasury-splitter → $ADDR"
echo "   wasm SHA-256: $WASM_SHA"
echo "Next: python scripts/post_deploy_contracts.py --treasury-splitter $ADDR"
