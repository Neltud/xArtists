"""
RWA Art Assessment Engine — Dynamic Value Score (0–100) + price proxy.
Paper valuation only. Not an appraisal for legal/insurance purposes.

  PYTHONPATH=. python -m lia.brain.rwa_evaluator
  PYTHONPATH=. python -m lia.brain.rwa_evaluator --reassess
"""
from __future__ import annotations

import argparse
import hashlib
import json
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

from lia.brain.sentiment_analyzer import analyze_market_sentiment, artist_popularity_boost

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
CATALOG = DATA / "rwa_catalog.json"


@dataclass
class WorkMeta:
    id: str
    title: str
    artist: str
    style: str = "contemporary"
    condition: str = "good"  # mint | good | fair | poor
    provenance: str = "gallery"  # gallery | private | auction | unknown
    medium: str = "mixed"
    year: int | None = None
    image_url: str = ""
    certificate_hash: str = ""  # sha256 of cert doc or placeholder


@dataclass
class Valuation:
    work_id: str
    score: float  # 0-100
    price_proxy_usd: float
    sentiment: float
    momentum: float
    factors: dict[str, float] = field(default_factory=dict)
    ts: str = ""
    paper: bool = True
    disclaimer: str = "Illustrative AI proxy — not a formal appraisal"


_CONDITION = {"mint": 1.0, "good": 0.85, "fair": 0.65, "poor": 0.4}
_PROVENANCE = {"gallery": 1.0, "auction": 0.95, "private": 0.8, "unknown": 0.55}


def _cert_hash(work: WorkMeta) -> str:
    if work.certificate_hash:
        return work.certificate_hash
    raw = f"{work.id}|{work.artist}|{work.title}|{work.year}".encode()
    return hashlib.sha256(raw).hexdigest()


def evaluate(work: WorkMeta, *, base_usd: float = 500.0) -> Valuation:
    sent = analyze_market_sentiment()
    pop = artist_popularity_boost(work.artist, work.style)
    cond = _CONDITION.get(work.condition.lower(), 0.7)
    prov = _PROVENANCE.get(work.provenance.lower(), 0.6)
    # Aesthetic base from style token length stability
    style_f = 0.5 + (sum(ord(c) for c in work.style) % 40) / 100.0
    score = (
        35 * cond
        + 25 * prov
        + 20 * style_f
        + 15 * (pop / 0.4 if pop else 0.5)
        + 10 * ((sent.score + 1) / 2)
    )
    score = max(0.0, min(100.0, score))
    # Momentum: sentiment + popularity delta proxy
    momentum = max(-1.0, min(1.0, sent.score * 0.6 + (pop - 0.2)))
    price = base_usd * (score / 50.0) * (1.0 + momentum * 0.15)
    return Valuation(
        work_id=work.id,
        score=round(score, 2),
        price_proxy_usd=round(price, 2),
        sentiment=sent.score,
        momentum=round(momentum, 4),
        factors={
            "condition": cond,
            "provenance": prov,
            "style": round(style_f, 3),
            "popularity": round(pop, 3),
            "market_sentiment": sent.score,
        },
        ts=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    )


def default_catalog() -> list[dict[str, Any]]:
    seeds = [
        WorkMeta("rwa_001", "Neon Atelier Study", "Atelier Neltud", "digital-physical", "good", "gallery", year=2025),
        WorkMeta("rwa_002", "Shard Memory #3", "Lia Collective", "abstract", "mint", "private", year=2024),
        WorkMeta("rwa_003", "Empire Wall Fragment", "xArtists Studio", "mixed-media", "good", "gallery", year=2026),
    ]
    out = []
    for w in seeds:
        v = evaluate(w)
        out.append(
            {
                **asdict(w),
                "certificate_hash": _cert_hash(w),
                "valuation": asdict(v),
                "shipment_status": "in_vault",
                "nft_nonce": None,
                "listed": False,
            }
        )
    return out


def load_catalog() -> list[dict[str, Any]]:
    if CATALOG.is_file():
        try:
            d = json.loads(CATALOG.read_text(encoding="utf-8"))
            items = d.get("items") if isinstance(d, dict) else d
            if isinstance(items, list) and items:
                return items
        except Exception:
            pass
    return default_catalog()


def save_catalog(items: list[dict[str, Any]]) -> Path:
    DATA.mkdir(parents=True, exist_ok=True)
    payload = {
        "schema": "rwa_catalog/v1",
        "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "paper": True,
        "items": items,
        "note": "AI valuation proxy — not legal appraisal; mint is HITL",
    }
    CATALOG.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    for dest in (
        ROOT / "apps" / "frontend" / "public" / "data" / "rwa_catalog.json",
        ROOT / "docs" / "data" / "rwa_catalog.json",
    ):
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        except OSError:
            pass
    return CATALOG


def reassess_all() -> dict[str, Any]:
    items = load_catalog()
    updated = []
    for it in items:
        w = WorkMeta(
            id=str(it.get("id")),
            title=str(it.get("title") or ""),
            artist=str(it.get("artist") or ""),
            style=str(it.get("style") or "contemporary"),
            condition=str(it.get("condition") or "good"),
            provenance=str(it.get("provenance") or "gallery"),
            medium=str(it.get("medium") or "mixed"),
            year=it.get("year"),
            image_url=str(it.get("image_url") or ""),
            certificate_hash=str(it.get("certificate_hash") or ""),
        )
        v = evaluate(w)
        it = {**it, "valuation": asdict(v), "certificate_hash": _cert_hash(w)}
        updated.append(it)
    path = save_catalog(updated)
    try:
        from lia.utils.audit_log import audit

        audit("rwa_reassess", n=len(updated), path=str(path))
    except Exception:
        pass
    return {"reassessed": len(updated), "path": str(path)}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--reassess", action="store_true")
    args = ap.parse_args()
    if args.reassess:
        print(json.dumps(reassess_all(), indent=2))
        return
    items = load_catalog()
    if not CATALOG.is_file():
        save_catalog(items)
    print(json.dumps({"items": len(items), "sample": items[0] if items else None}, indent=2))


if __name__ == "__main__":
    main()
