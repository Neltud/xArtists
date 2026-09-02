#!/usr/bin/env bash
# Deploy hardened marketplaces to MultiversX MAINNET only.
# FEE_BPS=300 (3%). Never commits PEM. Writes data/contracts.json.
#
# Usage:
#   export PEM=/path/to/mainnet-wallet.pem
#   export FEE_BPS=300
#   ./scripts/deploy_mainnet.sh
#   ./scripts/deploy_mainnet.sh agents-marketplace
#   ./scripts/deploy_mainnet.sh nft-marketplace
#
# Vellum: LIA_WALLET_PEM / LIA_WALLET_PEM_PATH secret — same CHAIN=1.
# BTC bridge is NOT deployed.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

export CHAIN="${CHAIN:-1}"
export PROXY="${PROXY:-https://gateway.multiversx.com}"
export FEE_BPS="${FEE_BPS:-300}"
PEM="${PEM:-${LIA_WALLET_PEM_PATH:-}}"
ONLY="${1:-all}"

if [[ "$CHAIN" != "1" ]]; then
  echo "❌ This project path is MAINNET ONLY (CHAIN=1). Refusing CHAIN=$CHAIN"
  exit 1
fi

echo "Network: MAINNET (chain=$CHAIN proxy=$PROXY fee_bps=$FEE_BPS)"
echo "Bridge: NOT deployed (experimental — no user funds)"

if [[ -z "${PEM}" || ! -f "${PEM}" ]]; then
  echo "❌ Set PEM=/path/to/mainnet-wallet.pem (never commit)"
  echo "   Or LIA_WALLET_PEM_PATH for Vellum"
  exit 1
fi

"$ROOT/scripts/build_scs_isolated.sh" "$ONLY"
exec "$ROOT/scripts/deploy_all_scs.sh" "$ONLY"
