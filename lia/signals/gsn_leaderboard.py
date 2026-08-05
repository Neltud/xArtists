"""
GreenSmoke leaderboard → score input BEFORE LIA trade execution.
GSN agents = external forecasts; LIA packs = separate product.
Never execute on GSN alone; cap weight aligned social/GSN policy.
"""
from __future__ import annotations

import json
import time
import urllib.request
from pathlib import Path
from typing import Any, Optional

_ROOT = Path(__file__).resolve().parents[2]
OUT = _ROOT / "data" / "gsn_leaderboard_score.json"
DEFAULT_FEED = (
    "https://raw.githubusercontent.com/Neltud/xArtists/main/data/greensmoke_forecasts.json"
)
GSN_MAX_WEIGHT = 0.30


def fetch_gsn(url: str = DEFAULT_FEED) -> dict[str, Any]:
    try:
        req = urllib.request.Request(url + f"?t={int(time.time())}", headers={"User-Agent": "xArtists-LIA"})
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read().decode())
    except Exception as e:
        return {"error": str(e), "agents": {}}


def leaderboard_from_forecasts(data: dict[str, Any]) -> list[dict[str, Any]]:
    agents = data.get("agents") or {}
    rows = []
    for aid, a in agents.items():
        if not isinstance(a, dict):
            continue
        conf = float(a.get("confidence_avg") or 0)
        # normalize if 0-100
        if conf > 1:
            conf = conf / 100.0
        rows.append(
            {
                "id": aid,
                "name": a.get("name") or aid,
                "domain": a.get("domain") or "",
                "confidence": conf,
                "status": a.get("status") or "",
                "platform": "greensmoke",
                "product": "external_forecast",  # NOT lia_subagent_pack
            }
        )
    rows.sort(key=lambda x: x["confidence"], reverse=True)
    return rows


def score_for_lia_gate(rows: list[dict[str, Any]], agg: Optional[dict] = None) -> dict[str, Any]:
    """
    Top leaderboard confidence → advisory score in [0, GSN_MAX_WEIGHT].
    Used as pre-trade check, not as sole execute signal.
    """
    top = rows[:5] if rows else []
    avg = sum(r["confidence"] for r in top) / len(top) if top else 0.0
    weight = min(GSN_MAX_WEIGHT, avg * GSN_MAX_WEIGHT)
    regime = (agg or {}).get("regime") or "unknown"
    primary = (agg or {}).get("primary") or ""
    return {
        "ok": True,
        "gsn_weight": round(weight, 4),
        "top_avg_confidence": round(avg, 4),
        "top": top,
        "regime": regime,
        "primary": primary,
        "note": "Advisory only — LIA defense/modes still gate execution",
        "not": "lia_subagent_pack",
    }


def run(persist: bool = True) -> dict[str, Any]:
    data = fetch_gsn()
    rows = leaderboard_from_forecasts(data)
    score = score_for_lia_gate(rows, data.get("aggregated_signals") or {})
    out = {"updated": time.time(), "leaderboard": rows[:20], "score": score}
    if persist:
        OUT.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    return out


if __name__ == "__main__":
    print(json.dumps(run(), indent=2)[:2000])
