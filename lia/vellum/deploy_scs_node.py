"""
Vellum / Actions node: deploy xArtists SCs using PEM from environment secret.

Secrets (vault only):
  LIA_WALLET_PEM | LIA_WALLET_PEM_PATH | PEM

Env:
  LIA_MVX_PROXY, LIA_CHAIN_ID (D|T|1), FEE_BPS, DEPLOY_CONTRACT
  VELLUM_DEPLOY_DRY=1 — build only
  TRO_TOKEN — default TRO-94c925 (init tro-staking)

Never log the PEM. Never write PEM to git.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import tempfile
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
PROXY = os.getenv("LIA_MVX_PROXY") or os.getenv("PROXY") or "https://gateway.multiversx.com"
CHAIN = str(os.getenv("LIA_CHAIN_ID") or os.getenv("CHAIN") or "1")
FEE_BPS = os.getenv("FEE_BPS", "300")
WHICH = os.getenv("DEPLOY_CONTRACT", "all")
DRY = os.getenv("VELLUM_DEPLOY_DRY", "0").strip() in ("1", "true", "TRUE", "yes")
TRO_TOKEN = os.getenv("TRO_TOKEN", "TRO-94c925")


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
    out = re.sub(
        r"-----BEGIN[^-]+-----.*?-----END[^-]+-----",
        "[PEM_REDACTED]",
        out,
        flags=re.DOTALL,
    )
    return p.returncode, out


def _parse_address(log: str) -> str | None:
    m = re.search(r"erd1qqqqqqqqqqqqqpgq[a-z0-9]+", log)
    if m:
        return m.group(0)
    m = re.search(r"erd1[a-z0-9]{58}", log)
    return m.group(0) if m else None


def _init_arguments(name: str) -> list[str]:
    """mxpy --arguments values for contract init."""
    if name in ("nft-marketplace", "agents-marketplace"):
        return [FEE_BPS]
    if name == "tro-staking":
        # TokenIdentifier as string — mxpy encodes str
        return [TRO_TOKEN]
    # nft-staking, agent-stake-escrow, slot-casino: no init args or handled separately
    return []


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
        "--recall-nonce",
        "--send",
    ]
    args = _init_arguments(name)
    if args:
        cmd.extend(["--arguments", *args])

    rc, log = _run(cmd)
    addr = _parse_address(log)
    return {
        "ok": bool(addr),
        "name": name,
        "address": addr,
        "deploy_rc": rc,
        "log_tail": log[-1500:],
    }


def _targets() -> list[str]:
    w = WHICH.strip().lower()
    if w == "all":
        return ["nft-marketplace", "agents-marketplace", "nft-staking", "tro-staking"]
    if w in (
        "nft-marketplace",
        "agents-marketplace",
        "nft-staking",
        "tro-staking",
        "slot-casino",
        "agent-stake-escrow",
    ):
        return [w]
    return []


def run() -> dict[str, Any]:
    if CHAIN not in ("1", "D", "T", "d", "t"):
        return {"ok": False, "error": f"unsupported chain={CHAIN}", "ts": _ts()}

    chain = CHAIN.upper() if CHAIN.lower() in ("d", "t") else CHAIN

    pem = _pem_path()
    created_tmp = tempfile.gettempdir() in pem or pem.startswith("/tmp")
    try:
        targets = _targets()
        if not targets:
            return {"ok": False, "error": f"unknown DEPLOY_CONTRACT={WHICH}", "ts": _ts()}

        results = [deploy_contract(n, pem) for n in targets]
        addresses = {r["name"]: r.get("address") for r in results if r.get("address")}

        path = ROOT / "data" / "contracts.json"
        data: dict[str, Any] = {}
        if path.exists():
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                data = {}

        contracts = data.setdefault("contracts", {}) if isinstance(data.get("contracts"), dict) else {}
        if not isinstance(data.get("contracts"), dict):
            data["contracts"] = contracts

        if addresses.get("nft-marketplace"):
            contracts["marketplace"] = addresses["nft-marketplace"]
            data["marketplace_nft"] = addresses["nft-marketplace"]
        if addresses.get("agents-marketplace"):
            contracts["agents_marketplace"] = addresses["agents-marketplace"]
        if addresses.get("nft-staking"):
            contracts["nft_staking"] = addresses["nft-staking"]
        if addresses.get("tro-staking"):
            contracts["tro_staking"] = addresses["tro-staking"]
        if addresses.get("slot-casino"):
            contracts["slot_casino"] = addresses["slot-casino"]

        data["updated"] = _ts()
        data["deployed_via"] = "vellum/deploy_scs_node"
        data["dry"] = DRY
        data["chain"] = chain
        data["network"] = {"1": "mainnet", "D": "devnet", "T": "testnet"}.get(chain, chain)

        # Mark deploy_status for verified writes only after address present
        st = data.setdefault("deploy_status", {})
        for key, sc_name in (
            ("marketplace", "nft-marketplace"),
            ("agents_marketplace", "agents-marketplace"),
            ("nft_staking", "nft-staking"),
            ("tro_staking", "tro-staking"),
        ):
            if addresses.get(sc_name):
                st[key] = "DEPLOYED_PENDING_CODEHASH_VERIFY"

        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data, indent=2), encoding="utf-8")

        report = {
            "ok": all(r.get("ok") for r in results) if results else False,
            "ts": _ts(),
            "dry": DRY,
            "chain": chain,
            "proxy": PROXY,
            "fee_bps": FEE_BPS,
            "targets": targets,
            "results": results,
            "next": [
                "Verify codeHash via api.multiversx.com/accounts/{addr}",
                "python scripts/verify_marketplace_codehash.py (if present)",
                "Set VITE_*_CODEHASH_OK=1 only after non-null codeHash",
                "Never commit PEM",
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
