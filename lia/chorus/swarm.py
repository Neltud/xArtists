"""Chorus swarm — cross-cut 120 signals. Paper only. ChatGPT is advisory."""
from __future__ import annotations

import json
import math
import statistics
import time
from typing import Any, Optional

from lia.chorus.catalog import FAMILIES, catalog

LIVE_LOCKED = True
CHATGPT_CAP = 0.15

ROLES = (
    {"id": "scout", "owns": ("onchain", "dex"), "job": "lecture chaîne et écarts DEX"},
    {"id": "tape", "owns": ("price", "volume", "volatility", "liquidity", "funding"), "job": "bande de marché"},
    {"id": "crowd", "owns": ("social",), "job": "présence publique, pas un ordre"},
    {"id": "curator", "owns": ("art",), "job": "marché de l'art et des collections"},
    {"id": "sentinel", "owns": ("risk",), "job": "veto. ne trade pas"},
    {"id": "macro", "owns": ("macro",), "job": "contexte, pas un signal d'entrée"},
    {"id": "chair", "owns": ("external",), "job": "brief ChatGPT / autres LLM, poids plafonné"},
    {"id": "scribe", "owns": (), "job": "écrit le board paper, ne signe rien"},
)


def _clip(x: float) -> float:
    return max(-1.0, min(1.0, x))


def _num(market: dict[str, Any], *keys: str) -> Optional[float]:
    """Only finite measured numbers count as data. No bool, NaN or Infinity."""
    for k in keys:
        if k in market and market[k] is not None and market[k] != "":
            value = market[k]
            if isinstance(value, bool):
                return None
            try:
                number = float(value)
            except (TypeError, ValueError, OverflowError):
                return None
            return number if math.isfinite(number) else None
    return None


def _brief_score(market: dict[str, Any]) -> tuple[float, str]:
    """External chair may vote only with an explicit bounded, finite stance."""
    brief = market.get("chatgpt_brief") or market.get("external_brief")
    if brief is None:
        return 0.0, "awaiting_chatgpt_brief"
    if not isinstance(brief, dict):
        return 0.0, "invalid_brief"
    stance = brief.get("stance")
    confidence = brief.get("confidence")
    if stance not in ("abstain", "flat", "long", "short") or isinstance(confidence, bool):
        return 0.0, "invalid_brief"
    try:
        conf = float(confidence)
    except (TypeError, ValueError, OverflowError):
        return 0.0, "invalid_brief"
    if not math.isfinite(conf) or not 0.0 <= conf <= 1.0:
        return 0.0, "invalid_brief"
    if stance == "abstain" or conf == 0.0:
        return 0.0, "abstain"
    return _clip({"long": 0.6, "short": -0.6, "flat": 0.0}[stance] * conf), "scored"


def score_signal(sig: dict[str, Any], market: dict[str, Any]) -> dict[str, Any]:
    fam, axis = sig["family"], sig["axis"]
    status = "scored"
    score = 0.0

    if fam == "external" and axis == "chatgpt_brief":
        score, status = _brief_score(market)
    elif fam == "external":
        status = "unused_slot"
    elif fam == "price" and axis == "ret_1h":
        v = _num(market, "price_change_1h")
        score = _clip((v or 0) / 3) if v is not None else 0.0
        status = "scored" if v is not None else "no_input"
    elif fam == "price" and axis == "ret_24h":
        v = _num(market, "price_change_24h")
        score = _clip((v or 0) / 8) if v is not None else 0.0
        status = "scored" if v is not None else "no_input"
    elif fam == "price" and axis == "rsi_zone":
        v = _num(market, "rsi_14")
        if v is None:
            status = "no_input"
        else:
            score = _clip((50 - v) / 25)
    elif fam == "price" and axis == "vwap_dev":
        price, vwap = _num(market, "price"), _num(market, "vwap_24h")
        if price and vwap:
            score = _clip((price - vwap) / vwap * 5)
        else:
            status = "no_input"
    elif fam == "volume" and axis == "spike_1h":
        v = _num(market, "volume_spike")
        if v is None:
            status = "no_input"
        else:
            score = _clip((v - 1) / 2)
    elif fam == "liquidity" and axis == "pool_usd":
        v = _num(market, "liquidity_usd")
        if v is None:
            status = "no_input"
        else:
            score = _clip((v - 50_000) / 200_000)
    elif fam == "risk" and axis == "drawdown":
        v = _num(market, "drawdown")
        if v is None:
            status = "no_input"
        else:
            score = _clip(-abs(v) * 4)
    elif fam == "risk" and axis == "payable_flag":
        if market.get("slot_payable") is False:
            score = -0.8
            status = "scored"
        else:
            status = "no_input"
    elif fam == "risk" and axis == "house_low":
        v = _num(market, "slot_balance_egld")
        if v is None:
            status = "no_input"
        elif v < 0.5:
            score = -1.0
        else:
            score = 0.2
    elif fam == "dex" and axis == "xex_vs_onedex":
        a, b = _num(market, "price_dex_a"), _num(market, "price_dex_b")
        if a and b:
            score = _clip((a - b) / b * 20)
        else:
            status = "no_input"
    elif fam == "macro" and axis == "egld_usd":
        v = _num(market, "egld_usd")
        status = "context_only" if v is not None else "no_input"
        score = 0.0
    else:
        status = "defined_unfed"

    return {**sig, "score": round(score, 4), "status": status}


def _family_means(rows: list[dict[str, Any]]) -> dict[str, float]:
    out: dict[str, float] = {}
    for fam in FAMILIES:
        vals = [r["score"] for r in rows if r["family"] == fam and r["status"] == "scored"]
        out[fam] = round(sum(vals) / len(vals), 4) if vals else 0.0
    return out


def crosscut(rows: list[dict[str, Any]], means: dict[str, float]) -> dict[str, Any]:
    fed_fams = []
    for fam in FAMILIES:
        if fam == "external":
            continue
        if any(r["family"] == fam and r["status"] == "scored" for r in rows):
            fed_fams.append(means[fam])
    core = sum(fed_fams) / len(fed_fams) if fed_fams else 0.0
    ext = max(-CHATGPT_CAP, min(CHATGPT_CAP, means["external"] * CHATGPT_CAP))
    # True weighted blend: the chair cannot exceed a 15% contribution.
    blended = (1 - CHATGPT_CAP) * core + ext
    dissent = statistics.pstdev(fed_fams) if len(fed_fams) > 1 else 1.0
    agreement = round(1 - min(1.0, dissent), 4) if len(fed_fams) > 1 else 0.0
    risk = means["risk"]
    fed = sum(1 for r in rows if r["status"] == "scored")
    if fed < 12 or len(fed_fams) < 3:
        stance, reason = "ABSTAIN", "thin_tape"
    elif risk <= -0.35:
        stance, reason = "ABSTAIN", "risk_veto"
    elif agreement < 0.45:
        stance, reason = "ABSTAIN", "low_agreement"
    elif blended > 0.12:
        stance, reason = "PAPER_BIAS_LONG", "crosscut"
    elif blended < -0.12:
        stance, reason = "PAPER_BIAS_SHORT", "crosscut"
    else:
        stance, reason = "PAPER_FLAT", "crosscut"
    return {
        "stance": stance,
        "reason": reason,
        "core": round(core, 4),
        "external_capped": round(ext, 4),
        "blended": round(blended, 4),
        "agreement": agreement,
        "dissent": round(dissent, 4),
        "families_fed": len(fed_fams),
        "signals_defined": len(rows),
        "signals_fed": fed,
        "executable": False,
        "live_trading": False,
    }


def handoff_for_chatgpt(board: dict[str, Any]) -> str:
    c = board["crosscut"]
    return (
        "CHORUS → ChatGPT (lecture seule, pas d'ordre, pas de clé).\n"
        f"Stance paper: {c['stance']} ({c['reason']}).\n"
        f"Signaux définis {c['signals_defined']}, alimentés {c['signals_fed']}. "
        f"Accord {c['agreement']}. Risque famille {board['families'].get('risk')}.\n"
        "Réponds par un brief: stance (flat|long|short|abstain), confidence 0-1, "
        "3 faits vérifiables, 1 risque. N'invente pas de prix. Ne demande pas de PEM."
    )


def run_chorus(
    *,
    market: Optional[dict[str, Any]] = None,
    chatgpt_brief: Any = None,
) -> dict[str, Any]:
    m = dict(market or {})
    if chatgpt_brief is not None:
        m["chatgpt_brief"] = chatgpt_brief
    # Missing chain evidence stays unscored. Never infer Slot non-payability.
    rows = [score_signal(s, m) for s in catalog()]
    means = _family_means(rows)
    cut = crosscut(rows, means)
    board = {
        "engine": "chorus",
        "version": "1.0.0",
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "replaces": "vellum",
        "live_trading": False,
        "live_locked": LIVE_LOCKED,
        "roles": list(ROLES),
        "families": means,
        "crosscut": cut,
        "signals": rows,
        "symbiosis": {
            "chatgpt": "advisory brief only, weight capped at 15%",
            "grok": "operator of this repo path",
            "signs": False,
        },
    }
    board["handoff_for_chatgpt"] = handoff_for_chatgpt(board)
    return board


def main() -> None:
    print(json.dumps(run_chorus(), indent=2))


if __name__ == "__main__":
    main()
