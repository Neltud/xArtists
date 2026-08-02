#!/usr/bin/env bash
# Simulate MAINNET deploy (no broadcast) — exact txGasUnits + fee estimate.
#
# Usage:
#   export PEM=/path/to/mainnet.pem   # required by mxpy even for simulate
#   ./scripts/simulate_deploy_mainnet.sh
#   ./scripts/simulate_deploy_mainnet.sh agents-marketplace
#   ./scripts/simulate_deploy_mainnet.sh nft-marketplace
#
# Requires: sc-meta / mxpy build producing contracts/*/output/*.wasm
# Rustc >= 1.78 recommended for multiversx-sc 0.50.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PEM="${PEM:-${LIA_WALLET_PEM_PATH:-}}"
CHAIN=1
PROXY="${PROXY:-https://gateway.multiversx.com}"
FEE_BPS="${FEE_BPS:-300}"
GAS_SIM="${GAS_SIM:-600000000}"
ONLY="${1:-all}"

if [[ -z "${PEM}" || ! -f "${PEM}" ]]; then
  echo "❌ PEM required (mxpy simulate still needs a wallet file)."
  exit 1
fi

if ! command -v mxpy >/dev/null 2>&1; then
  echo "❌ mxpy not found (pip install multiversx-sdk-cli)"
  exit 1
fi

simulate_one() {
  local name="$1"
  local dir="$ROOT/contracts/$name"
  echo ""
  echo "======== SIMULATE DEPLOY $name (MAINNET, fee_bps=$FEE_BPS) ========"
  cd "$dir"

  if ! find output -name "*.wasm" 2>/dev/null | head -1 | grep -q .; then
    echo "Building $name..."
    if command -v sc-meta >/dev/null 2>&1; then
      sc-meta all build || true
    fi
    mxpy contract build 2>/dev/null || sc-meta all build
  fi

  local WASM
  WASM=$(find output -name "*.wasm" 2>/dev/null | head -1 || true)
  if [[ -z "$WASM" ]]; then
    echo "❌ No wasm in $dir/output — install sc-meta (Rust >= 1.78) and rebuild"
    return 1
  fi

  local BYTES
  BYTES=$(wc -c < "$WASM")
  echo "WASM: $WASM ($BYTES bytes = $(echo "scale=1; $BYTES/1024" | bc) KB)"

  # Theoretical data gas (lower bound for payload size)
  python3 - <<PY
bytes = $BYTES
data_gas = 50_000 + 1500 * bytes
fee_data = data_gas * 1_000_000_000 / 1e18
print(f"Approx data gas (bytecode only): {data_gas:,}")
print(f"Approx data fee EGLD:           {fee_data:.6f}")
if data_gas > 80_000_000:
    print("⚠️  data gas alone > 80M — do NOT use gas-limit 80000000")
if data_gas > 200_000_000:
    print("⚠️  consider GAS_LIMIT=600000000 for deploy")
PY

  echo "Running mxpy --simulate gas-limit=$GAS_SIM ..."
  local LOG
  LOG=$(mxpy contract deploy \
    --bytecode "$WASM" \
    --pem "$PEM" \
    --proxy "$PROXY" \
    --chain "$CHAIN" \
    --gas-limit "$GAS_SIM" \
    --arguments "$FEE_BPS" \
    --recall-nonce \
    --simulate 2>&1) || true

  echo "$LOG" | tail -80

  # Extract txGasUnits if present
  echo "$LOG" | python3 - <<'PY'
import sys, re, json
text = sys.stdin.read()
m = re.search(r'"txGasUnits"\s*:\s*(\d+)', text)
if m:
    g = int(m.group(1))
    # upper-bound fee if all execution at modifier 0.01 is wrong for data-heavy deploy;
    # report gas units; real fee is on-chain after send
    print(f"\n✅ txGasUnits = {g:,}")
    print(f"   Set: export GAS_LIMIT={g}")
    print(f"   Or with 15% margin: export GAS_LIMIT={int(g * 1.15)}")
else:
    print("\n⚠️  txGasUnits not parsed — inspect log above (status / errors)")
PY
}

if [[ "$ONLY" == "all" || "$ONLY" == "agents-marketplace" ]]; then
  simulate_one agents-marketplace
fi
if [[ "$ONLY" == "all" || "$ONLY" == "nft-marketplace" ]]; then
  simulate_one nft-marketplace
fi

echo ""
echo "Then deploy for real:"
echo "  export GAS_LIMIT=<txGasUnits from above>"
echo "  ./scripts/deploy_mainnet.sh agents-marketplace"
