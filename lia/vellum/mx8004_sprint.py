"""Run MX-8004 registration skeleton in DRY_RUN (default) during production_run."""
from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "register_mx8004_lia.py"
OUT = ROOT / "data" / "mx8004_registration.json"


def _is_live_registration(payload: dict[str, Any]) -> bool:
    if payload.get("mode") == "live" and payload.get("agent_nonce"):
        return True
    if payload.get("tx_hash") and payload.get("identity_registry"):
        return True
    return False


def run_mx8004_sprint(dry_run: bool = True) -> dict[str, Any]:
    env = os.environ.copy()
    env["DRY_RUN"] = "1" if dry_run else env.get("DRY_RUN", "1")
    env.setdefault("CHAIN", "1")
    env.setdefault("LIA_LIVE_TRADING", "0")

    result: dict[str, Any] = {
        "ok": False,
        "dry_run": env["DRY_RUN"] != "0",
        "registered": False,
        "module": "mx8004_sprint",
    }

    if not SCRIPT.is_file():
        result["error"] = f"missing {SCRIPT}"
        result["summary"] = "mx8004 script missing"
        return result

    try:
        proc = subprocess.run(
            [sys.executable, str(SCRIPT)],
            cwd=str(ROOT),
            env=env,
            capture_output=True,
            text=True,
            timeout=60,
            check=False,
        )
        result["exit"] = proc.returncode
        result["ok"] = proc.returncode == 0
        if proc.stderr:
            result["stderr_tail"] = proc.stderr[-400:]
    except Exception as e:
        result["error"] = str(e)
        result["summary"] = f"mx8004 sprint error: {e}"
        return result

    payload: dict[str, Any] = {}
    if OUT.is_file():
        try:
            payload = json.loads(OUT.read_text(encoding="utf-8"))
        except Exception:
            payload = {}
    result["registered"] = _is_live_registration(payload)
    result["mode"] = payload.get("mode", "dry_run")
    result["pem_available"] = bool(payload.get("pem_available"))
    result["identity_registry"] = payload.get("identity_registry")
    result["summary"] = (
        f"mx8004 {result['mode']} registered={result['registered']} "
        f"pem={result['pem_available']}"
    )

    # Mirror for Pages
    for dest in (
        ROOT / "apps" / "frontend" / "public" / "data" / "mx8004_registration.json",
        ROOT / "docs" / "data" / "mx8004_registration.json",
    ):
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            if OUT.is_file():
                dest.write_text(OUT.read_text(encoding="utf-8"), encoding="utf-8")
        except OSError:
            pass
    return result
