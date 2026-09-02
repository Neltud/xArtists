#!/usr/bin/env bash
# Deploy xArtists smart contracts — MAINNET ONLY (CHAIN=1).
# Fail-fast error handling: no silent success, no fake addresses.
#
# Usage:
#   export PEM=~/wallets/deployer.pem
#   export FEE_BPS=300
#   export GAS_LIMIT=200000000   # from simulate_deploy_mainnet.sh
#   ./scripts/deploy_mainnet.sh [agents-marketplace|nft-marketplace|all]

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PEM="${PEM:-${LIA_WALLET_PEM_PATH:-}}"
CHAIN="${CHAIN:-1}"
PROXY="${PROXY:-https://gateway.multiversx.com}"
API="${API:-https://api.multiversx.com}"
FEE_BPS="${FEE_BPS:-300}"
GAS_LIMIT="${GAS_LIMIT:-200000000}"
MAX_RETRIES="${MAX_RETRIES:-2}"

redact() { echo "$1" | sed -E 's/-----BEGIN[^-]*-----.*-----END[^-]*-----/[PEM_REDACTED]/g'; }

if [[ "$CHAIN" != "1" ]]; then
  echo "❌ MAINNET ONLY. Set CHAIN=1 (got CHAIN=$CHAIN)"
  exit 1
fi

if [[ -z "${PEM}" || ! -f "${PEM}" ]]; then
  echo "❌ Set PEM=/path/to/wallet.pem (file must exist; never commit)"
  exit 1
fi

if ! command -v mxpy >/dev/null 2>&1; then
  echo "❌ mxpy not found. Install: pip install -U multiversx-sdk-cli"
  exit 1
fi

if [[ "$FEE_BPS" -gt 1000 ]]; then
  echo "❌ FEE_BPS=$FEE_BPS exceeds SC max 1000 (10%)"
  exit 1
fi

if [[ "$GAS_LIMIT" -gt 600000000 ]]; then
  echo "❌ GAS_LIMIT=$GAS_LIMIT exceeds network max 600000000"
  exit 1
fi

if [[ "$GAS_LIMIT" -lt 50000000 ]]; then
  echo "⚠️  GAS_LIMIT=$GAS_LIMIT is very low for SC deploy (wasm data gas)"
fi

ONLY="${1:-all}"
OUT_JSON="$ROOT/data/contracts.deployed.json"
echo "{}" > "$OUT_JSON.tmp"
FAILED=0

deploy_one() {
  local name="$1"
  local dir="$ROOT/contracts/$name"
  local fee_arg="$2"

  if [[ ! -d "$dir" ]]; then
    echo "❌ Skip $name — directory missing: $dir"
    FAILED=1
    return 1
  fi

  echo ""
  echo "======== BUILD $name ========"
  cd "$dir"

  local build_ok=0
  if command -v sc-meta >/dev/null 2>&1; then
    if sc-meta all build; then build_ok=1; fi
  fi
  if [[ "$build_ok" -eq 0 ]]; then
    if mxpy contract build; then build_ok=1; fi
  fi
  if [[ "$build_ok" -eq 0 ]]; then
    echo "❌ BUILD FAILED for $name — fix Rust/sc-meta (see docs/DEPLOY_ERRORS.md)"
    FAILED=1
    return 1
  fi

  local WASM
  WASM=$(find output -name "*.wasm" 2>/dev/null | head -1 || true)
  if [[ -z "$WASM" || ! -f "$WASM" ]]; then
    echo "❌ No wasm artifact in $dir/output after build"
    FAILED=1
    return 1
  fi

  local BYTES
  BYTES=$(wc -c < "$WASM")
  echo "WASM: $WASM ($BYTES bytes) | gas-limit=$GAS_LIMIT | fee_bps=$fee_arg"

  # Warn if gas likely insufficient for data component alone
  python3 - "$BYTES" "$GAS_LIMIT" <<'PY' || true
import sys
bytes, gas_limit = int(sys.argv[1]), int(sys.argv[2])
data_gas = 50_000 + 1500 * bytes
if data_gas > gas_limit:
    print(f"❌ GAS_LIMIT {gas_limit} < estimated data gas {data_gas} — abort deploy")
    sys.exit(2)
if data_gas > gas_limit * 0.85:
    print(f"⚠️  GAS_LIMIT close to data gas ({data_gas}) — consider higher limit")
PY
  if [[ $? -eq 2 ]]; then
    FAILED=1
    return 1
  fi

  echo "======== DEPLOY $name (MAINNET) ========"
  local attempt=1
  local LOG=""
  local ADDR=""
  local TXHASH=""

  while [[ "$attempt" -le "$MAX_RETRIES" ]]; do
    echo "Attempt $attempt/$MAX_RETRIES..."
    set +e
    LOG=$(mxpy contract deploy \
      --bytecode "$WASM" \
      --pem "$PEM" \
      --proxy "$PROXY" \
      --chain "$CHAIN" \
      --gas-limit "$GAS_LIMIT" \
      --arguments "$fee_arg" \
      --recall-nonce \
      --send 2>&1)
    local RC=$?
    set -e

    # Never print PEM if mxpy echoes paths only — still redact PEMs if any
    echo "$(redact "$LOG")"

    TXHASH=$(echo "$LOG" | grep -oE '[a-f0-9]{64}' | head -1 || true)
    ADDR=$(echo "$LOG" | grep -oE 'erd1qqqqqqqqqqqqqpgq[a-z0-9]+' | head -1 || true)
    if [[ -z "$ADDR" ]]; then
      ADDR=$(echo "$LOG" | grep -oE 'erd1[a-z0-9]{58}' | head -1 || true)
    fi

    if echo "$LOG" | grep -qiE 'insufficient funds|not enough|balance'; then
      echo "❌ INSUFFICIENT FUNDS — top up mainnet EGLD then retry"
      FAILED=1
      return 1
    fi
    if echo "$LOG" | grep -qiE 'out of gas|gas limit exceeded|gasLimit'; then
      echo "❌ GAS ERROR — run simulate_deploy_mainnet.sh and raise GAS_LIMIT (max 600000000)"
      FAILED=1
      return 1
    fi
    if echo "$LOG" | grep -qiE 'invalid chain|wrong chain|chainID'; then
      echo "❌ CHAIN ERROR — must use CHAIN=1 and mainnet proxy"
      FAILED=1
      return 1
    fi

    if [[ -n "$ADDR" ]]; then
      echo "✅ $name → $ADDR"
      [[ -n "$TXHASH" ]] && echo "   tx: $TXHASH"
      python3 - <<PY
import json, pathlib
p = pathlib.Path("$OUT_JSON.tmp")
d = json.loads(p.read_text()) if p.exists() else {}
d["$name"] = "$ADDR"
if "$TXHASH":
    d["${name}_tx"] = "$TXHASH"
p.write_text(json.dumps(d, indent=2))
PY
      return 0
    fi

    # Retry only on transient gateway issues
    if echo "$LOG" | grep -qiE 'timeout|temporar|connection|502|503|504' && [[ "$attempt" -lt "$MAX_RETRIES" ]]; then
      echo "⚠️  Gateway transient error — wait 20s and retry"
      sleep 20
      attempt=$((attempt + 1))
      continue
    fi

    echo "❌ DEPLOY FAILED for $name (no contract address parsed, rc=$RC)"
    echo "   See docs/DEPLOY_ERRORS.md"
    FAILED=1
    return 1
  done

  FAILED=1
  return 1
}

if [[ "$ONLY" == "all" || "$ONLY" == "nft-marketplace" ]]; then
  deploy_one "nft-marketplace" "$FEE_BPS" || true
fi
if [[ "$ONLY" == "all" || "$ONLY" == "agents-marketplace" ]]; then
  deploy_one "agents-marketplace" "$FEE_BPS" || true
fi

python3 - <<PY
import json, pathlib, datetime, sys
root = pathlib.Path("$ROOT")
tmp = root / "data" / "contracts.deployed.json.tmp"
deployed = json.loads(tmp.read_text()) if tmp.exists() else {}
# Only merge real addresses (erd1...)
clean = {k: v for k, v in deployed.items() if isinstance(v, str) and v.startswith("erd1")}
if not clean:
    print("⚠️  No successful addresses to write — contracts.json unchanged")
    sys.exit(0)
path = root / "data" / "contracts.json"
base = {}
if path.exists():
    try:
        base = json.loads(path.read_text())
    except Exception:
        base = {}
base.update(deployed)
base.update(clean)
base["updated"] = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
base["chain"] = "1"
base["network"] = "mainnet"
base["fee_bps"] = int("$FEE_BPS")
if "nft-marketplace" in clean:
    base["marketplace_nft"] = clean["nft-marketplace"]
if "agents-marketplace" in clean:
    base["agents_marketplace"] = clean["agents-marketplace"]
path.write_text(json.dumps(base, indent=2) + "\n")
print("Wrote", path)
print(json.dumps({k: base[k] for k in base if "pem" not in k.lower()}, indent=2))
PY

rm -f "$OUT_JSON.tmp"

if [[ "$FAILED" -ne 0 ]]; then
  echo ""
  echo "❌ One or more deploys failed. Do not point frontend at missing addresses."
  echo "   Guide: docs/DEPLOY_ERRORS.md"
  exit 1
fi

echo ""
echo "✅ Deploy finished. Next: docs/MAINNET_DEPLOY_BLACKBOX.md"
