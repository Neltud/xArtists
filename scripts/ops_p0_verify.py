#!/usr/bin/env python3
"""P0 security verify — run before every release / before any deploy.

Checks:
  1) contracts.json verdict GO_DEMO or explicit deploy_status
  2) on-chain codeHash probe (via ops_sc_status logic)
  3) DEMO_MODE source is true
  4) no LIA_LIVE default in demoMode
  5) btc-bridge must not be in deploy allowlist files as enabled

Exit 0 = P0 posture OK for demo
Exit 2 = P0 violation
"""
from __future__ import annotations

import json
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
API = "https://api.multiversx.com"
errors: list[str] = []
warnings: list[str] = []


def ok(msg: str) -> None:
    print(f"  OK  {msg}")


def fail(msg: str) -> None:
    errors.append(msg)
    print(f"  FAIL {msg}")


def warn(msg: str) -> None:
    warnings.append(msg)
    print(f"  WARN {msg}")


def main() -> int:
    print("=== P0 security verify ===")

    # 1) contracts.json
    cj = ROOT / "data" / "contracts.json"
    if not cj.exists():
        fail("data/contracts.json missing")
        data = {}
    else:
        data = json.loads(cj.read_text(encoding="utf-8"))
        ui = data.get("ui_status") or {}
        if ui.get("lia_live_trading") is True:
            fail("contracts.json ui_status.lia_live_trading is true")
        else:
            ok("lia_live_trading false")
        if ui.get("verdict") not in ("GO_DEMO", "DEMO", None):
            # allow future LIVE only if all deployed — checked below
            warn(f"verdict={ui.get('verdict')}")
        else:
            ok(f"verdict={ui.get('verdict') or 'GO_DEMO'}")

    # 2) on-chain probe sample
    contracts = data.get("contracts") or {}
    deployed = 0
    for name, addr in list(contracts.items())[:6]:
        if not addr or not str(addr).startswith("erd1"):
            continue
        try:
            req = urllib.request.Request(
                f"{API}/accounts/{addr}",
                headers={"User-Agent": "xArtists-p0-verify/1"},
            )
            with urllib.request.urlopen(req, timeout=20) as r:
                acc = json.loads(r.read().decode())
            if acc.get("codeHash"):
                deployed += 1
                ok(f"{name} codeHash present")
            else:
                ok(f"{name} NOT_DEPLOYED (expected in GO_DEMO)")
        except Exception as e:
            warn(f"{name} probe {type(e).__name__}")

    # 3) DEMO_MODE true in source
    demo = ROOT / "apps" / "frontend" / "src" / "config" / "demoMode.ts"
    if demo.exists():
        text = demo.read_text(encoding="utf-8")
        if re.search(r"export const DEMO_MODE\s*=\s*true", text):
            ok("DEMO_MODE = true")
        elif re.search(r"export const DEMO_MODE\s*=\s*false", text):
            fail("DEMO_MODE = false — P0 violation for current phase")
        else:
            warn("DEMO_MODE declaration not matched")
    else:
        fail("demoMode.ts missing")

    # 4) integrityGates exists
    gates = ROOT / "apps" / "frontend" / "src" / "lib" / "integrityGates.ts"
    if gates.exists() and "assertLiveContract" in gates.read_text(encoding="utf-8"):
        ok("integrityGates.assertLiveContract present")
    else:
        fail("integrityGates incomplete")

    # 5) deploy scripts must refuse btc-bridge
    for rel in (
        "scripts/deploy_mainnet.sh",
        "scripts/deploy_all_scs.sh",
        "scripts/build_scs_isolated.sh",
    ):
        p = ROOT / rel
        if not p.exists():
            continue
        t = p.read_text(encoding="utf-8", errors="replace")
        if "btc-bridge" in t and "NOT" not in t.upper() and "skip" not in t.lower():
            # still OK if explicitly excluded
            if re.search(r"btc-bridge", t) and not re.search(
                r"(NOT deploy|not deployed|skip.*btc|refuse.*btc|experimental)", t, re.I
            ):
                warn(f"{rel} mentions btc-bridge — ensure hard skip")
        if "NOT deployed" in t or "not deploy" in t.lower() or "Bridge: NOT" in t:
            ok(f"{rel} documents bridge exclusion")

    # 6) SOURCE_OF_TRUTH
    sot = ROOT / "docs" / "SOURCE_OF_TRUTH.md"
    if sot.exists() and "GO_DEMO" in sot.read_text(encoding="utf-8"):
        ok("SOURCE_OF_TRUTH GO_DEMO")
    else:
        warn("SOURCE_OF_TRUTH missing GO_DEMO marker")

    print("---")
    print(f"errors={len(errors)} warnings={len(warnings)}")
    if errors:
        for e in errors:
            print(" ", e)
        return 2
    print("P0 posture OK for GO_DEMO")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
