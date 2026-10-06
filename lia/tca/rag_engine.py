"""
TCA RAG cognitive loop — retrieve curated knowledge, speak in persona, emit cues.
No trading / ledger writes.

  PYTHONPATH=. python -m lia.tca.rag_engine --q "What is sfumato?" --professor leonardo
"""
from __future__ import annotations

import argparse
import json
import re
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
KNOWLEDGE = ROOT / "data" / "tca" / "knowledge" / "chunks.jsonl"


def _load_chunks() -> list[dict[str, Any]]:
    if not KNOWLEDGE.is_file():
        return []
    out: list[dict[str, Any]] = []
    for line in KNOWLEDGE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            out.append(json.loads(line))
        except Exception:
            pass
    return out


def _tokens(s: str) -> set[str]:
    return set(re.findall(r"[a-z0-9àâäéèêëïîôùûüç]{3,}", (s or "").lower()))


def retrieve(query: str, *, professor_id: str | None = None, k: int = 3) -> list[dict[str, Any]]:
    q = _tokens(query)
    scored: list[tuple[float, dict[str, Any]]] = []
    for ch in _load_chunks():
        if professor_id and professor_id not in (ch.get("professors") or []) and professor_id != "any":
            # soft filter: still allow general if tagged multi
            if professor_id not in (ch.get("professors") or []):
                continue
        blob = " ".join(
            str(ch.get(x) or "")
            for x in ("concept", "technique", "text", "tags", "epoch")
        )
        t = _tokens(blob)
        if not t:
            continue
        inter = len(q & t)
        if inter == 0:
            continue
        score = inter / max(1, len(q))
        scored.append((score, ch))
    scored.sort(key=lambda x: -x[0])
    return [c for _, c in scored[:k]]


def _persona_preamble(professor_id: str) -> str:
    try:
        from lia.tca.soul_engine import get_professor

        p = get_professor(professor_id) or {}
        name = p.get("display_name") or professor_id
        tone = ((p.get("personality") or {}).get("tone")) or "calm"
        persp = p.get("perspective") or ""
        return f"You speak as {name}. Tone: {tone}. Perspective: {persp}. Short, vivid, no investment advice."
    except Exception:
        return f"You speak as professor {professor_id}. Concise masterclass voice."


def synthesize(query: str, chunks: list[dict[str, Any]], *, professor_id: str) -> dict[str, Any]:
    """Extractive synthesis (LLM-ready slot: replace body when TCA_LLM_URL set)."""
    import os

    llm_url = os.environ.get("TCA_LLM_URL", "").strip()
    if llm_url and chunks:
        # Optional remote generation — ops only
        try:
            import urllib.request

            body = json.dumps(
                {
                    "professor_id": professor_id,
                    "query": query,
                    "context": chunks,
                    "preamble": _persona_preamble(professor_id),
                }
            ).encode()
            req = urllib.request.Request(
                llm_url,
                data=body,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode())
        except Exception as e:
            pass  # fall through extractive

    if not chunks:
        text = (
            "I do not find that technique in the studio notes yet. "
            "Ask about sfumato, chiaroscuro, anatomy, composition, or atmosphere."
        )
        return {
            "answer": text,
            "cite": None,
            "emotion": "thinking",
            "visual_ref": None,
            "mode": "empty",
        }

    primary = chunks[0]
    extra = chunks[1]["text"] if len(chunks) > 1 else ""
    answer = primary.get("text") or ""
    if extra and len(answer) < 220:
        answer = answer.rstrip(".") + ". " + extra
    # persona spice (lightweight)
    if professor_id == "rembrandt":
        answer = "Consider the shadow first. " + answer
    elif professor_id == "turner":
        answer = "Watch how light eats the edge. " + answer
    elif professor_id == "repin":
        answer = "See the human weight in the gesture. " + answer

    return {
        "answer": answer,
        "cite": primary.get("cite"),
        "emotion": "authoritative" if primary.get("concept") == "chiaroscuro" else "curious",
        "visual_ref": primary.get("visual_ref"),
        "concept": primary.get("concept"),
        "mode": "extractive",
        "chunk_ids": [c.get("id") for c in chunks],
    }


def answer_to_cues(result: dict[str, Any], *, thinking_s: float = 1.8) -> list[dict[str, Any]]:
    """Convert cognitive result into classroom cues."""
    t = 0.0
    cues: list[dict[str, Any]] = []
    cues.append({"timestamp": t, "type": "THINKING", "payload": {"duration_s": thinking_s}})
    cues.append({"timestamp": t, "type": "EMOTION", "payload": {"emotion": "thinking"}})
    t += thinking_s
    emo = str(result.get("emotion") or "calm")
    cues.append({"timestamp": t, "type": "EMOTIONAL_SHIFT", "payload": {"from": "thinking", "to": emo}})
    cues.append({"timestamp": t, "type": "EMOTION", "payload": {"emotion": emo}})
    text = str(result.get("answer") or "")
    cues.append(
        {
            "timestamp": t,
            "type": "DYNAMIC_TEXT",
            "payload": {"text": text, "cite": result.get("cite")},
        }
    )
    cues.append({"timestamp": t, "type": "AUDIO", "payload": {"text": text}})
    if result.get("visual_ref"):
        cues.append(
            {
                "timestamp": t + 0.3,
                "type": "VISUAL_HIGHLIGHT",
                "payload": {"plate_id": result["visual_ref"], "region": "full"},
            }
        )
        cues.append(
            {
                "timestamp": t + 0.3,
                "type": "PROJECT",
                "payload": {
                    "on": True,
                    "title": str(result.get("concept") or "Study"),
                    "analysis": result.get("cite") or "",
                },
            }
        )
    return cues


def ask(query: str, *, professor_id: str = "leonardo") -> dict[str, Any]:
    chunks = retrieve(query, professor_id=professor_id, k=3)
    if not chunks:
        chunks = retrieve(query, professor_id="any", k=3)
    result = synthesize(query, chunks, professor_id=professor_id)
    cues = answer_to_cues(result)
    return {
        "schema": "tca_rag_response/v1",
        "query": query,
        "professor_id": professor_id,
        "result": result,
        "cues": cues,
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "note": "Silent observer — no capital side-effects",
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--q", type=str, required=True)
    ap.add_argument("--professor", type=str, default="leonardo")
    args = ap.parse_args()
    print(json.dumps(ask(args.q, professor_id=args.professor), indent=2))


if __name__ == "__main__":
    main()
