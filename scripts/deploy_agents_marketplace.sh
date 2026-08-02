#!/usr/bin/env bash
# Deploy Agents Marketplace on MAINNET only. FEE_BPS=300.
# Usage: PEM=/path/to/wallet.pem ./scripts/deploy_agents_marketplace.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export CHAIN="${CHAIN:-1}"
export PROXY="${PROXY:-https://gateway.multiversx.com}"
export FEE_BPS="${FEE_BPS:-300}"
export PEM="${PEM:-${LIA_WALLET_PEM_PATH:-}}"
exec "$ROOT/scripts/deploy_mainnet.sh" agents-marketplace
