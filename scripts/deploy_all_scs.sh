#!/usr/bin/env bash
# Deploy xArtists smart contracts (mainnet)
#
# Prerequisites:
#   - mxpy installed (pip install multiversx-sdk-cli)
#   - rust + wasm32 target (mxpy contract build uses docker or local)
#   - PEM wallet with EGLD for gas
#
# Usage:
#   export PEM=~/wallets/deployer.pem
#   export CHAIN=1          # 1=mainnet, D=devnet, T=testnet
#   export PROXY=https://gateway.multiversx.com
#   ./scripts/deploy_all_scs.sh
#
# Optional: deploy only one contract
#   ./scripts/deploy_all_scs.sh nft-marketplace
#   ./scripts/deploy_all_scs.sh agents-marketplace

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PEM="${PEM:-${LIA_WALLET_PEM_PATH:-}}"
CHAIN="${CHAIN:-1}"
PROXY="${PROXY:-https://gateway.multiversx.com}"
FEE_BPS="${FEE_BPS:-300}"   # 3% marketplace fee default

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
  echo "======== BUILD $name ========"
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

  echo "======== DEPLOY $name (fee_bps=$fee_arg) ========"
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
    # merge into json with python
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

# finalize contracts.json
python3 - <<PY
import json, pathlib, datetime
root = pathlib.Path("$ROOT")
deployed = json.loads((root / "data" / "contracts.deployed.json.tmp").read_text())
path = root / "data" / "contracts.json"
base = {}
if path.exists():
    base = json.loads(path.read_text())
base.update(deployed)
base["updated"] = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
base["chain"] = "$CHAIN"
if "nft-marketplace" in deployed:
    base["marketplace_nft"] = deployed["nft-marketplace"]
if "agents-marketplace" in deployed:
    base["agents_marketplace"] = deployed["agents-marketplace"]
path.write_text(json.dumps(base, indent=2))
print("Wrote", path)
print(json.dumps(base, indent=2))
PY

rm -f "$OUT_JSON.tmp"
echo ""
echo "Next:"
echo "  1. git add data/contracts.json && git commit -m 'chore: deployed SC addresses' && git push"
echo "  2. Set VITE_MARKETPLACE_ADDRESS=<nft-marketplace erd1...>"
echo "  3. Verify on https://explorer.multiversx.com"
