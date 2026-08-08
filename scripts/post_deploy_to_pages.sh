#!/usr/bin/env bash
# After SC deploy: verify codehash → generate VITE → print rebuild steps.
# Does not push Pages by itself (needs git commit of contracts.json).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== 1. Verify codeHash ==="
python3 scripts/verify_marketplace_codehash.py "$@" || true

echo ""
echo "=== 2. Generate VITE example ==="
python3 scripts/generate_vite_env.py

echo ""
echo "=== 3. Next human/CI steps ==="
cat <<'EOF'
1. Confirm marketplace + agents verdict LIVE in data/marketplace_codehash_live.json
2. Paste VITE_* from apps/frontend/.env.mainnet.example into:
   - .github/workflows/deploy-pages.yml env:
   - or GitHub Actions secrets / vars
3. git add data/contracts.json data/marketplace_codehash_live.json
   git commit -m "ops: post-deploy contracts + codehash"
   git push  # triggers Pages rebuild
4. Micro List/Buy with USER wallet only (never LIA ops address in session)
5. Keep LIA_LIVE_TRADING=0 until micro-trades OK
EOF
