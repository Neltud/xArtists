#!/usr/bin/env bash
# Regression suite — offline unit + module self-tests.
# Exit 0 only if all selected suites pass.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export PYTHONPATH="$ROOT${PYTHONPATH:+:$PYTHONPATH}"
export LIA_LIVE_TRADING="${LIA_LIVE_TRADING:-0}"

PASS=0
FAIL=0
SKIP=0
REPORT="$ROOT/data/regression_report.json"
RESULTS=()

run_one() {
  local name="$1"
  shift
  echo ""
  echo "━━━ $name ━━━"
  set +e
  "$@"
  local rc=$?
  set -e
  if [[ $rc -eq 0 ]]; then
    echo "PASS $name"
    PASS=$((PASS + 1))
    RESULTS+=("{\"name\":\"$name\",\"ok\":true}")
  else
    echo "FAIL $name (exit $rc)"
    FAIL=$((FAIL + 1))
    RESULTS+=("{\"name\":\"$name\",\"ok\":false,\"exit\":$rc}")
  fi
}

run_mod() {
  local name="$1"
  local mod="$2"
  if [[ ! -f "$mod" ]]; then
    echo "SKIP $name (missing $mod)"
    SKIP=$((SKIP + 1))
    RESULTS+=("{\"name\":\"$name\",\"ok\":true,\"skipped\":true}")
    return 0
  fi
  run_one "$name" python3 "$mod"
}

echo "╔════════════════════════════════════════╗"
echo "║  xArtists regression suite             ║"
echo "╚════════════════════════════════════════╝"
echo "LIA_LIVE_TRADING=$LIA_LIVE_TRADING PYTHONPATH=$ROOT"

# --- Core regression (new) ---
run_mod "regression/data_contracts" tests/regression/test_data_contracts.py
run_mod "regression/post_deploy_logic" tests/regression/test_post_deploy_logic.py
run_mod "regression/trading_stack_gates" tests/regression/test_trading_stack_gates.py
run_mod "regression/sc_status_flags" tests/regression/test_sc_status_flags.py

# --- Existing module self-tests ---
run_mod "lia/bridge/latency" lia/bridge/test_latency.py
run_mod "lia/guardian/spiral" lia/guardian/test_spiral.py
run_mod "lia/risk/secure_tp" lia/risk/test_secure_tp.py
run_mod "lia/risk/slippage_arb_trail" lia/risk/test_slippage_arb_trail.py
run_mod "lia/claude_agent/signal_bus" lia/claude_agent/tests/test_signal_bus.py
run_mod "lia/claude_agent/pyramids" lia/claude_agent/tests/test_pyramids_adapter.py
run_mod "tests/lia_circuit" tests/test_lia_circuit.py
run_mod "tests/statarb" tests/test_statarb.py
run_mod "tests/symbiosis" tests/test_symbiosis.py

# --- pytest discovery if available ---
if command -v pytest >/dev/null 2>&1; then
  run_one "pytest/regression" pytest -q tests/regression lia/bridge/test_latency.py lia/guardian/test_spiral.py lia/risk/test_secure_tp.py lia/risk/test_slippage_arb_trail.py --tb=line
else
  echo "SKIP pytest (not installed) — self-tests still ran"
  SKIP=$((SKIP + 1))
fi

# Write report
mkdir -p "$ROOT/data"
python3 - <<PY
import json, time
from pathlib import Path
results = [json.loads(x) for x in '''$(printf '%s\n' "${RESULTS[@]}")'''.strip().splitlines() if x.strip()]
# fallback parse
raw = """$(IFS=$'\n'; echo "${RESULTS[*]}")"""
items = []
for line in raw.splitlines():
    line = line.strip()
    if not line:
        continue
    try:
        items.append(json.loads(line))
    except Exception:
        pass
report = {
    "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "pass": $PASS,
    "fail": $FAIL,
    "skip": $SKIP,
    "ok": $FAIL == 0,
    "results": items,
}
Path("data/regression_report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print("wrote data/regression_report.json")
print(json.dumps(report, indent=2))
PY

echo ""
echo "════════════════════════════"
echo "PASS=$PASS FAIL=$FAIL SKIP=$SKIP"
if [[ "$FAIL" -ne 0 ]]; then
  echo "❌ REGRESSION FAILED"
  exit 1
fi
echo "✅ REGRESSION PASSED"
exit 0
