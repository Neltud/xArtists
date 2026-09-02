"""
GreenSmoke leaderboard → score input BEFORE LIA trade execution.
Only top agents with accuracy/confidence >= MIN_ACCURACY (default 0.80).
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
MIN_ACCURACY = 0.80  # only agents >= 80% accurate (or confidence proxy)


def fetch_gsn(url: str = DEFAULT_FEED) -> dict[str, Any]:
    try:
        req = urllib.request.Request(
            url + f"?t={int(time.time())}", headers={"User-Agent": "xArtists-LIA"}
        )
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read().decode())
    except Exception as e:
        return {"error": str(e), "agents": {}}


def _norm_score(v: Any) -> float:
    try:
        x = float(v or 0)
    except (TypeError, ValueError):
        return 0.0
    if x > 1.0:
        x = x / 100.0
    return max(0.0, min(1.0, x))


def leaderboard_from_forecasts(
    data: dict[str, Any], *,
    min_accuracy: float = MIN_ACCURACY,
) -> list[dict[str, Any]]:
    agents = data.get("agents") or {}
    # also accept list form
    if isinstance(agents, list):
        iterable = {str(a.get("id") or i): a for i, a in enumerate(agents) if isinstance(a, dict)}
    elif isinstance(agents, dict):
        iterable = agents
    else:
        iterable = {}

    rows = []
    for aid, a in iterable.items():
        if not isinstance(a, dict):
            continue
        # prefer explicit accuracy; fallback confidence_avg / reputation
        acc = _norm_score(
            a.get("accuracy")
            or a.get("accuracy_pct")
            or a.get("hit_rate")
            or a.get("confidence_avg")
            or a.get("reputation")
            or a.get("confidence")
            or 0
        )
        if acc < min_accuracy:
            continue
        conf = _norm_score(a.get("confidence") or a.get("confidence_avg") or acc)
        rows.append(
            {
                "id": aid,
                "name": a.get("name") or aid,
                "domain": a.get("domain") or "",
                "accuracy": acc,
                "confidence": conf,
                "bias": str(a.get("bias") or a.get("signal") or "WAIT").upper(),
                "status": a.get("status") or "",
                "platform": "greensmoke",
                "product": "external_forecast",
            }
        )
    rows.sort(key=lambda x: (x["accuracy"], x["confidence"]), reverse=True)
    return rows


def score_for_lia_gate(
    rows: list[dict[str, Any]],
    agg: Optional[dict] = None,
    *,
    min_accuracy: float = MIN_ACCURACY,
) -> dict[str, Any]:
    """Top >=80% agents → advisory score in [0, GSN_MAX_WEIGHT]."""
    elite = [r for r in rows if r.get("accuracy", 0) >= min_accuracy]
    top = elite[:5] if elite else []
    avg = sum(r["confidence"] for r in top) / len(top) if top else 0.0
    avg_acc = sum(r["accuracy"] for r in top) / len(top) if top else 0.0
    weight = min(GSN_MAX_WEIGHT, avg_acc * GSN_MAX_WEIGHT) if top else 0.0
    # majority bias among elite
    buys = sum(1 for r in top if r.get("bias") == "BUY")
    sells = sum(1 for r in top if r.get("bias") == "SELL")
    bias = "BUY" if buys > sells else ("SELL" if sells > buys else "WAIT")
    regime = (agg or {}).get("regime") or "unknown"
    return {
        "ok": True,
        "gsn_weight": round(weight, 4),
        "top_avg_confidence": round(avg, 4),
        "top_avg_accuracy": round(avg_acc, 4),
        "min_accuracy_gate": min_accuracy,
        "n_elite": len(elite),
        "bias": bias,
        "top": top,
        "regime": regime,
        "note": "Advisory only — LIA guardian/modes still gate execution; never sole signal",
        "not": "lia_subagent_pack",
    }


def run(persist: bool = True, min_accuracy: float = MIN_ACCURACY) -> dict[str, Any]:
    data = fetch_gsn()
    rows = leaderboard_from_forecasts(data, min_accuracy=min_accuracy)
    score = score_for_lia_gate(rows, data.get("aggregated_signals") or {}, min_accuracy=min_accuracy)
    out = {
        "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "min_accuracy": min_accuracy,
        "leaderboard": rows[:20],
        "score": score,
    }
    if persist:
        OUT.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    return out


if __name__ == "__main__":
    print(json.dumps(run(), indent=2)[:2500])
