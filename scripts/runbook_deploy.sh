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
#
# Env: FEE_BPS=300 CHAIN=1 ONLY=all|agents-marketplace|nft-marketplace
#      GAS_LIMIT_OVERRIDE=... MAX_RETRIES=2

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
  deploy  Real mainnet deploy (requires dry OK + PEM + RUN path)
  verify  codeHash check + generate VITE example
  all     dry → deploy → verify (stops on first failure)

Required: PEM=/path/to.pem   CHAIN=1   FEE_BPS=300
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
  [[ "$LIA_LIVE_TRADING" == "0" ]] || log "WARN: LIA_LIVE_TRADING should stay 0 during SC deploy"
  export RUN_DEPLOY=1
  "$ROOT/scripts/deploy_optimized_mainnet.sh"
  log "deploy finished — next: ./scripts/runbook_deploy.sh verify"
}

phase_verify() {
  log "═══ PHASE verify ═══"
  python3 "$ROOT/scripts/verify_marketplace_codehash.py" || true
  python3 "$ROOT/scripts/generate_vite_env.py"
  if [[ -x "$ROOT/scripts/post_deploy_to_pages.sh" ]] || [[ -f "$ROOT/scripts/post_deploy_to_pages.sh" ]]; then
    bash "$ROOT/scripts/post_deploy_to_pages.sh" || true
  fi

  local LIVE="$ROOT/data/marketplace_codehash_live.json"
  if [[ -f "$LIVE" ]]; then
    python3 - <<'PY'
import json, sys
from pathlib import Path
p = Path("data/marketplace_codehash_live.json")
d = json.loads(p.read_text())
ok = d.get("all_ok")
print("all_ok =", ok)
if not ok:
    m = d.get("marketplace") or {}
    a = d.get("agents_marketplace") or {}
    print("marketplace:", m.get("verdict"), m.get("codeHash"))
    print("agents:    ", a.get("verdict"), a.get("codeHash"))
    sys.exit(2)
print("SUCCESS — inject VITE_* into deploy-pages.yml and push Pages")
print("Micro List/Buy with USER wallet only (never LIA ops)")
print("Keep LIA_LIVE_TRADING=0 until micro-trades OK")
PY
  else
    fail "missing $LIVE — run deploy first"
  fi
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
