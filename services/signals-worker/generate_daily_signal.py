#!/usr/bin/env python3
"""
Daily patronage / macro signal JSON (paper-honest, no auto trade).
Writes data/signals/daily_signal.json + frontend public copy.
Secrets: none required for deterministic scaffold; optional OPENAI later.
"""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUTS = [
    ROOT / "data" / "signals" / "daily_signal.json",
    ROOT / "apps" / "frontend" / "public" / "data" / "signals" / "daily_signal.json",
]


def build_signal() -> dict:
    now = datetime.now(timezone.utc)
    # Scaffold: structured, clearly labeled paper / editorial — not investment advice
    return {
        "schema": "xartists_daily_signal/v1",
        "generated_at": now.isoformat(),
        "date": now.strftime("%Y-%m-%d"),
        "regime": "neutral",
        "confidence": 0.45,
        "headline": "Observation macro — pas un conseil d'investissement",
        "summary": (
            "Signal éditorial du mécénat : volatilité surveillée, liquidité à préserver. "
            "Aucune exécution automatique. Le Machine (Guardian) reste le seul chemin d'ordre."
        ),
        "macro": {
            "usd_liquidity": "watch",
            "risk_appetite": "mixed",
            "notes": ["Données à enrichir via API prix ops — placeholder honnête."],
        },
        "crypto": {
            "egld": "neutral",
            "tro": "observe",
            "notes": ["Pas de promesse de rendement."],
        },
        "patronage": {
            "rebalance_hint": "hold",
            "pulse_focus": "education_over_leverage",
        },
        "disclaimer": (
            "Contenu informatif / éducatif. Pas un conseil financier. "
            "Aucune TX n'est déclenchée par ce fichier."
        ),
        "source": "signals-worker",
    }


def main() -> int:
    body = build_signal()
    text = json.dumps(body, indent=2, ensure_ascii=False) + "\n"
    for p in OUTS:
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text, encoding="utf-8")
        print("wrote", p)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
