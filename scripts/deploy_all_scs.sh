#!/usr/bin/env bash
# Deploy xArtists smart contracts (devnet-first recommended).
#
# Prerequisites:
#   - mxpy (pip install multiversx-sdk-cli)
#   - PEM with EGLD for gas (devnet faucet OK)
#
# Usage:
#   export PEM=~/wallets/deployer.pem
#   export CHAIN=D
#   export PROXY=https://devnet-gateway.multiversx.com
#   export FEE_BPS=300
#   ./scripts/deploy_all_scs.sh
#   ./scripts/deploy_all_scs.sh agents-marketplace
#
# Prefer: ./scripts/deploy_devnet.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PEM="${PEM:-${LIA_WALLET_PEM_PATH:-}}"
CHAIN="${CHAIN:-D}"
PROXY="${PROXY:-https://devnet-gateway.multiversx.com}"
FEE_BPS="${FEE_BPS:-300}"

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
  mxpy contract build || {
    echo "Build failed for $name"
    return 1
  }

  local WASM
  WASM=$(find output -name "*.wasm" 2>/dev/null | head -1 || true)
  if [[ -z "$WASM" ]]; then
    echo "No wasm for $name"
    return 1
  fi

  echo "======== DEPLOY $name (fee_bps=$fee_arg chain=$CHAIN) ========"
  local LOG
  LOG=$(mxpy contract deploy \
    --bytecode "$WASM" \
    --pem "$PEM" \
    --proxy "$PROXY" \
    --chain "$CHAIN" \
    --gas-limit 80000000 \
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
base["chain"] = "$CHAIN"
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
echo "Next:"
echo "  1. Run blackbox checklist: docs/DEVNET_DEPLOY_BLACKBOX.md"
echo "  2. git add data/contracts.json && commit (addresses only)"
echo "  3. VITE_AGENTS_MARKETPLACE_ADDRESS=... VITE_AGENTS_FEE_BPS=$FEE_BPS"
echo "  4. Explorer: https://devnet-explorer.multiversx.com"
