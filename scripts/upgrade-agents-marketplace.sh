#!/usr/bin/env bash
# agents-marketplace — local PEM owner: build → upgrade → set collections → test buyPack
# NEVER commit PEM files. Run only on a secure machine.
set -euo pipefail

CONTRACT_ADDRESS="${CONTRACT_ADDRESS:-erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg}"
PEM_FILE="${PEM_FILE:-$HOME/.mx/owner-wallet.pem}"
PROXY="${PROXY:-https://gateway.multiversx.com}"
CHAIN="${CHAIN:-1}"
API="${API:-https://api.multiversx.com}"

COL_PULSE="${COL_PULSE:-}"
COL_YIELD="${COL_YIELD:-}"
COL_SENTINEL="${COL_SENTINEL:-}"

PRICE_PULSE="${PRICE_PULSE:-1000000000000000000}"
PRICE_YIELD="${PRICE_YIELD:-2000000000000000000}"
PRICE_SENTINEL="${PRICE_SENTINEL:-3000000000000000000}"

ADMIN_ADDRESS="${ADMIN_ADDRESS:-erd1mmh2j5y8esv2tmmyeau3hr4xa2u2te3zc3j9wumn3v5vm8uvsczqnucj5l}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONTRACT_DIR="$REPO_ROOT/contracts/agents-marketplace"
DRY_RUN="${DRY_RUN:-0}"

log()  { printf '\n\033[1;36m▶ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m⚠ %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m✖ %s\033[0m\n' "$*"; exit 1; }
run() {
  if [[ "$DRY_RUN" == "1" ]]; then echo "DRY: $*"; else eval "$@"; fi
}
need() { command -v "$1" >/dev/null 2>&1 || die "Missing tool: $1"; }

log "Preflight"
need mxpy
[[ -f "$PEM_FILE" ]] || die "PEM not found: $PEM_FILE (set PEM_FILE=...)"
[[ -d "$CONTRACT_DIR" ]] || die "Contract dir missing: $CONTRACT_DIR"

echo "  CONTRACT  = $CONTRACT_ADDRESS"
echo "  PEM       = $PEM_FILE"
echo "  PROXY     = $PROXY  CHAIN=$CHAIN"
echo "  ADMIN     = $ADMIN_ADDRESS"

LIVE_HASH=$(curl -sS "$API/accounts/$CONTRACT_ADDRESS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('codeHash',''))" 2>/dev/null || true)
echo "  LIVE hash = ${LIVE_HASH:-(unavailable)}"
echo "  Pre-buyPack hash: tDIcnNMbDG5E7tpb7NTeJDnT6JxKs7faN7hyCALFUWs="

CODE=$(curl -sS -X POST "$API/vm-values/query" -H 'Content-Type: application/json' \
  -d "{\"scAddress\":\"$CONTRACT_ADDRESS\",\"funcName\":\"buyPack\",\"args\":[\"01\"]}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('data',{}).get('returnCode','') or d.get('error',''))" 2>/dev/null || echo "?")
echo "  buyPack query: $CODE (expect function not found before upgrade)"

log "A. Compile WASM"
cd "$CONTRACT_DIR"
if command -v sc-meta >/dev/null 2>&1; then
  run "sc-meta all build"
else
  warn "sc-meta not found — cargo wasm"
  run "cargo build --release --target wasm32-unknown-unknown"
fi

WASM=""
for c in output/agents-marketplace.wasm output/agents_marketplace.wasm wasm/output/*.wasm; do
  for f in $c; do [[ -f "$f" ]] && WASM="$f" && break 2; done
done
[[ -n "$WASM" ]] || die "WASM not found under output/"
echo "  WASM = $WASM"

log "B. Upgrade"
run "mxpy contract upgrade \"$CONTRACT_ADDRESS\" --bytecode=\"$WASM\" --pem=\"$PEM_FILE\" --proxy=\"$PROXY\" --chain=\"$CHAIN\" --gas-limit=60000000 --recall-nonce --send"

log "C. setPackCollection + setPackPrice"
if [[ -z "$COL_PULSE" || -z "$COL_YIELD" || -z "$COL_SENTINEL" ]]; then
  warn "Set COL_PULSE / COL_YIELD / COL_SENTINEL (full token ids) then re-run"
  warn "Grant ESDTRoleNFTCreate on each collection TO $CONTRACT_ADDRESS"
else
  run "mxpy contract call \"$CONTRACT_ADDRESS\" --function=setPackCollection --arguments 0x01 str:$COL_PULSE --pem=\"$PEM_FILE\" --proxy=\"$PROXY\" --chain=\"$CHAIN\" --gas-limit=12000000 --recall-nonce --send"
  run "mxpy contract call \"$CONTRACT_ADDRESS\" --function=setPackCollection --arguments 0x02 str:$COL_YIELD --pem=\"$PEM_FILE\" --proxy=\"$PROXY\" --chain=\"$CHAIN\" --gas-limit=12000000 --recall-nonce --send"
  run "mxpy contract call \"$CONTRACT_ADDRESS\" --function=setPackCollection --arguments 0x03 str:$COL_SENTINEL --pem=\"$PEM_FILE\" --proxy=\"$PROXY\" --chain=\"$CHAIN\" --gas-limit=12000000 --recall-nonce --send"
  run "mxpy contract call \"$CONTRACT_ADDRESS\" --function=setPackPrice --arguments 0x01 $PRICE_PULSE --pem=\"$PEM_FILE\" --proxy=\"$PROXY\" --chain=\"$CHAIN\" --gas-limit=10000000 --recall-nonce --send"
  run "mxpy contract call \"$CONTRACT_ADDRESS\" --function=setPackPrice --arguments 0x02 $PRICE_YIELD --pem=\"$PEM_FILE\" --proxy=\"$PROXY\" --chain=\"$CHAIN\" --gas-limit=10000000 --recall-nonce --send"
  run "mxpy contract call \"$CONTRACT_ADDRESS\" --function=setPackPrice --arguments 0x03 $PRICE_SENTINEL --pem=\"$PEM_FILE\" --proxy=\"$PROXY\" --chain=\"$CHAIN\" --gas-limit=10000000 --recall-nonce --send"
fi

log "D. Test buyPack Pulse"
if [[ "${SKIP_BUY:-0}" != "1" ]]; then
  run "mxpy contract call \"$CONTRACT_ADDRESS\" --function=buyPack --arguments 0x01 --value=$PRICE_PULSE --pem=\"$PEM_FILE\" --proxy=\"$PROXY\" --chain=\"$CHAIN\" --gas-limit=30000000 --recall-nonce --send"
else
  warn "SKIP_BUY=1"
fi

log "E. Verify"
echo "  SC:    https://explorer.multiversx.com/accounts/$CONTRACT_ADDRESS"
echo "  Admin: https://explorer.multiversx.com/accounts/$ADMIN_ADDRESS/nfts"
echo "  Env:   VITE_AGENTS_CODEHASH_OK=true"
echo "         VITE_AGENT_PACK_COLLECTIONS=$COL_PULSE,$COL_YIELD,$COL_SENTINEL"
log "Done."
