#!/usr/bin/env bash
# Deploy xArtists tro-burn (Burnify) MAINNET only.
# Usage: PEM=... ./scripts/deploy_tro_burn.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PEM="${PEM:-${LIA_WALLET_PEM_PATH:-}}"
CHAIN="${CHAIN:-1}"
PROXY="${PROXY:-https://gateway.multiversx.com}"
GAS_LIMIT="${GAS_LIMIT:-80000000}"
TRO_ID="${TRO_TOKEN_ID:-TRO-94c925}"
LIA="${REWARD_WALLET:-erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6}"
EGLD_PER="${EGLD_PER_WHOLE_TRO:-1000000000000000}"
FEE_BPS="${PROTOCOL_FEE_BPS:-1000}"
DECIMALS="${TRO_DECIMALS:-6}"

if [[ "$CHAIN" != "1" ]]; then echo "❌ MAINNET ONLY"; exit 1; fi
if [[ -z "$PEM" || ! -f "$PEM" ]]; then echo "❌ Set PEM"; exit 1; fi
if ! command -v mxpy >/dev/null 2>&1; then echo "❌ mxpy required"; exit 1; fi

cd "$ROOT/contracts/tro-burn"
echo "======== BUILD tro-burn ========"
if command -v sc-meta >/dev/null 2>&1; then sc-meta all build || mxpy contract build; else mxpy contract build; fi
WASM=$(find output -name "*.wasm" 2>/dev/null | head -1 || true)
[[ -n "$WASM" && -f "$WASM" ]] || { echo "❌ No wasm"; exit 1; }
echo "WASM: $WASM"

echo "======== DEPLOY ========"
LOG=$(mxpy contract deploy --bytecode "$WASM" --pem "$PEM" --proxy "$PROXY" --chain "$CHAIN" \
  --gas-limit "$GAS_LIMIT" --arguments "str:$TRO_ID" "$LIA" "$EGLD_PER" "$FEE_BPS" "$DECIMALS" \
  --recall-nonce --send 2>&1) || true
echo "$LOG" | sed -E 's/-----BEGIN[^-]*-----.*-----END[^-]*-----/[PEM]/g'
TXHASH=$(echo "$LOG" | grep -oE '[a-f0-9]{64}' | head -1 || true)
ADDR=$(echo "$LOG" | grep -oE 'erd1qqqqqqqqqqqqqpgq[a-z0-9]+' | head -1 || true)
[[ -z "$ADDR" ]] && ADDR=$(echo "$LOG" | grep -oE 'erd1[a-z0-9]{58}' | head -1 || true)
[[ -n "$ADDR" ]] || { echo "❌ No address"; exit 1; }
echo "✅ tro_burn → $ADDR"

python3 - <<PY
import json, pathlib, datetime
root = pathlib.Path("$ROOT")
path = root / "data" / "contracts.json"
base = json.loads(path.read_text()) if path.exists() else {}
base.setdefault("contracts", {})["tro_burn"] = "$ADDR"
base["updated"] = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
path.write_text(json.dumps(base, indent=2) + "\n")
print("updated", path)
print("Next: ESDTLocalBurn + fundRewards + post_deploy --tro-burn $ADDR")
PY
