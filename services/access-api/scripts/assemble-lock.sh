#!/usr/bin/env bash
# Optional: materialize full lock from artifact when available locally.
# CI uses: npm install --no-package-lock (see paybox-p0-review.yml)
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ -f package-lock.FULL.json ]]; then
  cp package-lock.FULL.json package-lock.json
  echo "using package-lock.FULL.json"
elif [[ -f ../../artifacts/access-api-package-lock-FULL-npmjs.json ]]; then
  cp ../../artifacts/access-api-package-lock-FULL-npmjs.json package-lock.json
  echo "using artifacts full lock"
else
  echo "no full lock artifact; run: npm install --package-lock-only"
  npm install --package-lock-only --ignore-scripts
fi
