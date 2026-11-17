#!/usr/bin/env python3
"""
xArtists / xOrus — daily signal + dual external briefs (paper only).

Collects public market observations, scores a bounded subset of the 120-signal
catalog when evidence is fresh, and emits:
  - external.grok_note
  - external.chatgpt_brief  (weight capped at 15% in the decision desk)

No live trading, mint, payment, or signing. Optional XAI_API_KEY / OPENAI_API_KEY
enrich narrative text only; absence falls back to deterministic paper synthesis.
"""
from __future__ import annotations

import hashlib
import json
import os
import ssl
import statistics
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
OUTS = [
    ROOT / "data" / "signals" / "daily_signal.json",
    ROOT / "apps" / "frontend" / "public" / "data" / "signals" / "daily_signal.json",
]
REPORT_OUTS = [
    ROOT / "data" / "signals" / "daily_dual_reports.json",
    ROOT / "apps" / "frontend" / "public" / "data" / "signals" / "daily_dual_reports.json",
]

CHATGPT_WEIGHT_CAP = 0.15
SIGNALS_DEFINED = 120
BINANCE_KLINES = (
    "https://data-api.binance.vision/api/v3/klines"
    "?symbol=EGLDUSDT&interval=1h&limit=48"
)
MX_ECONOMICS = "https://api.multiversx.com/economics"
USER_AGENT = "xArtists-signals-worker/2.0 (+https://xartists.art; paper-only)"


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def sha256_hex(payload: Any) -> str:
    raw = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def http_get_json(url: str, timeout: float = 12.0) -> Any | None:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
            if resp.status != 200:
                return None
            return json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError, OSError):
        return None


def fetch_binance_tape() -> dict[str, Any]:
    data = http_get_json(BINANCE_KLINES)
    empty: dict[str, Any] = {
        "ok": False,
        "provider": "binance_spot_public",
        "instrument": "EGLDUSDT",
        "interval": "1h",
        "candles": 0,
        "closes": [],
        "volumes": [],
        "source_ts": None,
        "error": "fetch_failed",
    }
    if not isinstance(data, list) or len(data) < 12:
        return empty
    closes: list[float] = []
    volumes: list[float] = []
    highs: list[float] = []
    lows: list[float] = []
    source_ts: str | None = None
    for row in data:
        try:
            high = float(row[2])
            low = float(row[3])
            close = float(row[4])
            vol = float(row[5])
            close_ms = int(row[6])
        except (IndexError, TypeError, ValueError):
            continue
        highs.append(high)
        lows.append(low)
        closes.append(close)
        volumes.append(vol)
        source_ts = datetime.fromtimestamp(close_ms / 1000.0, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    if len(closes) < 12:
        return empty
    return {
        "ok": True,
        "provider": "binance_spot_public",
        "instrument": "EGLDUSDT",
        "interval": "1h",
        "candles": len(closes),
        "closes": closes,
        "volumes": volumes,
        "highs": highs,
        "lows": lows,
        "source_ts": source_ts,
        "error": None,
    }


def fetch_mx_economics() -> dict[str, Any]:
    data = http_get_json(MX_ECONOMICS)
    if not isinstance(data, dict):
        data = http_get_json("https://gateway.multiversx.com/network/economics")
    if not isinstance(data, dict):
        return {"ok": False, "provider": "multiversx_economics", "error": "fetch_failed"}
    if "data" in data and isinstance(data["data"], dict):
        data = data["data"]
    out: dict[str, Any] = {
        "ok": True,
        "provider": "multiversx_economics",
        "error": None,
    }
    for key in ("price", "marketCap", "staked", "apr", "totalSupply", "circulatingSupply"):
        if key in data:
            out[key] = data[key]
    return out


def pct_change(series: list[float], lookback: int) -> float | None:
    if len(series) <= lookback:
        return None
    a, b = series[-(lookback + 1)], series[-1]
    if a == 0:
        return None
    return (b - a) / a * 100.0


def score_tape(tape: dict[str, Any]) -> list[dict[str, Any]]:
    if not tape.get("ok"):
        return []
    closes: list[float] = tape["closes"]
    volumes: list[float] = tape["volumes"]
    highs: list[float] = tape["highs"]
    lows: list[float] = tape["lows"]
    scored: list[dict[str, Any]] = []

    def add(sid: str, family: str, reading: str, value: float | None, note: str) -> None:
        scored.append(
            {
                "id": sid,
                "family": family,
                "status": "observed_unverified",
                "reading": reading,
                "value": None if value is None else round(value, 6),
                "note": note,
            }
        )

    r1 = pct_change(closes, 1)
    r4 = pct_change(closes, 4)
    r24 = pct_change(closes, min(24, len(closes) - 1))
    if r1 is not None:
        add("price.ret_1h", "price", "positive" if r1 > 0.15 else ("negative" if r1 < -0.15 else "balanced"), r1, "1h close return %")
    if r4 is not None:
        add("price.ret_4h", "price", "positive" if r4 > 0.4 else ("negative" if r4 < -0.4 else "balanced"), r4, "4h close return %")
    if r24 is not None:
        add("price.ret_24h", "price", "positive" if r24 > 1.0 else ("negative" if r24 < -1.0 else "balanced"), r24, "~24h close return %")

    window = closes[-14:] if len(closes) >= 14 else closes
    if window:
        lo, hi = min(window), max(window)
        pos = (closes[-1] - lo) / (hi - lo + 1e-12)
        add("price.range_pos", "price", "positive" if pos > 0.7 else ("negative" if pos < 0.3 else "balanced"), pos, "position in 14h range")

    if len(volumes) >= 6:
        recent = statistics.mean(volumes[-3:])
        base = statistics.mean(volumes[-12:-3]) if len(volumes) >= 12 else statistics.mean(volumes[:-3] or volumes)
        ratio = recent / base if base else 0.0
        add(
            "volume.spike_1h",
            "volume",
            "positive" if ratio > 1.4 else ("negative" if ratio < 0.7 else "balanced"),
            ratio,
            "recent vol vs prior window",
        )
        if ratio < 0.75:
            add("volume.quiet_tape", "volume", "negative", ratio, "quiet tape relative to baseline")

    if len(closes) >= 24 and len(highs) == len(lows) == len(closes):
        trs = []
        for i in range(1, len(closes)):
            tr = max(highs[i] - lows[i], abs(highs[i] - closes[i - 1]), abs(lows[i] - closes[i - 1]))
            trs.append(tr)
        atr = statistics.mean(trs[-24:]) if trs else 0.0
        atr_pct = atr / closes[-1] * 100.0 if closes[-1] else 0.0
        add(
            "volatility.atr_1h",
            "volatility",
            "positive" if atr_pct > 1.5 else ("negative" if atr_pct < 0.4 else "balanced"),
            atr_pct,
            "ATR percent of last close (24h window)",
        )

    if r24 is not None:
        add(
            "risk.drawdown",
            "risk",
            "negative" if r24 < -3.0 else ("balanced" if r24 > -1.0 else "negative"),
            r24,
            "proxy: 24h return as soft drawdown hint",
        )

    return scored


def regime_from_scores(scores: list[dict[str, Any]]) -> tuple[str, float]:
    if not scores:
        return "neutral", 0.35
    pos = sum(1 for s in scores if s["reading"] == "positive")
    neg = sum(1 for s in scores if s["reading"] == "negative")
    if pos >= neg + 2:
        return "constructive", min(0.62, 0.4 + 0.04 * pos)
    if neg >= pos + 2:
        return "defensive", min(0.62, 0.4 + 0.04 * neg)
    return "neutral", 0.48


def deterministic_brief(
    author: str,
    scores: list[dict[str, Any]],
    tape: dict[str, Any],
    mx: dict[str, Any],
    regime: str,
) -> dict[str, Any]:
    last = tape["closes"][-1] if tape.get("ok") and tape.get("closes") else None
    lines = [
        f"Paper brief ({author}). Mode: observation only. No order, mint, or transfer.",
        f"Regime: {regime}. Instrument: EGLDUSDT 1h public tape.",
    ]
    if last is not None:
        lines.append(f"Last close observed: {last:.4f} USDT (unverified provider observation).")
    if mx.get("ok") and mx.get("price") is not None:
        lines.append(f"MultiversX economics price field present: {mx.get('price')} (context only).")
    if not scores:
        lines.append("Coverage: thin_tape — fewer than the evidence threshold; abstain from directional claims.")
    else:
        fam: dict[str, list[str]] = {}
        for s in scores:
            fam.setdefault(s["family"], []).append(s["id"])
        lines.append(
            "Scored with public evidence only: "
            + ", ".join(f"{k}({len(v)})" for k, v in sorted(fam.items()))
            + f". Catalog remains {SIGNALS_DEFINED} definitions; unverified signals stay silent."
        )
        for s in scores[:8]:
            lines.append(f"- {s['id']}: {s['reading']} ({s.get('note')})")
    lines.append("Sentinel veto remains absolute. ChatGPT external weight <= 15%. Executable=false.")
    text = "\n".join(lines)
    return {
        "author": author,
        "channel": "external." + ("grok_note" if author == "grok" else "chatgpt_brief"),
        "mode": "paper_only",
        "method": "deterministic_paper_synthesis/v1",
        "weight_cap": None if author == "grok" else CHATGPT_WEIGHT_CAP,
        "text": text,
        "sha256": sha256_hex({"author": author, "text": text}),
        "llm_invoked": False,
    }


def optional_llm_polish(author: str, seed: dict[str, Any]) -> dict[str, Any]:
    if author == "grok":
        key = os.environ.get("XAI_API_KEY", "").strip()
        url = "https://api.x.ai/v1/chat/completions"
        model = os.environ.get("XAI_MODEL", "grok-2-latest")
    else:
        key = os.environ.get("OPENAI_API_KEY", "").strip()
        url = "https://api.openai.com/v1/chat/completions"
        model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    if not key:
        return seed
    system = (
        "You write a short paper-only market observation for xArtists xOrus. "
        "No investment advice. No trade instructions. Max 180 words. French or English OK. "
        "State uncertainty. Never claim live execution."
    )
    body = {
        "model": model,
        "temperature": 0.2,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": seed["text"][:4000]},
        ],
    }
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "User-Agent": USER_AGENT,
            "Content-Type": "application/json",
            "Authorization": f"Bearer {key}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=40, context=ssl.create_default_context()) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
        text = payload["choices"][0]["message"]["content"].strip()
        if not text:
            return seed
        out = dict(seed)
        out["text"] = text
        out["method"] = "llm_paper_polish/v1"
        out["llm_invoked"] = True
        out["model"] = model
        out["sha256"] = sha256_hex({"author": author, "text": text})
        return out
    except Exception:
        return seed


def build_signal() -> tuple[dict[str, Any], dict[str, Any]]:
    now = utc_now()
    tape = fetch_binance_tape()
    mx = fetch_mx_economics()
    scores = score_tape(tape)
    regime, confidence = regime_from_scores(scores)

    grok = deterministic_brief("grok", scores, tape, mx, regime)
    gpt = deterministic_brief("chatgpt", scores, tape, mx, regime)
    if os.environ.get("XORUS_LLM_BRIEFS", "0") == "1":
        grok = optional_llm_polish("grok", grok)
        gpt = optional_llm_polish("chatgpt", gpt)

    families_analyzed = sorted({s["family"] for s in scores})
    stance = "ABSTAIN"
    reason = "thin_tape" if len(scores) < 4 else "paper_observation_only"

    dual = {
        "schema": "xorus_dual_reports/v1",
        "generated_at": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "mode": "paper_only",
        "executable": False,
        "live_trading": False,
        "chatgpt_weight_cap": CHATGPT_WEIGHT_CAP,
        "sentinel_veto": True,
        "coverage": {
            "signals_defined": SIGNALS_DEFINED,
            "signals_analyzed": len(scores),
            "families_analyzed": len(families_analyzed),
            "families": families_analyzed,
            "independently_verified_signals": 0,
        },
        "collection": {
            "provider": tape.get("provider"),
            "instrument": tape.get("instrument"),
            "interval": tape.get("interval"),
            "candles": tape.get("candles"),
            "source_ts": tape.get("source_ts"),
            "ok": bool(tape.get("ok")),
            "mx_economics_ok": bool(mx.get("ok")),
        },
        "scores": scores,
        "reports": {
            "external.grok_note": grok,
            "external.chatgpt_brief": gpt,
        },
        "decision": {"stance": stance, "reason": reason},
        "safety": {
            "executable": False,
            "live_trading": False,
            "signing_authorized": False,
            "trade_authorized": False,
            "mint_authorized": False,
            "requires_human_review": True,
        },
    }
    dual["report_sha256"] = sha256_hex(
        {k: dual[k] for k in ("coverage", "scores", "reports", "decision", "safety")}
    )

    last = tape["closes"][-1] if tape.get("ok") and tape.get("closes") else None
    headline = f"xOrus paper · {stance} ({reason}) · {len(scores)}/{SIGNALS_DEFINED} signaux scores"
    summary = (
        f"Collecte publique EGLDUSDT 1h"
        + (f" (last~{last:.4f})" if last is not None else " (tape indisponible)")
        + f". Briefs duals: grok_note + chatgpt_brief (poids ChatGPT <= {int(CHATGPT_WEIGHT_CAP * 100)}%). "
        "Aucune execution automatique. Sentinel garde le veto."
    )

    signal = {
        "schema": "xartists_daily_signal/v2",
        "generated_at": now.isoformat(),
        "date": now.strftime("%Y-%m-%d"),
        "regime": regime,
        "confidence": round(confidence, 3),
        "headline": headline,
        "summary": summary,
        "decision": dual["decision"],
        "coverage": dual["coverage"],
        "external": {
            "grok_note": {
                "sha256": grok["sha256"],
                "llm_invoked": grok["llm_invoked"],
                "preview": grok["text"][:280],
            },
            "chatgpt_brief": {
                "sha256": gpt["sha256"],
                "llm_invoked": gpt["llm_invoked"],
                "weight_cap": CHATGPT_WEIGHT_CAP,
                "preview": gpt["text"][:280],
            },
        },
        "macro": {
            "usd_liquidity": "watch",
            "risk_appetite": "mixed" if regime == "neutral" else regime,
            "notes": [
                "Observation MultiversX / Binance publique uniquement.",
                "Pas d'attestation independante des prix.",
            ],
        },
        "crypto": {
            "egld": regime if tape.get("ok") else "unknown",
            "tro": "observe",
            "notes": ["Pas de promesse de rendement.", "Paper only."],
        },
        "patronage": {
            "rebalance_hint": "hold",
            "pulse_focus": "education_over_leverage",
        },
        "disclaimer": (
            "Contenu informatif / educatif. Pas un conseil financier. "
            "Aucune TX n'est declenchee par ce fichier. "
            "ChatGPT <= 15% ; Sentinel veto."
        ),
        "source": "signals-worker/v2",
        "dual_reports_ref": "data/signals/daily_dual_reports.json",
        "report_sha256": dual["report_sha256"],
    }
    return signal, dual


def main() -> int:
    signal, dual = build_signal()
    signal_text = json.dumps(signal, indent=2, ensure_ascii=False) + "\n"
    dual_text = json.dumps(dual, indent=2, ensure_ascii=False) + "\n"
    for p in OUTS:
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(signal_text, encoding="utf-8")
        print("wrote", p)
    for p in REPORT_OUTS:
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(dual_text, encoding="utf-8")
        print("wrote", p)
    print(
        "coverage",
        signal["coverage"]["signals_analyzed"],
        "/",
        SIGNALS_DEFINED,
        "decision",
        signal["decision"],
        "sha",
        signal["report_sha256"][:16],
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
