#!/usr/bin/env bash
# Production readiness checklist — MultiversX base only
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== xArtists / LIA production checklist ==="
echo "Base layer: MultiversX mainnet (chain 1)"
echo ""

check() { printf "  [ ] %s\n" "$1"; }
ok() { printf "  [x] %s\n" "$1"; }

echo "-- Smart contracts --"
check "sc-meta build agents-marketplace + nft-marketplace"
check "simulate_deploy_mainnet.sh both contracts"
check "deploy_mainnet.sh + data/contracts.json addresses"
check "blackbox list/buy/cancel/claimFees (MAINNET_DEPLOY_BLACKBOX.md)"

echo "-- Frontend / dApp --"
check "VITE_AGENTS_MARKETPLACE_ADDRESS + NFT address set"
check "VITE_AGENTS_FEE_BPS=300"
check "npm run build (or pnpm) green"
check "GitHub Pages serves /agents fee split"

echo "-- LIA / Vellum --"
check "PEM only in Vellum secrets"
check "LIA_LIVE_TRADING=0 until gates green"
check "publish_data_for_frontend after cycle"
check "mvx_agent decision path in Orchestrator"

echo "-- Multichain policy --"
ok "MVX is settlement layer"
ok "Solana/HL/Soul signal-only until adapter + risk budget"
ok "Soul zk stubs present (soul_zk.py) — verifier null"

echo ""
echo "Machine map: data/LIA_MULTICHAIN.json"
echo "Architecture: docs/LIA_MULTICHAIN_PRODUCTION.md"
