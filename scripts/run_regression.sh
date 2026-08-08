#!/usr/bin/env bash
# Fast regression suite.
# Default: single-process runner (tests/regression/run_all.py) — ~5–15× faster
# than spawning one Python per file.
#
# Modes:
#   ./scripts/run_regression.sh           # fast (default)
#   REGRESSION_MODE=legacy ./scripts/run_regression.sh   # one process per file
#   REGRESSION_MODE=pytest ./scripts/run_regression.sh   # pytest only
#   REGRESSION_FAILFAST=1 ./scripts/run_regression.sh
#   REGRESSION_QUIET=1 ./scripts/run_regression.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export PYTHONPATH="$ROOT${PYTHONPATH:+:$PYTHONPATH}"
export LIA_LIVE_TRADING="${LIA_LIVE_TRADING:-0}"
MODE="${REGRESSION_MODE:-fast}"

echo "╔════════════════════════════════════════╗"
echo "║  xArtists regression ($MODE)           ║"
echo "╚════════════════════════════════════════╝"

START=$(date +%s)

if [[ "$MODE" == "fast" || "$MODE" == "default" ]]; then
  python3 tests/regression/run_all.py
  RC=$?
elif [[ "$MODE" == "pytest" ]]; then
  if ! command -v pytest >/dev/null 2>&1; then
    echo "pytest not installed — falling back to fast runner"
    python3 tests/regression/run_all.py
    RC=$?
  else
    pytest -q --tb=line -x=${REGRESSION_FAILFAST:-0} \
      tests/regression \
      lia/bridge/test_latency.py \
      lia/guardian/test_spiral.py \
      lia/risk/test_secure_tp.py \
      lia/risk/test_slippage_arb_trail.py \
      lia/claude_agent/tests \
      tests/test_lia_circuit.py \
      tests/test_statarb.py \
      tests/test_symbiosis.py
    RC=$?
  fi
elif [[ "$MODE" == "legacy" ]]; then
  # Original multi-process path (debug only)
  PASS=0; FAIL=0; SKIP=0
  run_mod() {
    local name="$1" mod="$2"
    [[ -f "$mod" ]] || { SKIP=$((SKIP+1)); return 0; }
    set +e; python3 "$mod"; local rc=$?; set -e
    if [[ $rc -eq 0 ]]; then PASS=$((PASS+1)); else FAIL=$((FAIL+1)); echo "FAIL $name"; fi
  }
  run_mod data tests/regression/test_data_contracts.py
  run_mod post_deploy tests/regression/test_post_deploy_logic.py
  run_mod trading tests/regression/test_trading_stack_gates.py
  run_mod sc_status tests/regression/test_sc_status_flags.py
  run_mod latency lia/bridge/test_latency.py
  run_mod spiral lia/guardian/test_spiral.py
  run_mod secure_tp lia/risk/test_secure_tp.py
  run_mod slip lia/risk/test_slippage_arb_trail.py
  run_mod signal_bus lia/claude_agent/tests/test_signal_bus.py
  run_mod pyramids lia/claude_agent/tests/test_pyramids_adapter.py
  run_mod circuit tests/test_lia_circuit.py
  run_mod statarb tests/test_statarb.py
  run_mod symbiosis tests/test_symbiosis.py
  RC=0; [[ "$FAIL" -eq 0 ]] || RC=1
  echo "PASS=$PASS FAIL=$FAIL SKIP=$SKIP"
else
  echo "Unknown REGRESSION_MODE=$MODE (use fast|pytest|legacy)"
  exit 2
fi

END=$(date +%s)
echo "elapsed $((END - START))s mode=$MODE"
exit "$RC"
