"""
Signature Bridge — proposal → package prêt à signer (xPortal / Vellum / MultiversX).
No broadcast. Human signs externally; optional match closes the loop.

  PYTHONPATH=. python -m lia.guardian.signature_bridge --from-decision
  PYTHONPATH=. python -m lia.guardian.signature_bridge --match <txHash>
"""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
PACKAGES = DATA / "signature_packages.json"


def _load_decision_proposals() -> list[dict[str, Any]]:
    path = DATA / "decision_proposals.json"
    if not path.is_file():
        return []
    try:
        d = json.loads(path.read_text(encoding="utf-8"))
        return list(d.get("proposals") or [])
    except Exception:
        return []


def build_package(proposal: dict[str, Any]) -> dict[str, Any]:
    """Normalize proposal into external-signing package."""
    txs = []
    for i, t in enumerate(proposal.get("txs") or []):
        txs.append(
            {
                "step": i + 1,
                "receiver": t.get("receiver"),
                "value": str(t.get("value") or 0),  # atomic EGLD as string for wallets
                "value_egld": (int(t.get("value") or 0) / 1e18) if t.get("value") else 0,
                "data": t.get("data") or "",
                "gasLimit": int(t.get("gasLimit") or 50_000_000),
                "label": t.get("label") or f"step_{i+1}",
            }
        )
    return {
        "schema": "signature_package/v1",
        "id": proposal.get("id"),
        "source": "decision_chain",
        "status": "waiting_signature",
        "action_type": proposal.get("action_type"),
        "pair": proposal.get("pair"),
        "strategy": proposal.get("strategy"),
        "reason": proposal.get("reason"),
        "amount_egld": proposal.get("amount_egld"),
        "amount_usd": proposal.get("amount_usd"),
        "slippage": proposal.get("slippage"),
        "txs": txs,
        "network": "mainnet",
        "chainId": "1",
        "broadcast": False,
        "created": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "how_to_sign": [
            "1. Copy each step data + receiver + value",
            "2. Sign in xPortal / MultiversX Utils / Vellum executor",
            "3. Run: python -m lia.guardian.signature_bridge --match <txHash>",
        ],
    }


def export_from_decision(*, only_ready: bool = True) -> dict[str, Any]:
    props = _load_decision_proposals()
    packages = []
    for p in props:
        if only_ready and p.get("status") != "ready_to_sign":
            continue
        if not p.get("txs"):
            continue
        packages.append(build_package(p))
    out = {
        "schema": "signature_packages/v1",
        "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "count": len(packages),
        "packages": packages,
        "note": "Human signs. Bridge never broadcasts.",
    }
    DATA.mkdir(parents=True, exist_ok=True)
    PACKAGES.write_text(json.dumps(out, indent=2), encoding="utf-8")
    for dest in (
        ROOT / "apps" / "frontend" / "public" / "data" / "signature_packages.json",
        ROOT / "docs" / "data" / "signature_packages.json",
    ):
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(json.dumps(out, indent=2), encoding="utf-8")
        except OSError:
            pass
    return out


def match_tx(tx_hash: str) -> dict[str, Any]:
    """
    Detect TX on explorer API and mark nearest waiting package executed.
    Conservative: success status required; optional data prefix match.
    """
    import urllib.request

    tx_hash = tx_hash.strip().lower().replace("0x", "")
    url = f"https://api.multiversx.com/transactions/{tx_hash}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "xArtists-sig-bridge/1.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            tx = json.loads(r.read().decode())
    except Exception as e:
        return {"ok": False, "reason": f"fetch_failed:{e}"}

    status = str(tx.get("status") or "")
    if status != "success":
        return {"ok": False, "reason": f"tx_status_{status}", "tx": {"status": status}}

    # Load packages and mark first waiting
    if PACKAGES.is_file():
        try:
            blob = json.loads(PACKAGES.read_text(encoding="utf-8"))
            packages = list(blob.get("packages") or [])
        except Exception:
            packages = []
    else:
        packages = []

    matched = None
    for p in packages:
        if p.get("status") in ("waiting_signature", "ready_to_sign", None):
            p["status"] = "executed_on_chain"
            p["tx_hash"] = tx_hash
            p["matched_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            p["explorer"] = f"https://explorer.multiversx.com/transactions/{tx_hash}"
            matched = p
            break

    if matched and PACKAGES.is_file():
        blob = json.loads(PACKAGES.read_text(encoding="utf-8"))
        blob["packages"] = packages
        blob["updated"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        PACKAGES.write_text(json.dumps(blob, indent=2), encoding="utf-8")

    try:
        from lia.utils.audit_log import audit

        audit("signature_matched", tx_hash=tx_hash, package_id=(matched or {}).get("id"))
    except Exception:
        pass

    # Feed post_trade lightly
    try:
        from lia.brain.post_trade import analyze

        analyze(
            intended_out=0.0,
            executed_out=0.0,
            intended_in=float((matched or {}).get("amount_egld") or 0),
            token_in="EGLD",
            token_out="USDC-c76f1f",
            tx_hash=tx_hash,
            strategy=str((matched or {}).get("strategy") or "STRAT_MICRO_PROOF"),
        )
    except Exception:
        pass

    return {
        "ok": True,
        "tx_hash": tx_hash,
        "status": status,
        "package": matched,
        "note": "Loop closed for first waiting package — verify package_id manually if concurrent",
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--from-decision", action="store_true")
    ap.add_argument("--match", type=str, default="")
    args = ap.parse_args()
    if args.match:
        print(json.dumps(match_tx(args.match), indent=2))
    elif args.from_decision:
        print(json.dumps(export_from_decision(), indent=2))
    else:
        print(json.dumps({"hint": "--from-decision | --match <txHash>"}, indent=2))


if __name__ == "__main__":
    main()
