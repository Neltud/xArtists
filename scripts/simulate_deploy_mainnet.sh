#!/usr/bin/env bash
# Simulate MAINNET deploy (no broadcast) — exact txGasUnits when toolchain OK.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PEM="${PEM:-${LIA_WALLET_PEM_PATH:-}}"
CHAIN=1
PROXY="${PROXY:-https://gateway.multiversx.com}"
FEE_BPS="${FEE_BPS:-300}"
GAS_SIM="${GAS_SIM:-600000000}"
ONLY="${1:-all}"

redact() { echo "$1" | sed -E 's/-----BEGIN[^-]*-----.*-----END[^-]*-----/[PEM_REDACTED]/g'; }

if [[ -z "${PEM}" || ! -f "${PEM}" ]]; then
  echo "❌ PEM required for mxpy simulate"
  exit 1
fi
if ! command -v mxpy >/dev/null 2>&1; then
  echo "❌ mxpy not found"
  exit 1
fi
if [[ "$FEE_BPS" -gt 1000 ]]; then
  echo "❌ FEE_BPS max 1000"
  exit 1
fi

simulate_one() {
  local name="$1"
  local dir="$ROOT/contracts/$name"
  echo ""
  echo "======== SIMULATE $name ========"
  if [[ ! -d "$dir" ]]; then
    echo "❌ missing $dir"
    return 1
  fi
  cd "$dir"

  if ! find output -name "*.wasm" 2>/dev/null | head -1 | grep -q .; then
    echo "Building..."
    if command -v sc-meta >/dev/null 2>&1; then
      sc-meta all build || true
    fi
    mxpy contract build 2>/dev/null || sc-meta all build || {
      echo "❌ BUILD FAILED — docs/DEPLOY_ERRORS.md"
      return 1
    }
  fi

  local WASM
  WASM=$(find output -name "*.wasm" 2>/dev/null | head -1 || true)
  if [[ -z "$WASM" ]]; then
    echo "❌ No wasm"
    return 1
  fi
  local BYTES
  BYTES=$(wc -c < "$WASM")
  echo "WASM $BYTES bytes"

  python3 - "$BYTES" <<'PY'
import sys
bytes = int(sys.argv[1])
data_gas = 50_000 + 1500 * bytes
print(f"Estimated data gas: {data_gas:,}")
print(f"Estimated data fee EGLD: {data_gas * 1_000_000_000 / 1e18:.6f}")
PY

  set +e
  LOG=$(mxpy contract deploy \
    --bytecode "$WASM" \
    --pem "$PEM" \
    --proxy "$PROXY" \
    --chain "$CHAIN" \
    --gas-limit "$GAS_SIM" \
    --arguments "$FEE_BPS" \
    --recall-nonce \
    --simulate 2>&1)
  RC=$?
  set -e
  echo "$(redact "$LOG")" | tail -100

  if echo "$LOG" | grep -qiE 'insufficient funds'; then
    echo "❌ Simulate reports insufficient funds"
    return 1
  fi

  echo "$LOG" | python3 -c "
import sys,re
text=sys.stdin.read()
m=re.search(r'\"txGasUnits\"\\s*:\\s*(\d+)', text)
if m:
    g=int(m.group(1))
    print(f'✅ txGasUnits={g}')
    print(f'export GAS_LIMIT={int(g*1.15)}')
else:
    print('⚠️  txGasUnits not found — check status/errors above (docs/DEPLOY_ERRORS.md)')
    sys.exit(1)
" || return 1
  return 0
}

ERR=0
if [[ "$ONLY" == "all" || "$ONLY" == "agents-marketplace" ]]; then
  simulate_one agents-marketplace || ERR=1
fi
if [[ "$ONLY" == "all" || "$ONLY" == "nft-marketplace" ]]; then
  simulate_one nft-marketplace || ERR=1
fi
exit "$ERR"
