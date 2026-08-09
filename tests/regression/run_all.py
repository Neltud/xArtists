#!/usr/bin/env python3
"""Single-process regression runner — avoids N× Python cold starts."""
from __future__ import annotations

import importlib.util
import os
import sys
import time
import traceback
from pathlib import Path
from types import ModuleType
from typing import Callable

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

os.environ.setdefault("LIA_LIVE_TRADING", "0")

MODULES = [
    "tests/regression/test_data_contracts.py",
    "tests/regression/test_post_deploy_logic.py",
    "tests/regression/test_trading_stack_gates.py",
    "tests/regression/test_sc_status_flags.py",
    "tests/regression/test_oracle_config.py",
    "tests/regression/test_desk_debate.py",
    "lia/bridge/test_latency.py",
    "lia/guardian/test_spiral.py",
    "lia/risk/test_secure_tp.py",
    "lia/risk/test_slippage_arb_trail.py",
    "lia/claude_agent/tests/test_signal_bus.py",
    "lia/claude_agent/tests/test_pyramids_adapter.py",
    "tests/test_lia_circuit.py",
    "tests/test_statarb.py",
    "tests/test_symbiosis.py",
]

FAILFAST = os.getenv("REGRESSION_FAILFAST", "0") == "1"
QUIET = os.getenv("REGRESSION_QUIET", "0") == "1"


def load_module(rel: str) -> ModuleType | None:
    path = ROOT / rel
    if not path.is_file():
        return None
    name = rel.replace("/", ".").replace(".py", "").replace("-", "_")
    spec = importlib.util.spec_from_file_location(name, path)
    if not spec or not spec.loader:
        return None
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def collect_tests(mod: ModuleType) -> list[tuple[str, Callable]]:
    out: list[tuple[str, Callable]] = []
    for attr in dir(mod):
        if not attr.startswith("test_"):
            continue
        fn = getattr(mod, attr)
        if callable(fn):
            out.append((attr, fn))
    out.sort(key=lambda x: x[0])
    return out


def main() -> int:
    t0 = time.perf_counter()
    passed = 0
    failed = 0
    skipped_mod = 0
    results: list[dict] = []

    for rel in MODULES:
        mod = load_module(rel)
        if mod is None:
            skipped_mod += 1
            results.append({"module": rel, "ok": True, "skipped": True})
            if not QUIET:
                print(f"SKIP  {rel}")
            continue

        tests = collect_tests(mod)
        if not tests and hasattr(mod, "main") and callable(mod.main):
            tests = [("main", mod.main)]

        if not tests:
            if not QUIET:
                print(f"LOAD  {rel} (no test_* — import only)")
            passed += 1
            results.append({"module": rel, "ok": True, "import_only": True})
            continue

        for name, fn in tests:
            full = f"{rel}::{name}"
            try:
                fn()
                passed += 1
                results.append({"name": full, "ok": True})
                if not QUIET:
                    print(f"PASS  {full}")
            except Exception as e:
                failed += 1
                results.append({"name": full, "ok": False, "error": str(e)})
                print(f"FAIL  {full}: {e}")
                if not QUIET:
                    traceback.print_exc()
                if FAILFAST:
                    break
        if failed and FAILFAST:
            break

    elapsed = time.perf_counter() - t0
    import json

    report = {
        "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "pass": passed,
        "fail": failed,
        "skip_modules": skipped_mod,
        "ok": failed == 0,
        "elapsed_sec": round(elapsed, 3),
        "mode": "single_process",
        "results": results,
    }
    out = ROOT / "data" / "regression_report.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print("")
    print(f"PASS={passed} FAIL={failed} SKIP_MOD={skipped_mod}  {elapsed:.2f}s")
    print(f"wrote {out}")
    if failed:
        print("❌ REGRESSION FAILED")
        return 1
    print("✅ REGRESSION PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
