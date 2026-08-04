"""
Social intelligence for LIA — X/Twitter, Reddit, news headlines.

Design (aligned with GreenSmokeConsumer):
- Never executes trades alone
- weight_cap default 0.15 (below GSN max_external_weight 0.3)
- rumor_flag blocks any live-leaning BUY bias upgrade
- Missing APIs → WAIT, n=0, no crash

Fetchers are injectable (tests / Vellum secrets). Default = offline from
pre-fetched JSON files under data/.
"""
from __future__ import annotations

import json
import re
import time
from dataclasses import dataclass, asdict, field
from pathlib import Path
from typing import Any, Callable, Optional

_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_WATCHLIST = _ROOT / "data" / "social_watchlist.json"
DEFAULT_OUT = _ROOT / "data" / "social_intel.json"

# Keyword heuristics (EN/FR) — tunable via watchlist
BULLISH_RE = re.compile(
    r"\b(bullish|accumulate|breakout|ath|rally|upgrade|mainnet\s+live|"
    r"partnership|listing|risk[\s_]?on|haussier|accumulation)\b",
    re.I,
)
BEARISH_RE = re.compile(
    r"\b(bearish|dump|hack|exploit|sec\s+charge|bankrupt|delist|"
    r"risk[\s_]?off|crash|baissier|rug)\b",
    re.I,
)
RUMOR_RE = re.compile(
    r"\b(rumor|rumour|allegedly|unconfirmed|leaked|insider\s+says|"
    r"rumeur|non\s+confirmé|on\s+dit\s+que)\b",
    re.I,
)


@dataclass
class SocialItem:
    source: str  # x | reddit | news | manual
    text: str
    weight: float = 1.0
    url: str = ""
    ts: float = 0.0


@dataclass
class SocialBias:
    bias: str  # BUY | SELL | WAIT
    confidence: float
    weight: float
    rumor_flag: bool
    n: int
    items: list[dict[str, Any]] = field(default_factory=list)
    updated: float = 0.0
    source: str = "social_intel"

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def load_watchlist(path: Optional[Path] = None) -> dict[str, Any]:
    p = path or DEFAULT_WATCHLIST
    if not p.exists():
        return {
            "keywords": ["EGLD", "MultiversX", "TRO-94c925", "xArtists", "Supernova"],
            "reddit_subs": ["MultiversX", "defi"],
            "x_accounts": [],
            "weight_cap": 0.15,
            "rumor_keywords": ["rumor", "allegedly", "unconfirmed"],
        }
    return json.loads(p.read_text(encoding="utf-8"))


def score_text(text: str) -> tuple[float, bool]:
    """Return (delta in [-1,1], is_rumor)."""
    if not text or not text.strip():
        return 0.0, False
    bull = len(BULLISH_RE.findall(text))
    bear = len(BEARISH_RE.findall(text))
    rumor = bool(RUMOR_RE.search(text))
    raw = bull - bear
    if raw == 0:
        delta = 0.0
    else:
        delta = max(-1.0, min(1.0, raw / max(bull + bear, 1)))
    return delta, rumor


def analyze_items(
    items: list[SocialItem],
    *,
    weight_cap: float = 0.15,
    now: Optional[float] = None,
) -> SocialBias:
    now = time.time() if now is None else now
    if not items:
        return SocialBias("WAIT", 0.0, 0.0, False, 0, [], now)

    score = 0.0
    wsum = 0.0
    any_rumor = False
    out_items: list[dict[str, Any]] = []

    for it in items:
        delta, rumor = score_text(it.text)
        any_rumor = any_rumor or rumor
        w = max(0.0, float(it.weight))
        score += w * delta
        wsum += w
        out_items.append(
            {
                "source": it.source,
                "summary": it.text[:240],
                "delta": round(delta, 3),
                "rumor": rumor,
                "weight": w,
                "url": it.url,
            }
        )

    norm = score / wsum if wsum else 0.0
    bias = "BUY" if norm > 0.25 else ("SELL" if norm < -0.25 else "WAIT")
    confidence = min(0.85, abs(norm))
    weight = min(weight_cap, abs(norm) * weight_cap)

    # Rumor: never promote BUY; force WAIT or keep SELL caution
    if any_rumor and bias == "BUY":
        bias = "WAIT"
        confidence *= 0.5
        weight = min(weight, weight_cap * 0.5)

    return SocialBias(
        bias=bias,
        confidence=round(confidence, 4),
        weight=round(weight, 4),
        rumor_flag=any_rumor,
        n=len(items),
        items=out_items[:50],
        updated=now,
    )


def load_items_from_json(path: Path) -> list[SocialItem]:
    """Offline feed: data/social_feed.json list of {source,text,weight?,url?}."""
    if not path.exists():
        return []
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []
    rows = raw if isinstance(raw, list) else raw.get("items", [])
    out: list[SocialItem] = []
    for r in rows:
        if not isinstance(r, dict):
            continue
        text = str(r.get("text") or r.get("title") or "")
        if not text.strip():
            continue
        out.append(
            SocialItem(
                source=str(r.get("source") or "manual"),
                text=text,
                weight=float(r.get("weight") or 1.0),
                url=str(r.get("url") or ""),
                ts=float(r.get("ts") or 0),
            )
        )
    return out


class SocialIntel:
    """
    Permanent-watch helper: load watchlist, offline feed, optional fetchers.
    Fetcher signature: () -> list[SocialItem]
    """

    def __init__(
        self,
        watchlist_path: Optional[Path] = None,
        feed_path: Optional[Path] = None,
        out_path: Optional[Path] = None,
        fetchers: Optional[list[Callable[[], list[SocialItem]]]] = None,
    ):
        self.watchlist_path = watchlist_path or DEFAULT_WATCHLIST
        self.feed_path = feed_path or (_ROOT / "data" / "social_feed.json")
        self.out_path = out_path or DEFAULT_OUT
        self.fetchers = fetchers or []

    def collect(self) -> list[SocialItem]:
        items = load_items_from_json(self.feed_path)
        for fn in self.fetchers:
            try:
                items.extend(fn() or [])
            except Exception:
                # API down must not break LIA cycle
                continue
        return items

    def run(self, *, persist: bool = True) -> SocialBias:
        wl = load_watchlist(self.watchlist_path)
        cap = float(wl.get("weight_cap") or 0.15)
        items = self.collect()
        # Optional keyword filter boost
        keywords = [k.lower() for k in wl.get("keywords") or []]
        if keywords:
            boosted: list[SocialItem] = []
            for it in items:
                low = it.text.lower()
                if any(k in low for k in keywords):
                    boosted.append(
                        SocialItem(it.source, it.text, it.weight * 1.25, it.url, it.ts)
                    )
                else:
                    boosted.append(it)
            items = boosted
        bias = analyze_items(items, weight_cap=cap)
        if persist:
            self.out_path.parent.mkdir(parents=True, exist_ok=True)
            self.out_path.write_text(
                json.dumps(bias.to_dict(), indent=2, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )
        return bias

    def blend_with_lia(
        self,
        lia_decision: str,
        lia_confidence: float,
        social: Optional[SocialBias] = None,
    ) -> dict[str, Any]:
        """Last-stage modifier — never overrides protective SELL high conf."""
        s = social or self.run(persist=False)
        if s.n == 0 or s.weight <= 0:
            return {
                "decision": lia_decision,
                "confidence": lia_confidence,
                "source": "lia_only",
                "social": s.to_dict(),
            }
        if lia_decision == "SELL" and lia_confidence >= 0.6:
            return {
                "decision": "SELL",
                "confidence": lia_confidence,
                "source": "lia_sell_protected",
                "social": s.to_dict(),
            }
        if s.rumor_flag and lia_decision == "BUY":
            return {
                "decision": "WAIT",
                "confidence": min(lia_confidence, 0.45),
                "source": "social_rumor_block",
                "social": s.to_dict(),
            }
        if s.bias == lia_decision and s.bias in ("BUY", "SELL"):
            conf = min(0.92, lia_confidence + s.weight * 0.15)
            return {
                "decision": lia_decision,
                "confidence": conf,
                "source": "lia+social_agree",
                "social": s.to_dict(),
            }
        if s.bias != "WAIT" and s.bias != lia_decision and lia_confidence < 0.7:
            return {
                "decision": "WAIT",
                "confidence": 0.4,
                "source": "social_conflict_wait",
                "social": s.to_dict(),
            }
        return {
            "decision": lia_decision,
            "confidence": lia_confidence * 0.95,
            "source": "lia_primary",
            "social": s.to_dict(),
        }


if __name__ == "__main__":
    intel = SocialIntel()
    print(json.dumps(intel.run().to_dict(), indent=2, ensure_ascii=False))
