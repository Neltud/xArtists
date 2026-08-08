#!/usr/bin/env bash
# Wrapper: full automated post-deploy verification.
# Exit 0 = green · 2 = critical fail (do not enable UI)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export CHAIN="${CHAIN:-1}"
export LIA_LIVE_TRADING="${LIA_LIVE_TRADING:-0}"

echo "╔════════════════════════════════════════════╗"
echo "║  Post-deploy verification (automated)      ║"
echo "╚════════════════════════════════════════════╝"

ARGS=("$@")
# Default: retry for API lag after fresh deploy
if [[ " $*" != *"--retry"* ]]; then
  ARGS+=(--retry "${POST_DEPLOY_RETRIES:-4}" --retry-wait "${POST_DEPLOY_RETRY_WAIT:-12}")
fi

set +e
python3 "$ROOT/scripts/post_deploy_verify.py" "${ARGS[@]}"
RC=$?
set -e

if [[ "$RC" -eq 0 ]]; then
  echo ""
  echo "Next:"
  echo "  1. Paste VITE_* from apps/frontend/.env.mainnet.example into deploy-pages.yml"
  echo "  2. git add data/*.json && git commit && git push"
  echo "  3. Micro List/Buy with USER wallet"
  echo "  4. LIA_LIVE_TRADING=0 until micro OK"
elif [[ "$RC" -eq 2 ]]; then
  echo ""
  echo "Critical fail — re-deploy or fix addresses before UI"
fi

exit "$RC"
