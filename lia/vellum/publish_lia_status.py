"""
Aggregator — single public snapshot for LIA Hub (Task 1 + Task 2 friction).

  PYTHONPATH=. python -m lia.vellum.publish_lia_status
"""
from __future__ import annotations

import json
import time
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
API = "https://api.multiversx.com"
LIA_WALLET = "erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6"


def _ts() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _read(name: str) -> dict[str, Any] | list[Any] | None:
    path = DATA / name
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def _get_json(url: str, timeout: float = 15.0) -> Any:
    req = urllib.request.Request(url, headers={"User-Agent": "xArtists-lia-status/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


def fetch_onchain() -> dict[str, Any]:
    out: dict[str, Any] = {
        "address": LIA_WALLET,
        "egld": None,
        "egld_usd": None,
        "tokens": [],
        "tx_count": None,
        "error": None,
    }
    try:
        acc = _get_json(f"{API}/accounts/{LIA_WALLET}")
        egld = int(acc.get("balance") or 0) / 1e18
        out["egld"] = round(egld, 6)
        out["tx_count"] = acc.get("txCount")
        egld_usd = None
        try:
            econ = _get_json(f"{API}/economics")
            price = float(econ.get("price") or 0)
            if price > 0:
                egld_usd = round(egld * price, 4)
                out["egld_usd"] = egld_usd
        except Exception:
            pass
        toks = _get_json(f"{API}/accounts/{LIA_WALLET}/tokens?size=20")
        if isinstance(toks, list):
            for t in toks[:12]:
                dec = int(t.get("decimals") or 18)
                raw = int(t.get("balance") or 0)
                bal = raw / (10**dec)
                if bal <= 0:
                    continue
                out["tokens"].append(
                    {
                        "identifier": t.get("identifier"),
                        "ticker": t.get("ticker")
                        or str(t.get("identifier") or "").split("-")[0],
                        "balance": round(bal, 6),
                    }
                )
        out["_egld_usd_num"] = egld_usd or 20.0
    except Exception as e:
        out["error"] = str(e)
        out["_egld_usd_num"] = 20.0
    return out


def shadow_summary(egld_usd: float = 20.0) -> dict[str, Any]:
    paper = _read("lia_paper_legs.json") or {}
    legs = paper.get("legs") if isinstance(paper, dict) else None
    if not isinstance(legs, list):
        legs = []

    try:
        from lia.shadow.friction import enrich_legs

        enriched = enrich_legs(legs, egld_usd=egld_usd)
    except Exception:
        enriched = [dict(x) for x in legs if isinstance(x, dict)]

    wins = 0
    pnl = 0.0
    last5: list[dict[str, Any]] = []
    for leg in enriched:
        if not isinstance(leg, dict):
            continue
        p = float(leg.get("pnl_usd") or leg.get("pnl") or 0)
        pnl += p
        if p > 0:
            wins += 1
        last5.append(
            {
                "id": leg.get("id"),
                "side": leg.get("side"),
                "asset": leg.get("asset"),
                "pnl_usd": round(p, 4),
                "ts": leg.get("ts"),
            }
        )
    last5 = last5[-5:]
    n = len(enriched)
    return {
        "fills": n,
        "shadow_pnl_usd": round(pnl, 4),
        "win_rate": round(wins / n, 4) if n else None,
        "last_shadow": last5,
        "source": "lia_paper_legs.json+friction" if n else "empty",
        "friction_model": {
            "gas_egld_per_fill": 0.0008,
            "slippage": "liquidity_impact_0.05pct_to_2.5pct",
        },
    }


def mindset() -> dict[str, Any]:
    last = _read("vellum_last_run.json") or {}
    status = _read("lia_v6_status.json") or {}
    hub = _read("lia_hub_status.json") or {}
    summary = last.get("summary") if isinstance(last, dict) else {}
    if not isinstance(summary, dict):
        summary = {}
    orch = status.get("orchestrator") if isinstance(status, dict) else {}
    if not isinstance(orch, dict):
        orch = {}
    return {
        "strategy": summary.get("mode")
        or orch.get("mode")
        or (hub.get("strategy") if isinstance(hub, dict) else None),
        "confidence": hub.get("confidence") if isinstance(hub, dict) else None,
        "vellum_ts": last.get("ts") if isinstance(last, dict) else None,
        "vellum_ok": summary.get("ok"),
        "guardian_allow": summary.get("guardian_allow"),
        "LIA_LIVE_TRADING": 0,
    }


def build() -> dict[str, Any]:
    onchain = fetch_onchain()
    egld_usd = float(onchain.pop("_egld_usd_num", 20.0) or 20.0)
    shadow = shadow_summary(egld_usd=egld_usd)
    mind = mindset()
    pnl = float(shadow.get("shadow_pnl_usd") or 0)
    aura_mode, aura_trend = "stable", "flat"
    if pnl > 0.5:
        aura_mode, aura_trend = "bull", "up"
    elif pnl < -0.5:
        aura_mode, aura_trend = "bear", "down"
    elif int(shadow.get("fills") or 0) > 0:
        aura_mode = "reward"
    aura = {
        "mode": aura_mode,
        "trend": aura_trend,
        "confidence": mind.get("confidence"),
        "source": "publish_lia_status",
    }
    return {
        "schema": "lia_status/v1",
        "ts": _ts(),
        "paper": True,
        "LIA_LIVE_TRADING": 0,
        "onchain": onchain,
        "mindset": mind,
        "shadow": shadow,
        "aura": aura,
        "links": {
            "explorer": f"https://explorer.multiversx.com/accounts/{LIA_WALLET}",
            "hub": "https://neltud.github.io/xArtists/#/lia",
        },
        "note": "Aggregated snapshot — paper/shadow with friction; not live trading",
    }


def publish() -> dict[str, Any]:
    payload = build()
    raw = json.dumps(payload, indent=2)
    targets = [
        DATA / "lia_status.json",
        ROOT / "docs" / "data" / "lia_status.json",
        ROOT / "apps" / "frontend" / "public" / "data" / "lia_status.json",
    ]
    written: list[str] = []
    for dest in targets:
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(raw, encoding="utf-8")
            written.append(str(dest))
        except OSError:
            pass
    # M2 — light server shadow export (file, not full SQL)
    try:
        export = {
            "schema": "lia_shadow_export/v1",
            "ts": payload.get("ts"),
            "paper": True,
            "fills": (payload.get("shadow") or {}).get("fills"),
            "shadow_pnl_usd": (payload.get("shadow") or {}).get("shadow_pnl_usd"),
            "win_rate": (payload.get("shadow") or {}).get("win_rate"),
            "last_shadow": (payload.get("shadow") or {}).get("last_shadow"),
            "friction_model": (payload.get("shadow") or {}).get("friction_model"),
            "source": (payload.get("shadow") or {}).get("source"),
            "note": "Server shadow export — zero real capital",
        }
        for dest in [
            DATA / "lia_shadow_export.json",
            ROOT / "apps" / "frontend" / "public" / "data" / "lia_shadow_export.json",
            ROOT / "docs" / "data" / "lia_shadow_export.json",
        ]:
            try:
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_text(json.dumps(export, indent=2), encoding="utf-8")
                written.append(str(dest))
            except OSError:
                pass
    except Exception:
        pass
    payload["written"] = written
    return payload


if __name__ == "__main__":
    print(json.dumps(publish(), indent=2))
