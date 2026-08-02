#!/usr/bin/env bash
# Deploy Agents Marketplace only. Defaults: devnet + FEE_BPS=300.
# Usage: PEM=/path/to/wallet.pem ./scripts/deploy_agents_marketplace.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export CHAIN="${CHAIN:-D}"
export PROXY="${PROXY:-https://devnet-gateway.multiversx.com}"
export FEE_BPS="${FEE_BPS:-300}"
export PEM="${PEM:-${LIA_WALLET_PEM_PATH:-}}"
exec "$ROOT/scripts/deploy_devnet.sh" agents-marketplace
