"""
Deployer micro execution — self-transfer dust or dry-run.

Env:
  DEPLOYER_PEM_PATH=/path/to/deployer.pem
  DEPLOYER_LIVE=0|1   # must be 1 to broadcast

  PYTHONPATH=. python -m lia.deployer.micro_exec
  PYTHONPATH=. DEPLOYER_LIVE=1 python -m lia.deployer.micro_exec --live
"""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.request
from pathlib import Path
from typing import Any

from lia.deployer.signals import compute_signals, to_dict

API = "https://api.multiversx.com"
PROXY = "https://gateway.multiversx.com"
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "data" / "deployer_micro_exec.json"

DUST_WEI = 100_000_000_000_000  # 0.0001 EGLD


def _addr_from_pem_header(pem: Path) -> str | None:
    import re

    text = pem.read_text(encoding="utf-8")
    m = re.search(r"PRIVATE KEY for (erd1[a-z0-9]+)", text)
    return m.group(1) if m else None


def run(*, live: bool = False) -> dict[str, Any]:
    pem_path = Path(os.getenv("DEPLOYER_PEM_PATH") or "").expanduser()
    if not pem_path.is_file():
        # sandbox default (local only — not in git)
        cand = Path("/home/workdir/artifacts/deployer-wallet/xartists-sc-deployer.pem")
        if cand.is_file():
            pem_path = cand

    live = live or os.getenv("DEPLOYER_LIVE", "0") == "1"

    addr_hint = _addr_from_pem_header(pem_path) if pem_path.is_file() else None
    signals = compute_signals(address=addr_hint or "", force_micro_proof=True)
    payload: dict[str, Any] = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "live_flag": live,
        "signals": to_dict(signals),
        "pem_configured": pem_path.is_file(),
    }

    if not pem_path.is_file():
        payload["result"] = {"ok": False, "detail": "DEPLOYER_PEM_PATH missing"}
        _write(payload)
        return payload

    if not live:
        payload["result"] = {
            "ok": True,
            "mode": "dry-run",
            "detail": "set DEPLOYER_LIVE=1 or --live for broadcast",
            "would_send_wei": DUST_WEI,
        }
        _write(payload)
        return payload

    from multiversx_sdk import Account, ProxyNetworkProvider, Transaction

    acc = Account.new_from_pem(pem_path)
    addr = acc.address
    with urllib.request.urlopen(f"{API}/accounts/{addr}", timeout=20) as r:
        d = json.loads(r.read().decode())
    nonce = int(d.get("nonce") or 0)

    tx = Transaction(
        sender=addr,
        receiver=addr,
        gas_limit=50_000,
        chain_id="1",
        nonce=nonce,
        value=DUST_WEI,
        data=b"",
    )
    tx.signature = acc.sign_transaction(tx)

    provider = ProxyNetworkProvider(PROXY)
    raw = provider.send_transaction(tx)
    hx = raw.hex() if isinstance(raw, (bytes, bytearray)) else str(raw)
    payload["result"] = {
        "ok": True,
        "mode": "live",
        "tx_hash": hx,
        "explorer": f"https://explorer.multiversx.com/transactions/{hx}",
        "sender": str(addr),
        "value_egld": DUST_WEI / 1e18,
    }
    _write(payload)
    return payload


def _write(payload: dict[str, Any]) -> None:
    try:
        OUT.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    except OSError:
        pass


if __name__ == "__main__":
    live = "--live" in sys.argv
    print(json.dumps(run(live=live), indent=2))
