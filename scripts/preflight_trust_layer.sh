#!/usr/bin/env bash
# Pre-Flight Trust Layer — P0 deploy/codehash + P0 treasury schema + P1 paper router
# NO real money movement unless you explicitly run deploy with PEM.
#
# Usage:
#   ./scripts/preflight_trust_layer.sh              # all phases (0 txs)
#   ./scripts/preflight_trust_layer.sh codehash     # local wasm fingerprints
#   ./scripts/preflight_trust_layer.sh verify-live  # API mainnet codeHash
#   ./scripts/preflight_trust_layer.sh treasury     # print wallet template
#   ./scripts/preflight_trust_layer.sh paper        # multi-capital simulation
#   ./scripts/preflight_trust_layer.sh dry-deploy   # build+gas+balance (needs PEM)
#
# Real deploy (money/gas): PEM=... ./scripts/runbook_deploy.sh all

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PHASE="${1:-all}"

ts() { date -u +%Y-%m-%dT%H:%M:%SZ; }
log() { echo "[$(ts)] $*"; }

phase_codehash() {
  log "═══ TASK 1a — Local wasm codeHash (SHA-256) ═══"
  python3 "$ROOT/scripts/codehash_protocol.py" \
    --contract nft-marketplace \
    --contract agents-marketplace || log "WARN: wasm missing — run ./scripts/build_scs_isolated.sh first"
  log "Manifest: data/codehash_manifest.json"
}

phase_verify_live() {
  log "═══ TASK 1b — Live mainnet codeHash (API) ═══"
  set +e
  python3 "$ROOT/scripts/verify_marketplace_codehash.py"
  RC=$?
  set -e
  log "Exit=$RC (2 = not live yet — expected until deploy). Report: data/marketplace_codehash_live.json"
  return 0
}

phase_treasury() {
  log "═══ TASK 2 — Treasury 4-slot schema ═══"
  python3 "$ROOT/scripts/init_treasury_schema.py"
  log "JSON: data/treasury_wallets.json"
  log "Create Mission/Reserve/Reward offline:"
  log "  mxpy wallet new --format pem --outfile mission.pem"
  log "  mxpy wallet new --format pem --outfile reserve.pem"
  log "  mxpy wallet new --format pem --outfile reward.pem"
  log "  python scripts/set_treasury_wallets.py --mission erd1… --reserve erd1… --reward erd1…"
}

phase_paper() {
  log "═══ TASK 3 — Paper multi-capital router + ledger ═══"
  python3 "$ROOT/scripts/simulate_multi_capital_ledger.py"
  log "Ledger: data/simulated_ledger.json"
}

phase_dry_deploy() {
  log "═══ TASK 1c — Dry deploy preflight (0 txs) ═══"
  if [[ -z "${PEM:-}" || ! -f "${PEM:-}" ]]; then
    log "Skip dry-deploy: set PEM=/path/mainnet.pem"
    return 0
  fi
  export CHAIN=1 FEE_BPS="${FEE_BPS:-300}" LIA_LIVE_TRADING=0
  "$ROOT/scripts/runbook_deploy.sh" dry
}

case "$PHASE" in
  codehash) phase_codehash ;;
  verify-live) phase_verify_live ;;
  treasury) phase_treasury ;;
  paper) phase_paper ;;
  dry-deploy) phase_dry_deploy ;;
  all)
    phase_codehash
    phase_verify_live
    phase_treasury
    phase_paper
    phase_dry_deploy
    log "═══ PRE-FLIGHT SUMMARY ═══"
    log "Next real deploy: PEM=… FEE_BPS=300 ./scripts/runbook_deploy.sh all"
    log "Then: rebuild Pages with VITE_*_CODEHASH_OK=1 only if verify all_ok"
    log "LIA_LIVE_TRADING=0 until micro List/Buy user OK"
    ;;
  *)
    echo "Usage: $0 [all|codehash|verify-live|treasury|paper|dry-deploy]"
    exit 1
    ;;
esac
