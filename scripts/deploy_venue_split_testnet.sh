#!/usr/bin/env bash
# Deploy venue-split on MultiversX DEVNET (test) — not mainnet.
# Usage:
#   export SC_DEPLOYER_PEM=/path/to/deployer.pem
#   export INSTITUTION_ADDR=erd1...
#   export ASSOCIATIONS_ADDR=erd1...
#   export LIA_TREASURY_ADDR=erd1...
#   export HOLDERS_POOL_ADDR=erd1...
#   ./scripts/deploy_venue_split_testnet.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONTRACT="$ROOT/contracts/venue_split"
CHAIN="${CHAIN:-D}"
PROXY="${PROXY:-https://devnet-gateway.multiversx.com}"

if [[ -z "${SC_DEPLOYER_PEM:-}" ]]; then
  echo "❌ SC_DEPLOYER_PEM required"
  exit 1
fi
for v in INSTITUTION_ADDR ASSOCIATIONS_ADDR LIA_TREASURY_ADDR HOLDERS_POOL_ADDR; do
  if [[ -z "${!v:-}" ]]; then
    echo "❌ $v required"
    exit 1
  fi
done

if ! command -v mxpy >/dev/null 2>&1; then
  echo "❌ mxpy not found — install MultiversX SDK"
  exit 1
fi

echo "→ Building venue-split…"
cd "$CONTRACT"
mxpy contract build || {
  echo "⚠️  mxpy contract build failed — ensure multiversx-sc toolchain"
  exit 1
}

WASM="$(find output -name '*.wasm' 2>/dev/null | head -1)"
if [[ -z "$WASM" ]]; then
  echo "❌ no wasm in output/"
  exit 1
fi

echo "→ Deploy DEVNET chain=$CHAIN proxy=$PROXY"
mxpy contract deploy \
  --bytecode="$WASM" \
  --pem="$SC_DEPLOYER_PEM" \
  --gas-limit=60000000 \
  --proxy="$PROXY" \
  --chain="$CHAIN" \
  --arguments \
    addr:"$INSTITUTION_ADDR" \
    addr:"$ASSOCIATIONS_ADDR" \
    addr:"$LIA_TREASURY_ADDR" \
    addr:"$HOLDERS_POOL_ADDR" \
  --send \
  --recall-nonce

echo "✅ Deploy submitted. Verify on devnet explorer, record codeHash."
echo "   Do NOT set VITE_VENUE_CODEHASH_OK until verified."
