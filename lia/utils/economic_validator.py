"""
RWA economic integrity: minted TRO − burned TRO == circulating ledger.
Idempotent mint/burn per work_id (CRITICAL patch).

  PYTHONPATH=. python -m lia.utils.economic_validator
"""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
LEDGER = DATA / "rwa_tro_ledger.json"
EVENTS = DATA / "rwa_economic_events.jsonl"

TRO_PER_MINT = 1.0
TRO_PER_BURN = 1.0


def _load_ledger() -> dict[str, Any]:
    if LEDGER.is_file():
        try:
            return json.loads(LEDGER.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {
        "schema": "rwa_tro_ledger/v1",
        "total_minted": 0.0,
        "total_burned": 0.0,
        "circulating": 0.0,
        "events_n": 0,
        "minted_work_ids": [],
        "burned_work_ids": [],
        "updated": None,
        "paper": True,
    }


def _save_ledger(d: dict[str, Any]) -> None:
    DATA.mkdir(parents=True, exist_ok=True)
    d.setdefault("minted_work_ids", [])
    d.setdefault("burned_work_ids", [])
    d["updated"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    d["circulating"] = round(float(d.get("total_minted") or 0) - float(d.get("total_burned") or 0), 6)
    LEDGER.write_text(json.dumps(d, indent=2), encoding="utf-8")
    for dest in (
        ROOT / "apps" / "frontend" / "public" / "data" / "rwa_tro_ledger.json",
        ROOT / "docs" / "data" / "rwa_tro_ledger.json",
    ):
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(json.dumps(d, indent=2), encoding="utf-8")
        except OSError:
            pass


def record_mint(*, work_id: str, artist: str = "", cost_usd: float = 0.0) -> dict[str, Any]:
    led = _load_ledger()
    wid = str(work_id or "").strip()
    minted_ids = list(led.get("minted_work_ids") or [])
    if wid and wid in minted_ids:
        return {
            "ok": False,
            "reason": "already_minted",
            "work_id": wid,
            "ledger": led,
        }
    led["total_minted"] = float(led.get("total_minted") or 0) + TRO_PER_MINT
    led["events_n"] = int(led.get("events_n") or 0) + 1
    if wid:
        minted_ids.append(wid)
        led["minted_work_ids"] = minted_ids
    _save_ledger(led)
    ev = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "type": "MINT_TRO_REWARD",
        "work_id": wid,
        "artist": artist,
        "tro": TRO_PER_MINT,
        "cost_usd": cost_usd,
        "paper": True,
    }
    with EVENTS.open("a", encoding="utf-8") as f:
        f.write(json.dumps(ev) + "\n")
    try:
        from lia.utils.audit_log import audit

        audit("rwa_mint_tro", **ev)
    except Exception:
        pass
    return {"ok": True, "event": ev, "ledger": _load_ledger()}


def record_burn(*, work_id: str, reason: str = "settlement_shipped") -> dict[str, Any]:
    led = _load_ledger()
    wid = str(work_id or "").strip()
    burned_ids = list(led.get("burned_work_ids") or [])
    if wid and wid in burned_ids:
        return {
            "ok": False,
            "reason": "already_burned",
            "work_id": wid,
            "ledger": led,
            "note": "Idempotent: second burn rejected",
        }
    led["total_burned"] = float(led.get("total_burned") or 0) + TRO_PER_BURN
    led["events_n"] = int(led.get("events_n") or 0) + 1
    if wid:
        burned_ids.append(wid)
        led["burned_work_ids"] = burned_ids
    _save_ledger(led)
    ev = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "type": "BURN_TRO_SETTLEMENT",
        "work_id": wid,
        "tro": TRO_PER_BURN,
        "reason": reason,
        "paper": True,
        "burn_address": "burnify_or_dead_address_ops",
    }
    with EVENTS.open("a", encoding="utf-8") as f:
        f.write(json.dumps(ev) + "\n")
    try:
        from lia.utils.audit_log import audit

        audit("rwa_burn_tro", **ev)
    except Exception:
        pass
    return {"ok": True, "event": ev, "ledger": _load_ledger()}


def validate() -> dict[str, Any]:
    led = _load_ledger()
    m = float(led.get("total_minted") or 0)
    b = float(led.get("total_burned") or 0)
    c = float(led.get("circulating") or 0)
    expected = round(m - b, 6)
    ok = abs(expected - c) < 1e-9 and b <= m + 1e-9
    ratio = (b / m) if m > 0 else None
    result = {
        "schema": "economic_validator/v1",
        "ok": ok,
        "total_minted": m,
        "total_burned": b,
        "circulating": c,
        "expected_circulating": expected,
        "supply_burn_ratio": round(ratio, 6) if ratio is not None else None,
        "minted_work_ids_n": len(led.get("minted_work_ids") or []),
        "burned_work_ids_n": len(led.get("burned_work_ids") or []),
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "note": "Paper ledger until on-chain TRO mint/burn wired; burn/mint idempotent per work_id",
    }
    (DATA / "economic_integrity.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    for dest in (
        ROOT / "apps" / "frontend" / "public" / "data" / "economic_integrity.json",
        ROOT / "docs" / "data" / "economic_integrity.json",
    ):
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(json.dumps(result, indent=2), encoding="utf-8")
        except OSError:
            pass
    return result


def main() -> None:
    print(json.dumps(validate(), indent=2))


if __name__ == "__main__":
    main()
