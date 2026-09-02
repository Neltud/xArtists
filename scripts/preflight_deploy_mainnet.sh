#!/usr/bin/env bash
# Optimized preflight before mainnet SC deploy.
# Checks: CHAIN, PEM, mxpy, balance, wasm size → GAS_LIMIT recommendation.
# Does NOT send transactions.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export CHAIN="${CHAIN:-1}"
export PROXY="${PROXY:-https://gateway.multiversx.com}"
export API="${API:-https://api.multiversx.com}"
export FEE_BPS="${FEE_BPS:-300}"
PEM="${PEM:-${LIA_WALLET_PEM_PATH:-}}"
ONLY="${1:-all}"
MIN_EGLD_ATOMIC="${MIN_EGLD_ATOMIC:-250000000000000000}"  # 0.25 EGLD recommended buffer

if [[ "$CHAIN" != "1" ]]; then
  echo "❌ MAINNET ONLY (CHAIN=1)"
  exit 1
fi

echo "=== Preflight MAINNET SC deploy ==="
echo "proxy=$PROXY fee_bps=$FEE_BPS only=$ONLY"

if [[ -z "$PEM" || ! -f "$PEM" ]]; then
  echo "❌ PEM missing — export PEM=/path/to/mainnet.pem"
  exit 1
fi
if ! command -v mxpy >/dev/null 2>&1; then
  echo "❌ mxpy not found — pip install -U multiversx-sdk-cli"
  exit 1
fi
if [[ "$FEE_BPS" -gt 1000 ]]; then
  echo "❌ FEE_BPS=$FEE_BPS > 1000"
  exit 1
fi

ADDR=$(mxpy wallet pem-address "$PEM" 2>/dev/null || true)
if [[ -z "$ADDR" ]]; then
  ADDR=$(mxpy account get --pem "$PEM" --proxy "$PROXY" 2>/dev/null | grep -oE 'erd1[a-z0-9]{58}' | head -1 || true)
fi
if [[ -z "$ADDR" ]]; then
  echo "⚠️  Could not derive address from PEM — balance check skipped"
else
  echo "Deployer: $ADDR"
  BAL=$(curl -sS "$API/accounts/$ADDR" | python3 -c "import sys,json; print(json.load(sys.stdin).get('balance','0'))" 2>/dev/null || echo 0)
  echo "Balance atomic: $BAL"
  python3 - <<PY
bal = int("$BAL" or 0)
need = int("$MIN_EGLD_ATOMIC")
egld = bal / 1e18
print(f"Balance: {egld:.6f} EGLD")
if bal < need:
    print(f"❌ Need at least {need/1e18:.3f} EGLD for deploy+buffer (have {egld:.6f})")
    raise SystemExit(2)
print("✅ Balance OK for deploy buffer")
PY
fi

echo ""
echo "=== Build (isolated) ==="
"$ROOT/scripts/build_scs_isolated.sh" "$ONLY"

estimate_one() {
  local name="$1"
  local dir="$ROOT/contracts/$name"
  local WASM
  WASM=$(find "$dir/output" -name "*.wasm" 2>/dev/null | head -1 || true)
  if [[ -z "$WASM" ]]; then
    echo "❌ No wasm for $name — build failed?"
    return 1
  fi
  echo ""
  echo "--- $name ---"
  python3 "$ROOT/scripts/estimate_deploy_gas.py" "$WASM"
  local REC
  REC=$(python3 "$ROOT/scripts/estimate_deploy_gas.py" "$WASM" --print-only)
  echo "export GAS_LIMIT=$REC   # for $name"
  mkdir -p "$ROOT/data"
  echo "$REC" > "$ROOT/data/gas_limit_${name}.txt"
}

FAILED=0
if [[ "$ONLY" == "all" || "$ONLY" == "agents-marketplace" ]]; then
  estimate_one agents-marketplace || FAILED=1
fi
if [[ "$ONLY" == "all" || "$ONLY" == "nft-marketplace" ]]; then
  estimate_one nft-marketplace || FAILED=1
fi

echo ""
if [[ "$FAILED" -ne 0 ]]; then
  echo "❌ Preflight failed"
  exit 1
fi
echo "✅ Preflight OK — next:"
echo "  ./scripts/runbook_deploy.sh deploy"
echo "  # or: RUN_DEPLOY=1 ./scripts/deploy_optimized_mainnet.sh"
echo "  # docs: docs/RUNBOOK_DEPLOY.md"
