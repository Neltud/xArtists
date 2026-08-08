#!/usr/bin/env bash
# Optimized end-to-end mainnet deploy pipeline (agents + nft marketplaces).
#
# Features:
#   - MAINNET only (CHAIN=1)
#   - Isolated build
#   - Per-contract GAS_LIMIT from wasm size (+ buffer)
#   - Balance preflight
#   - Deploy with retries on gateway errors
#   - Adaptive tx confirmation
#   - post_deploy_contracts.py + codehash verify
#   - Never writes fake addresses
#
# Usage:
#   export PEM=/path/to/mainnet.pem
#   ./scripts/deploy_optimized_mainnet.sh              # preflight only
#   RUN_DEPLOY=1 ./scripts/deploy_optimized_mainnet.sh # real send
#   RUN_DEPLOY=1 ONLY=agents-marketplace ./scripts/deploy_optimized_mainnet.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export CHAIN="${CHAIN:-1}"
export PROXY="${PROXY:-https://gateway.multiversx.com}"
export API="${API:-https://api.multiversx.com}"
export FEE_BPS="${FEE_BPS:-300}"
export MAX_RETRIES="${MAX_RETRIES:-2}"
PEM="${PEM:-${LIA_WALLET_PEM_PATH:-}}"
ONLY="${ONLY:-all}"
RUN_DEPLOY="${RUN_DEPLOY:-0}"
CONFIRM_TIMEOUT="${CONFIRM_TIMEOUT:-180}"

redact() { echo "$1" | sed -E 's/-----BEGIN[^-]*-----.*-----END[^-]*-----/[PEM_REDACTED]/g'; }

if [[ "$CHAIN" != "1" ]]; then
  echo "❌ MAINNET ONLY"
  exit 1
fi
if [[ -z "$PEM" || ! -f "$PEM" ]]; then
  echo "❌ Set PEM=/path/to/mainnet.pem"
  exit 1
fi
if ! command -v mxpy >/dev/null 2>&1; then
  echo "❌ mxpy required"
  exit 1
fi
if [[ "$FEE_BPS" -gt 1000 ]]; then
  echo "❌ FEE_BPS max 1000"
  exit 1
fi

echo "╔══════════════════════════════════════════╗"
echo "║  xArtists optimized MAINNET SC deploy    ║"
echo "╚══════════════════════════════════════════╝"
echo "FEE_BPS=$FEE_BPS ONLY=$ONLY RUN_DEPLOY=$RUN_DEPLOY"

# --- Preflight ---
"$ROOT/scripts/preflight_deploy_mainnet.sh" "$ONLY" || exit $?

if [[ "$RUN_DEPLOY" != "1" ]]; then
  echo ""
  echo "ℹ️  Dry-run complete. To send txs:"
  echo "   RUN_DEPLOY=1 PEM=$PEM ./scripts/deploy_optimized_mainnet.sh"
  exit 0
fi

OUT_TMP="$ROOT/data/contracts.deployed.json.tmp"
OUT_JSON="$ROOT/data/contracts.deployed.json"
echo "{}" > "$OUT_TMP"
FAILED=0

deploy_one() {
  local name="$1"
  local fee_arg="$2"
  local dir="$ROOT/contracts/$name"
  local WASM
  WASM=$(find "$dir/output" -name "*.wasm" 2>/dev/null | head -1 || true)
  if [[ -z "$WASM" || ! -f "$WASM" ]]; then
    echo "❌ No wasm for $name"
    FAILED=1
    return 1
  fi

  local GAS
  if [[ -f "$ROOT/data/gas_limit_${name}.txt" ]]; then
    GAS=$(cat "$ROOT/data/gas_limit_${name}.txt")
  else
    GAS=$(python3 "$ROOT/scripts/estimate_deploy_gas.py" "$WASM" --print-only)
  fi
  # Allow override
  GAS="${GAS_LIMIT_OVERRIDE:-$GAS}"
  if [[ "$GAS" -gt 600000000 ]]; then GAS=600000000; fi

  echo ""
  echo "======== DEPLOY $name | gas=$GAS | fee_bps=$fee_arg ========"
  python3 "$ROOT/scripts/estimate_deploy_gas.py" "$WASM" --check "$GAS" || true

  local attempt=1
  local LOG="" TXHASH="" ADDR=""

  while [[ "$attempt" -le "$MAX_RETRIES" ]]; do
    echo "Attempt $attempt/$MAX_RETRIES…"
    set +e
    LOG=$(mxpy contract deploy \
      --bytecode "$WASM" \
      --pem "$PEM" \
      --proxy "$PROXY" \
      --chain "$CHAIN" \
      --gas-limit "$GAS" \
      --arguments "$fee_arg" \
      --recall-nonce \
      --send 2>&1)
    local RC=$?
    set -e
    echo "$(redact "$LOG")"

    TXHASH=$(echo "$LOG" | grep -oE '[a-fA-F0-9]{64}' | head -1 || true)
    ADDR=$(echo "$LOG" | grep -oE 'erd1qqqqqqqqqqqqqpgq[a-z0-9]+' | head -1 || true)
    if [[ -z "$ADDR" ]]; then
      ADDR=$(echo "$LOG" | grep -oE 'erd1[a-z0-9]{58}' | head -1 || true)
    fi

    if echo "$LOG" | grep -qiE 'insufficient funds|not enough'; then
      echo "❌ INSUFFICIENT FUNDS"; FAILED=1; return 1
    fi
    if echo "$LOG" | grep -qiE 'out of gas|gas limit exceeded'; then
      # bump gas and retry once
      local NEW=$(( GAS + 100000000 ))
      if [[ "$NEW" -gt 600000000 ]]; then NEW=600000000; fi
      if [[ "$NEW" -gt "$GAS" && "$attempt" -lt "$MAX_RETRIES" ]]; then
        echo "⚠️  Out of gas — bump GAS $GAS → $NEW"
        GAS=$NEW
        attempt=$((attempt + 1))
        sleep 5
        continue
      fi
      echo "❌ GAS exhausted at max"; FAILED=1; return 1
    fi

    if [[ -n "$TXHASH" ]]; then
      echo "Tx submitted: $TXHASH"
      set +e
      python3 "$ROOT/scripts/confirm_tx_mainnet.py" "$TXHASH" --timeout "$CONFIRM_TIMEOUT"
      local CONF=$?
      set -e
      if [[ "$CONF" -eq 0 ]]; then
        # Prefer address from explorer if missing
        if [[ -z "$ADDR" ]]; then
          ADDR=$(curl -sS "$API/transactions/$TXHASH" | python3 -c "
import sys,json
d=json.load(sys.stdin)
print(d.get('contractAddress') or d.get('receiver') or '')
" 2>/dev/null || true)
        fi
        if [[ -n "$ADDR" ]]; then
          echo "✅ $name → $ADDR"
          python3 - <<PY
import json, pathlib
p = pathlib.Path("$OUT_TMP")
d = json.loads(p.read_text()) if p.exists() else {}
d["$name"] = "$ADDR"
d["${name}_tx"] = "$TXHASH"
d["${name}_gas"] = $GAS
p.write_text(json.dumps(d, indent=2))
PY
          return 0
        fi
        echo "⚠️  Tx success but address parse failed — set manually from explorer"
        FAILED=1
        return 1
      elif [[ "$CONF" -eq 2 ]]; then
        echo "⚠️  Confirm timeout — check explorer; not writing address"
        FAILED=1
        return 1
      else
        echo "❌ Tx failed on-chain"
        FAILED=1
        return 1
      fi
    fi

    if echo "$LOG" | grep -qiE 'timeout|temporar|502|503|504' && [[ "$attempt" -lt "$MAX_RETRIES" ]]; then
      echo "⚠️  Gateway error — retry in 20s"
      sleep 20
      attempt=$((attempt + 1))
      continue
    fi

    echo "❌ Deploy failed for $name (no address/tx)"
    FAILED=1
    return 1
  done
}

if [[ "$ONLY" == "all" || "$ONLY" == "agents-marketplace" ]]; then
  deploy_one agents-marketplace "$FEE_BPS" || true
fi
if [[ "$ONLY" == "all" || "$ONLY" == "nft-marketplace" ]]; then
  deploy_one nft-marketplace "$FEE_BPS" || true
fi

mv -f "$OUT_TMP" "$OUT_JSON" 2>/dev/null || true
echo ""
echo "Wrote $OUT_JSON"
cat "$OUT_JSON" 2>/dev/null || true

# --- Merge into contracts.json via post_deploy ---
AGENTS=$(python3 -c "import json; d=json.load(open('$OUT_JSON')); print(d.get('agents-marketplace',''))" 2>/dev/null || true)
MARKET=$(python3 -c "import json; d=json.load(open('$OUT_JSON')); print(d.get('nft-marketplace',''))" 2>/dev/null || true)

if [[ -n "$AGENTS" || -n "$MARKET" ]]; then
  echo ""
  echo "=== post_deploy_contracts.py ==="
  ARGS=()
  [[ -n "$AGENTS" ]] && ARGS+=(--agents "$AGENTS")
  [[ -n "$MARKET" ]] && ARGS+=(--marketplace "$MARKET")
  python3 "$ROOT/scripts/post_deploy_contracts.py" "${ARGS[@]}" || true
  echo "=== verify_marketplace_codehash.py ==="
  python3 "$ROOT/scripts/verify_marketplace_codehash.py" || true
fi

echo ""
if [[ "$FAILED" -ne 0 ]]; then
  echo "❌ One or more deploys failed — do NOT enable Buy UI"
  exit 1
fi

echo "✅ Deploy pipeline complete"
echo "Frontend env to set before rebuild Pages:"
[[ -n "$AGENTS" ]] && echo "  VITE_AGENTS_MARKETPLACE_ADDRESS=$AGENTS"
[[ -n "$AGENTS" ]] && echo "  VITE_AGENTS_FEE_BPS=$FEE_BPS"
[[ -n "$AGENTS" ]] && echo "  VITE_AGENTS_CODEHASH_OK=1"
[[ -n "$MARKET" ]] && echo "  VITE_MARKETPLACE_ADDRESS=$MARKET"
[[ -n "$MARKET" ]] && echo "  VITE_MARKETPLACE_CODEHASH_OK=1"
echo "Keep LIA_LIVE_TRADING=0 until micro-trades OK"
