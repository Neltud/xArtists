"""
Vellum node: deploy xArtists SCs using PEM from environment secret.

Secrets (Vellum vault only):
  LIA_WALLET_PEM       — full PEM text OR path if runner mounts a file
  LIA_WALLET_PEM_PATH  — alternate path
  LIA_MVX_PROXY        — default https://gateway.multiversx.com
  LIA_CHAIN_ID / CHAIN — must be 1 (mainnet)
  FEE_BPS              — default 300

Flags:
  VELLUM_DEPLOY_SCS=1  — required by production_run to call this module
  VELLUM_DEPLOY_DRY=1  — build + resolve PEM only, no --send
  DEPLOY_CONTRACT      — nft-marketplace | agents-marketplace | all

Never log the PEM. Never write PEM to the git repo.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import tempfile
import time
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
PROXY = os.getenv("LIA_MVX_PROXY") or os.getenv("PROXY") or "https://gateway.multiversx.com"
API = os.getenv("LIA_MVX_API") or "https://api.multiversx.com"
CHAIN = str(os.getenv("LIA_CHAIN_ID") or os.getenv("CHAIN") or "1")
FEE_BPS = os.getenv("FEE_BPS", "300")
WHICH = os.getenv("DEPLOY_CONTRACT", "all")
DRY = os.getenv("VELLUM_DEPLOY_DRY", "0").strip() in ("1", "true", "TRUE", "yes")
MIN_DEPLOYER_EGLD = float(os.getenv("LIA_DEPLOYER_MIN_EGLD", "0.25"))


def _ts() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _pem_path() -> str:
    raw = os.getenv("LIA_WALLET_PEM", "") or os.getenv("LIA_WALLET_PEM_PATH", "") or os.getenv("PEM", "")
    if not raw:
        raise RuntimeError("Missing secret LIA_WALLET_PEM / LIA_WALLET_PEM_PATH / PEM")
    if raw.startswith("-----") or "\n" in raw:
        fd, path = tempfile.mkstemp(suffix=".pem", prefix="lia_deploy_")
        os.close(fd)
        Path(path).write_text(raw if raw.endswith("\n") else raw + "\n", encoding="utf-8")
        os.chmod(path, 0o600)
        return path
    if Path(raw).is_file():
        return raw
    raise RuntimeError("LIA_WALLET_PEM is neither PEM text nor a valid file path")


def _run(cmd: list[str], cwd: str | None = None) -> tuple[int, str]:
    p = subprocess.run(cmd, capture_output=True, text=True, cwd=cwd)
    out = (p.stdout or "") + "\n" + (p.stderr or "")
    # Redact any accidental PEM-looking blocks
    out = re.sub(
        r"-----BEGIN[^-]+-----.*?-----END[^-]+-----",
        "[PEM_REDACTED]",
        out,
        flags=re.DOTALL,
    )
    return p.returncode, out


def _http_json(url: str) -> dict[str, Any]:
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())


def _deployer_address(pem: str) -> str | None:
    explicit = (os.getenv("LIA_DEPLOYER_ADDRESS") or "").strip()
    if explicit.startswith("erd1"):
        return explicit
    rc, out = _run(["mxpy", "wallet", "pem-address", "--pem", pem])
    if rc != 0:
        return None
    for token in out.split():
        if token.startswith("erd1"):
            return token.strip()
    return None


def _deployer_balance_gate(pem: str) -> dict[str, Any]:
    addr = _deployer_address(pem)
    if not addr:
        return {
            "ok": False,
            "error": "unable to resolve deployer address from PEM",
            "min_required_egld": MIN_DEPLOYER_EGLD,
        }
    data = _http_json(f"{API.rstrip('/')}/accounts/{addr}")
    raw = data.get("balance") or "0"
    try:
        balance_egld = int(str(raw)) / 1e18
    except (TypeError, ValueError):
        balance_egld = 0.0
    return {
        "ok": balance_egld >= MIN_DEPLOYER_EGLD,
        "address": addr,
        "balance_egld": balance_egld,
        "min_required_egld": MIN_DEPLOYER_EGLD,
    }


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

    rc, build_log = _run(["mxpy", "contract", "build"], cwd=str(cdir))
    wasms = list((cdir / "output").glob("*.wasm")) if (cdir / "output").exists() else []
    if not wasms:
        return {
            "ok": False,
            "name": name,
            "error": "build failed / no wasm",
            "log": build_log[-2000:],
            "build_rc": rc,
        }

    wasm = str(wasms[0])
    if DRY:
        return {
            "ok": True,
            "name": name,
            "dry": True,
            "wasm": wasm,
            "note": "VELLUM_DEPLOY_DRY=1 — no --send",
        }

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
    rc, log = _run(cmd)
    addr = _parse_address(log)
    return {
        "ok": bool(addr),
        "name": name,
        "address": addr,
        "deploy_rc": rc,
        "log_tail": log[-1500:],
    }


def run() -> dict[str, Any]:
    if CHAIN != "1":
        return {
            "ok": False,
            "error": f"MAINNET ONLY — refuse chain={CHAIN}",
            "ts": _ts(),
        }

    if os.environ.get("LIA_LIVE_TRADING", "0").strip() in ("1", "true", "TRUE"):
        # Deploy is allowed with live=0 preferred; warn only
        pass

    pem = _pem_path()
    created_tmp = tempfile.gettempdir() in pem or pem.startswith("/tmp")
    try:
        deployer_gate = _deployer_balance_gate(pem)
        if not DRY and not deployer_gate.get("ok"):
            return {
                "ok": False,
                "ts": _ts(),
                "dry": DRY,
                "chain": CHAIN,
                "proxy": PROXY,
                "deployed_via": "vellum",
                "error": "insufficient deployer EGLD or deployer account lookup failed",
                "deployer": deployer_gate,
                "next": [
                    "Fund the LIA ops deployer wallet with enough EGLD",
                    "Re-run Vellum paper/publication cycle",
                    "Retry deploy only after funding + verify preconditions",
                ],
            }
        targets: list[str] = []
        if WHICH in ("all", "nft-marketplace"):
            targets.append("nft-marketplace")
        if WHICH in ("all", "agents-marketplace"):
            targets.append("agents-marketplace")

        results = [deploy_contract(n, pem) for n in targets]
        addresses = {r["name"]: r.get("address") for r in results if r.get("address")}

        path = ROOT / "data" / "contracts.json"
        data: dict[str, Any] = {}
        if path.exists():
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                data = {}
        if addresses.get("nft-marketplace"):
            data["marketplace_nft"] = addresses["nft-marketplace"]
            data["nft-marketplace"] = addresses["nft-marketplace"]
        if addresses.get("agents-marketplace"):
            data["agents_marketplace"] = addresses["agents-marketplace"]
        data["updated"] = _ts()
        data["deployed_via"] = "vellum"
        data["dry"] = DRY
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data, indent=2), encoding="utf-8")

        report = {
            "ok": all(r.get("ok") for r in results) if results else False,
            "ts": _ts(),
            "dry": DRY,
            "chain": CHAIN,
            "proxy": PROXY,
            "deployed_via": "vellum",
            "fee_bps": FEE_BPS,
            "deployer": deployer_gate,
            "targets": targets,
            "results": results,
            "contracts": data,
            "next": [
                "python scripts/verify_marketplace_codehash.py",
                "Set VITE_*_CODEHASH_OK=1 only after exit 0",
                "git commit data/contracts.json addresses only — never PEM",
            ],
        }
        out = ROOT / "data" / "vellum_deploy_scs.json"
        try:
            out.write_text(json.dumps(report, indent=2, default=str), encoding="utf-8")
            report["wrote"] = str(out)
        except OSError:
            pass
        return report
    finally:
        if created_tmp:
            try:
                os.remove(pem)
            except OSError:
                pass


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
