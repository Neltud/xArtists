#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export GROK_WALLET_ADDRESS="${GROK_WALLET_ADDRESS:-erd12c7f9wll0dcn26ax9fwrgp3yuswchyh9xwz8zs29hl9crgpn96gsdqq5gl}"
export GROK_MODE="${GROK_MODE:-paper}"
export GROK_LIVE_TRADING="${GROK_LIVE_TRADING:-0}"
export GROK_MIN_EGLD_RESERVE="${GROK_MIN_EGLD_RESERVE:-0.15}"
python3 strategies/unified_orchestrator.py
