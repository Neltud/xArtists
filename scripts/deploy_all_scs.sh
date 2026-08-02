#!/usr/bin/env bash
# Deploy xArtists smart contracts — MAINNET ONLY (CHAIN=1).
# Prefer: ./scripts/simulate_deploy_mainnet.sh first, then set GAS_LIMIT.
#
# Usage:
#   export PEM=~/wallets/deployer.pem
#   export FEE_BPS=300
#   export GAS_LIMIT=200000000   # or exact from simulate
#   ./scripts/deploy_mainnet.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PEM="${PEM:-${LIA_WALLET_PEM_PATH:-}}"
CHAIN="${CHAIN:-1}"
PROXY="${PROXY:-https://gateway.multiversx.com}"
FEE_BPS="${FEE_BPS:-300}"
# 80M is often too low once wasm > ~50KB (data gas). Default 200M; max network 600M.
GAS_LIMIT="${GAS_LIMIT:-200000000}"

if [[ "$CHAIN" != "1" ]]; then
  echo "❌ MAINNET ONLY. Set CHAIN=1 (got CHAIN=$CHAIN)"
  exit 1
fi

if [[ -z "${PEM}" || ! -f "${PEM}" ]]; then
  echo "❌ Set PEM=/path/to/wallet.pem (never commit this file)"
  exit 1
fi

if ! command -v mxpy >/dev/null 2>&1; then
  echo "❌ mxpy not found. Install: pip install multiversx-sdk-cli"
  exit 1
fi

ONLY="${1:-all}"
OUT_JSON="$ROOT/data/contracts.deployed.json"
echo "{}" > "$OUT_JSON.tmp"

deploy_one() {
  local name="$1"
  local dir="$ROOT/contracts/$name"
  local fee_arg="$2"

  if [[ ! -d "$dir" ]]; then
    echo "Skip $name (no directory)"
    return
  fi

  echo ""
  echo "======== BUILD $name (isolated cd) ========"
  cd "$dir"
  if command -v sc-meta >/dev/null 2>&1; then
    sc-meta all build || mxpy contract build || true
  fi
  mxpy contract build 2>/dev/null || sc-meta all build || {
    echo "Build failed for $name"
    return 1
  }

  local WASM
  WASM=$(find output -name "*.wasm" 2>/dev/null | head -1 || true)
  if [[ -z "$WASM" ]]; then
    echo "No wasm for $name"
    return 1
  fi
  echo "WASM $(wc -c < "$WASM") bytes | gas-limit=$GAS_LIMIT"

  echo "======== DEPLOY $name (fee_bps=$fee_arg MAINNET) ========"
  local LOG
  LOG=$(mxpy contract deploy \
    --bytecode "$WASM" \
    --pem "$PEM" \
    --proxy "$PROXY" \
    --chain "$CHAIN" \
    --gas-limit "$GAS_LIMIT" \
    --arguments "$fee_arg" \
    --recall-nonce \
    --send 2>&1) || true

  echo "$LOG"
  local ADDR
  ADDR=$(echo "$LOG" | grep -oE 'erd1qqqqqqqqqqqqqpgq[a-z0-9]+' | head -1 || true)
  if [[ -z "$ADDR" ]]; then
    ADDR=$(echo "$LOG" | grep -oE 'erd1[a-z0-9]{58}' | head -1 || true)
  fi

  if [[ -n "$ADDR" ]]; then
    echo "✅ $name → $ADDR"
    python3 - <<PY
import json, pathlib
p = pathlib.Path("$OUT_JSON.tmp")
d = json.loads(p.read_text()) if p.exists() else {}
d["$name"] = "$ADDR"
p.write_text(json.dumps(d, indent=2))
PY
  else
    echo "⚠️  Could not parse address for $name — check log above"
  fi
}

if [[ "$ONLY" == "all" || "$ONLY" == "nft-marketplace" ]]; then
  deploy_one "nft-marketplace" "$FEE_BPS"
fi
if [[ "$ONLY" == "all" || "$ONLY" == "agents-marketplace" ]]; then
  deploy_one "agents-marketplace" "$FEE_BPS"
fi

python3 - <<PY
import json, pathlib, datetime
root = pathlib.Path("$ROOT")
tmp = root / "data" / "contracts.deployed.json.tmp"
deployed = json.loads(tmp.read_text()) if tmp.exists() else {}
path = root / "data" / "contracts.json"
base = {}
if path.exists():
    try:
        base = json.loads(path.read_text())
    except Exception:
        base = {}
base.update(deployed)
base["updated"] = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
base["chain"] = "1"
base["network"] = "mainnet"
base["fee_bps"] = int("$FEE_BPS")
if "nft-marketplace" in deployed:
    base["marketplace_nft"] = deployed["nft-marketplace"]
    base["nft-marketplace"] = deployed["nft-marketplace"]
if "agents-marketplace" in deployed:
    base["agents_marketplace"] = deployed["agents-marketplace"]
    base["agents-marketplace"] = deployed["agents-marketplace"]
path.write_text(json.dumps(base, indent=2) + "\n")
print("Wrote", path)
print(json.dumps(base, indent=2))
PY

rm -f "$OUT_JSON.tmp"
echo ""
echo "Next (MAINNET): docs/MAINNET_DEPLOY_BLACKBOX.md"
