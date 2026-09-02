#!/usr/bin/env bash
# Fast + secure path to production cash features (mainnet only).
# Does NOT deploy without PEM. Fails closed.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export CHAIN="${CHAIN:-1}"
export FEE_BPS="${FEE_BPS:-300}"
export LIA_LIVE_TRADING="${LIA_LIVE_TRADING:-0}"
export PYTHONPATH="${PYTHONPATH:-.}"

echo "═══════════════════════════════════════════"
echo " xArtists GO-LIVE SECURE (mainnet)"
echo "═══════════════════════════════════════════"

if [[ "$CHAIN" != "1" ]]; then
  echo "❌ MAINNET ONLY"
  exit 1
fi

step() { echo ""; echo "── $1 ──"; }

step "1/7 Regression (paper stack)"
python3 tests/regression/run_all.py || {
  echo "❌ Fix regression before deploy"
  exit 2
}

step "2/7 Go-live gates (network)"
python3 -m lia.security.go_live_gates || true
python3 - <<'PY'
import json
from pathlib import Path
p = Path("data/go_live_gates.json")
if p.exists():
    d = json.loads(p.read_text())
    print("allow_product_claims_live:", d.get("allow_product_claims_live"))
    print("allow_live_trading:", d.get("allow_live_trading"))
    for r in d.get("results") or []:
        mark = "✅" if r.get("ok") else ("⛔" if r.get("critical") else "·")
        print(f"  {mark} {r.get('id')}: {r.get('detail')}")
PY

step "3/7 Oracle + dex mids refresh"
python3 -m lia.oracles.publish || echo "⚠️ oracle publish soft-fail"

step "4/7 Preflight deploy (PEM required for real deploy)"
if [[ -n "${PEM:-${LIA_WALLET_PEM_PATH:-}}" && -f "${PEM:-${LIA_WALLET_PEM_PATH:-}}" ]]; then
  export PEM="${PEM:-$LIA_WALLET_PEM_PATH}"
  bash scripts/preflight_deploy_mainnet.sh all
  echo ""
  echo "PEM OK → deploy (manual confirm):"
  echo "  FEE_BPS=$FEE_BPS PEM=\$PEM ./scripts/deploy_mainnet.sh agents-marketplace"
  echo "  FEE_BPS=$FEE_BPS PEM=\$PEM ./scripts/deploy_mainnet.sh nft-marketplace"
  echo "  python scripts/post_deploy_contracts.py --agents erd1... --marketplace erd1..."
  echo "  python scripts/post_deploy_verify.py --strict"
else
  echo "· PEM not set — deploy skipped (secure default)"
  echo "  export PEM=/path/mainnet.pem   # never commit"
fi

step "5/7 Post-deploy verify (current chain state)"
python3 scripts/post_deploy_verify.py || true

step "6/7 Swarm paper cycle (oracle-backed)"
LIA_LIVE_TRADING=0 python3 -m lia.agents.run_autonomous --mode integrated 2>/dev/null | head -40 || \
  LIA_LIVE_TRADING=0 python3 -m lia.agents.run_autonomous --mode swarm 2>/dev/null | head -40 || true

step "7/7 Security reminders"
cat <<'EOF'
  • Never commit PEM or JWT secrets
  • Do not send funds to empty marketplace address
  • User wallet ≠ LIA ops wallet
  • LIA_LIVE_TRADING=1 only after micro_proof_log has ≥1 success
  • FEE_BPS=300 · claimFees only owner after deploy
EOF

echo ""
echo "Done. Next = PEM + EGLD → deploy → post_deploy_verify --strict"
