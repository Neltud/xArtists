"""
Vellum node: deploy xArtists SCs using PEM from environment secret.

Secrets (Vellum):
  LIA_WALLET_PEM     — full PEM text OR path if runner mounts a file
  LIA_MVX_PROXY      — default https://gateway.multiversx.com
  LIA_CHAIN_ID       — default 1 (mainnet)
  FEE_BPS            — default 300

Optional:
  DEPLOY_CONTRACT    — nft-marketplace | agents-marketplace | all

Never log the PEM. Never write PEM to the git repo.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import tempfile
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
PROXY = os.getenv("LIA_MVX_PROXY", "https://gateway.multiversx.com")
CHAIN = os.getenv("LIA_CHAIN_ID", "1")
FEE_BPS = os.getenv("FEE_BPS", "300")
WHICH = os.getenv("DEPLOY_CONTRACT", "all")


def _pem_path() -> str:
    raw = os.getenv("LIA_WALLET_PEM", "") or os.getenv("LIA_WALLET_PEM_PATH", "")
    if not raw:
        raise RuntimeError("Missing secret LIA_WALLET_PEM or LIA_WALLET_PEM_PATH")
    if raw.startswith("-----") or "\n" in raw:
        fd, path = tempfile.mkstemp(suffix=".pem", prefix="lia_deploy_")
        os.close(fd)
        Path(path).write_text(raw if raw.endswith("\n") else raw + "\n", encoding="utf-8")
        os.chmod(path, 0o600)
        return path
    if Path(raw).is_file():
        return raw
    raise RuntimeError("LIA_WALLET_PEM is neither PEM text nor a valid file path")


def _run(cmd: list[str]) -> str:
    p = subprocess.run(cmd, capture_output=True, text=True)
    out = (p.stdout or "") + "\n" + (p.stderr or "")
    return out


def _parse_address(log: str) -> str | None:
    m = re.search(r"erd1qqqqqqqqqqqqqpgq[a-z0-9]+", log)
    if m:
        return m.group(0)
    m = re.search(r"erd1[a-z0-9]{58}", log)
    return m.group(0) if m else None


def deploy_contract(name: str, pem: str) -> dict[str, Any]:
    cdir = ROOT / "contracts" / name
    if not cdir.is_dir():
        return {"ok": False, "name": name, "error": "missing directory"}

    build = _run(["mxpy", "contract", "build"],)
    # mxpy needs cwd
    p = subprocess.run(
        ["mxpy", "contract", "build"],
        cwd=str(cdir),
        capture_output=True,
        text=True,
    )
    build_log = (p.stdout or "") + (p.stderr or "")
    wasms = list((cdir / "output").glob("*.wasm")) if (cdir / "output").exists() else []
    if not wasms:
        return {"ok": False, "name": name, "error": "build failed / no wasm", "log": build_log[-2000:]}

    wasm = str(wasms[0])
    cmd = [
        "mxpy",
        "contract",
        "deploy",
        "--bytecode",
        wasm,
        "--pem",
        pem,
        "--proxy",
        PROXY,
        "--chain",
        CHAIN,
        "--gas-limit",
        "80000000",
        "--arguments",
        FEE_BPS,
        "--recall-nonce",
        "--send",
    ]
    log = _run(cmd)
    addr = _parse_address(log)
    return {
        "ok": bool(addr),
        "name": name,
        "address": addr,
        "log_tail": log[-1500:],
    }


def run() -> dict[str, Any]:
    pem = _pem_path()
    created_tmp = pem.startswith(tempfile.gettempdir())
    try:
        targets = []
        if WHICH in ("all", "nft-marketplace"):
            targets.append("nft-marketplace")
        if WHICH in ("all", "agents-marketplace"):
            targets.append("agents-marketplace")

        results = [deploy_contract(n, pem) for n in targets]
        addresses = {r["name"]: r.get("address") for r in results if r.get("address")}

        # Update contracts.json in workspace (caller may git-push without PEM)
        path = ROOT / "data" / "contracts.json"
        data: dict[str, Any] = {}
        if path.exists():
            data = json.loads(path.read_text(encoding="utf-8"))
        if addresses.get("nft-marketplace"):
            data["marketplace_nft"] = addresses["nft-marketplace"]
            data["nft-marketplace"] = addresses["nft-marketplace"]
        if addresses.get("agents-marketplace"):
            data["agents_marketplace"] = addresses["agents-marketplace"]
        data["updated"] = __import__("datetime").datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        data["deployed_via"] = "vellum"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data, indent=2), encoding="utf-8")

        return {"ok": all(r.get("ok") for r in results), "results": results, "contracts": data}
    finally:
        if created_tmp:
            try:
                os.remove(pem)
            except OSError:
                pass


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
