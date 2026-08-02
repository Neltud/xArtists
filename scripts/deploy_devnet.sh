#!/usr/bin/env bash
# Deploy hardened marketplaces to MultiversX DEVNET (default).
# Never commits PEM. Writes addresses to data/contracts.json.
#
# Usage:
#   export PEM=/path/to/wallet.pem
#   export FEE_BPS=300
#   ./scripts/deploy_devnet.sh
#   ./scripts/deploy_devnet.sh agents-marketplace
#   ./scripts/deploy_devnet.sh nft-marketplace
#
# Vellum: mount PEM as LIA_WALLET_PEM_PATH or pass LIA_WALLET_PEM text via deploy node.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

export CHAIN="${CHAIN:-D}"
export PROXY="${PROXY:-https://devnet-gateway.multiversx.com}"
export FEE_BPS="${FEE_BPS:-300}"
PEM="${PEM:-${LIA_WALLET_PEM_PATH:-}}"
ONLY="${1:-all}"

echo "Network: DEVNET (chain=$CHAIN proxy=$PROXY fee_bps=$FEE_BPS)"
echo "Bridge: NOT deployed (experimental — no user funds)"

if [[ -z "${PEM}" || ! -f "${PEM}" ]]; then
  echo "❌ Set PEM=/path/to/wallet.pem (file must exist; never commit)"
  echo "   Or LIA_WALLET_PEM_PATH for Vellum runner"
  exit 1
fi

# Build isolated first
"$ROOT/scripts/build_scs_isolated.sh" "$ONLY"

# Reuse deploy_all_scs with env already set to devnet
exec "$ROOT/scripts/deploy_all_scs.sh" "$ONLY"
