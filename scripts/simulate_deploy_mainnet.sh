#!/usr/bin/env bash
# Dry-run style preflight for mainnet deploy (no send if mxpy lacks --simulate).
# Prints gas guidance and refuses non-mainnet.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export CHAIN="${CHAIN:-1}"
export PROXY="${PROXY:-https://gateway.multiversx.com}"
export FEE_BPS="${FEE_BPS:-300}"
export GAS_LIMIT="${GAS_LIMIT:-200000000}"

if [[ "$CHAIN" != "1" ]]; then
  echo "❌ MAINNET ONLY"
  exit 1
fi

echo "=== Simulate / preflight MAINNET ==="
echo "proxy=$PROXY fee_bps=$FEE_BPS gas_limit=$GAS_LIMIT"
echo "1. Build: $ROOT/scripts/build_scs_isolated.sh"
echo "2. Ensure PEM funded (issue fee 0.05 EGLD + deploy gas buffer)"
echo "3. Deploy: ./scripts/deploy_mainnet.sh agents-marketplace"
echo "4. Deploy: ./scripts/deploy_mainnet.sh nft-marketplace"
echo "5. Blackbox: docs/MAINNET_DEPLOY_BLACKBOX.md"
echo "6. python scripts/post_deploy_contracts.py --agents erd1... --marketplace erd1..."
echo "=== Recommended GAS_LIMIT agents/nft: 200000000–600000000 ==="
