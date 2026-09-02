#!/usr/bin/env bash
# After SC deploy: verify codehash → generate VITE → print rebuild steps.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== 0. Regression (offline, non-blocking soft) ==="
if [[ -f "$ROOT/scripts/run_regression.sh" ]]; then
  set +e
  LIA_LIVE_TRADING=0 bash "$ROOT/scripts/run_regression.sh"
  REG=$?
  set -e
  if [[ "$REG" -ne 0 ]]; then
    echo "WARN regression failed — continue verify but fix before production UI"
  fi
fi

echo ""
echo "=== 1. Automated post-deploy verify ==="
bash "$ROOT/scripts/post_deploy_verify.sh" "$@" || true

echo ""
echo "=== 2. Generate VITE example ==="
python3 scripts/generate_vite_env.py 2>/dev/null || true

echo ""
echo "=== 3. Next human/CI steps ==="
cat <<'EOF'
1. Confirm all_ok in data/post_deploy_report.json / marketplace_codehash_live.json
2. Paste VITE_* into deploy-pages.yml
3. git add data/ && git commit && git push
4. Micro List/Buy USER wallet only
5. Keep LIA_LIVE_TRADING=0 until micro-trades OK
EOF
