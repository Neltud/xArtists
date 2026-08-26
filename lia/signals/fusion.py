"""
LIA signal fusion: core LIA + GSN(>=80%) + Polymarket + free multi-domain + social.
Never executes alone. Caps external weights. Protective SELL preserved.
"""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

_ROOT = Path(__file__).resolve().parents[2]
OUT = _ROOT / "data" / "lia_signal_fusion.json"
TICKER_OUT = _ROOT / "data" / "signal_ticker.json"


def _safe(mod_run) -> dict[str, Any]:
    try:
        return mod_run(persist=True)
    except Exception as e:
        return {"error": str(e)}


def fuse(
    lia_decision: str = "WAIT",
    lia_confidence: float = 0.5,
) -> dict[str, Any]:
    from lia.signals import gsn_leaderboard, polymarket_feed, free_feeds
    from lia.signals.social_intel import SocialIntel

    gsn = _safe(gsn_leaderboard.run)
    poly = _safe(polymarket_feed.run)
    free = _safe(free_feeds.run)
    try:
        social = SocialIntel().run(persist=True).to_dict()
    except Exception as e:
        social = {"bias": "WAIT", "weight": 0.0, "n": 0, "error": str(e)}

    gsn_score = gsn.get("score") or {}
    poly_agg = (poly.get("aggregate") or {}) if isinstance(poly, dict) else {}
    free_agg = (free.get("aggregate") or {}) if isinstance(free, dict) else {}

    # Collect advisory votes with weights
    votes: list[tuple[str, float]] = []
    if gsn_score.get("n_elite", 0) > 0 and gsn_score.get("gsn_weight", 0) > 0:
        votes.append((gsn_score.get("bias") or "WAIT", float(gsn_score.get("gsn_weight") or 0)))
    if poly_agg.get("n", 0) > 0:
        votes.append((poly_agg.get("bias") or "WAIT", float(poly_agg.get("weight") or 0)))
    if free_agg.get("n", 0) > 0:
        votes.append((free_agg.get("bias") or "WAIT", float(free_agg.get("weight") or 0)))
    if social.get("n", 0) > 0 and float(social.get("weight") or 0) > 0:
        votes.append((social.get("bias") or "WAIT", float(social.get("weight") or 0)))

    ext_score = 0.0
    ext_w = 0.0
    for bias, w in votes:
        delta = 1.0 if bias == "BUY" else (-1.0 if bias == "SELL" else 0.0)
        ext_score += w * delta
        ext_w += w
    ext_norm = ext_score / ext_w if ext_w else 0.0

    decision = lia_decision
    confidence = lia_confidence
    source = "lia_primary"

    # Protect strong LIA SELL
    if lia_decision == "SELL" and lia_confidence >= 0.6:
        decision, confidence, source = "SELL", lia_confidence, "lia_sell_protected"
    elif lia_decision == "BUY" and ext_norm < -0.15 and lia_confidence < 0.75:
        decision, confidence, source = "WAIT", 0.42, "external_conflict_wait"
    elif lia_decision == lia_decision and any(b == lia_decision for b, _ in votes):
        # agreement boost
        agree_w = sum(w for b, w in votes if b == lia_decision)
        confidence = min(0.93, lia_confidence + agree_w * 0.12)
        source = "lia+external_agree"
        decision = lia_decision
    elif lia_decision == "WAIT" and abs(ext_norm) > 0.25 and ext_w >= 0.1:
        decision = "BUY" if ext_norm > 0 else "SELL"
        confidence = min(0.55, 0.35 + abs(ext_norm) * 0.3)
        source = "external_lean_weak"  # still needs guardian

    result = {
        "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "mode": "paper_advisory",
        "live_trading": False,
        "input": {"lia_decision": lia_decision, "lia_confidence": lia_confidence},
        "fused": {
            "decision": decision,
            "confidence": round(confidence, 4),
            "source": source,
            "external_norm": round(ext_norm, 4),
            "external_weight_sum": round(ext_w, 4),
        },
        "legs": {
            "gsn": gsn_score,
            "polymarket": {k: poly_agg.get(k) for k in ("bias", "weight", "n", "score")},
            "free_feeds": {k: free_agg.get(k) for k in ("bias", "weight", "n", "blend_score")},
            "social": {k: social.get(k) for k in ("bias", "weight", "n", "rumor_flag")},
        },
        "note": "Fusion advisory only — Guardian + Intent required before any live size",
    }

    # Ticker lines for UI
    lines: list[str] = []
    if gsn_score.get("top"):
        t0 = gsn_score["top"][0]
        lines.append(
            f"GSN {t0.get('name', t0.get('id'))} acc={float(t0.get('accuracy') or 0):.0%} bias={t0.get('bias')}"
        )
    for m in (poly_agg.get("markets") or [])[:3]:
        lines.append(f"Polymarket {m.get('yes_prob', 0):.0%} · {str(m.get('question') or '')[:60]}")
    for it in (free.get("items") or [])[:5]:
        lines.append(f"{it.get('domain', '?').upper()} · {it.get('title', '')[:70]}")
    lines.append(
        f"LIA fusion {decision} conf={confidence:.2f} src={source} · PAPER"
    )

    ticker = {
        "updated": result["updated"],
        "lines": lines,
        "fused": result["fused"],
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    TICKER_OUT.write_text(json.dumps(ticker, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return result


def run(persist: bool = True) -> dict[str, Any]:
    return fuse("WAIT", 0.5)


if __name__ == "__main__":
    print(json.dumps(fuse("WAIT", 0.55), indent=2, ensure_ascii=False)[:3000])
