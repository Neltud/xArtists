#!/usr/bin/env bash
# Canonical deploy runbook orchestrator — MAINNET only.
# Phases: dry | deploy | verify | all
#
# Usage:
#   export PEM=/path/mainnet.pem
#   ./scripts/runbook_deploy.sh dry
#   ./scripts/runbook_deploy.sh deploy
#   ./scripts/runbook_deploy.sh verify
#   ./scripts/runbook_deploy.sh all

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PHASE="${1:-}"
export CHAIN="${CHAIN:-1}"
export FEE_BPS="${FEE_BPS:-300}"
export LIA_LIVE_TRADING="${LIA_LIVE_TRADING:-0}"
export ONLY="${ONLY:-all}"
PEM="${PEM:-${LIA_WALLET_PEM_PATH:-}}"

ts() { date -u +%Y-%m-%dT%H:%M:%SZ; }
log() { echo "[$(ts)] $*"; }
fail() { log "ERROR: $*"; exit 1; }

usage() {
  cat <<'EOF'
Usage: ./scripts/runbook_deploy.sh <dry|deploy|verify|all>

  dry     Preflight: build wasm, gas estimate, balance — no txs
  deploy  Real mainnet deploy
  verify  Automated post-deploy checks (codeHash, consistency, VITE)
  all     dry → deploy → verify

Required: PEM=/path/to.pem  CHAIN=1  FEE_BPS=300
Docs: docs/RUNBOOK_DEPLOY.md
EOF
}

require_mainnet() {
  [[ "$CHAIN" == "1" ]] || fail "MAINNET ONLY (CHAIN=1), got CHAIN=$CHAIN"
}

require_pem() {
  [[ -n "$PEM" && -f "$PEM" ]] || fail "Set PEM=/path/to/mainnet.pem"
  export PEM
}

phase_dry() {
  log "═══ PHASE dry (0 tx) ═══"
  require_mainnet
  require_pem
  "$ROOT/scripts/preflight_deploy_mainnet.sh" "$ONLY"
  log "dry OK — next: ./scripts/runbook_deploy.sh deploy"
}

phase_deploy() {
  log "═══ PHASE deploy (sends txs) ═══"
  require_mainnet
  require_pem
  [[ "$LIA_LIVE_TRADING" == "0" ]] || log "WARN: LIA_LIVE_TRADING should stay 0"
  export RUN_DEPLOY=1
  "$ROOT/scripts/deploy_optimized_mainnet.sh"
  log "deploy finished — next: ./scripts/runbook_deploy.sh verify"
}

phase_verify() {
  log "═══ PHASE verify (automated) ═══"
  # Full automated suite with API lag retries
  set +e
  bash "$ROOT/scripts/post_deploy_verify.sh" --query-views
  RC=$?
  set -e
  if [[ "$RC" -eq 0 ]]; then
    log "verify PASS — inject VITE_* and rebuild Pages"
    log "Micro List/Buy with USER wallet only"
    return 0
  fi
  log "verify exit=$RC — see data/post_deploy_report.json"
  return "$RC"
}

case "$PHASE" in
  dry) phase_dry ;;
  deploy) phase_deploy ;;
  verify) phase_verify ;;
  all)
    phase_dry
    phase_deploy
    phase_verify
    ;;
  -h|--help|help|"")
    usage
    exit 0
    ;;
  *)
    usage
    fail "unknown phase: $PHASE"
    ;;
esac
