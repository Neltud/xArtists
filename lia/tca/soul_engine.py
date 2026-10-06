"""
TCA soul engine — personality → speech/gesture params + emotional cue helpers.
No ledger writes.

  PYTHONPATH=. python -m lia.tca.soul_engine --professor leonardo
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "tca"

EMOTIONS = ("curious", "authoritative", "dramatic", "calm", "thinking")
GAZE = ("user_camera", "art_object", "abstract_point", "board")


def load_professors() -> list[dict[str, Any]]:
    path = DATA / "professors.json"
    if not path.is_file():
        return []
    return list(json.loads(path.read_text(encoding="utf-8")).get("professors") or [])


def get_professor(pid: str) -> dict[str, Any] | None:
    for p in load_professors():
        if p.get("id") == pid:
            return p
    return None


def speech_params(prof: dict[str, Any], *, emotion: str = "calm") -> dict[str, float]:
    ss = (prof.get("personality") or {}).get("speech_style") or {}
    pitch = float(ss.get("pitch") or 1.0)
    rate = float(ss.get("speed_multiplier") or 1.0)
    pause = float(ss.get("pause_frequency") or 0.5)
    if emotion == "dramatic":
        pitch *= 0.94
        rate *= 0.92
        pause = min(1.0, pause + 0.15)
    elif emotion == "curious":
        pitch *= 1.06
        rate *= 1.02
    elif emotion == "authoritative":
        pitch *= 0.97
        rate *= 0.88
        pause = min(1.0, pause + 0.1)
    elif emotion == "thinking":
        rate *= 0.85
        pause = min(1.0, pause + 0.25)
    return {
        "pitch": round(pitch, 3),
        "rate": round(rate, 3),
        "pause_s": round(0.4 + pause * 1.1, 2),
        "pitch_variation": float(ss.get("pitch_variation") or 0.1),
    }


def hologram_uniforms(prof: dict[str, Any]) -> dict[str, Any]:
    h = prof.get("hologram_settings") or {}
    pal = ((prof.get("personality") or {}).get("color_palette") or {})
    return {
        "glow_color": h.get("glow_color") or pal.get("primary_glow") or "#e0c097",
        "flicker_rate": float(h.get("flicker_rate") or 0.02),
        "scanline_opacity": float(h.get("scanline_opacity") or 0.1),
        "opacity_pulse": float(h.get("opacity_pulse") or 0.05),
        "base_opacity": float(h.get("base_opacity") or 0.8),
    }


def inject_soul_cues(cues: list[dict[str, Any]], prof: dict[str, Any]) -> list[dict[str, Any]]:
    """Add EMOTION/GAZE/MICRO defaults between text beats; silence via pause metadata."""
    out: list[dict[str, Any]] = []
    emotion = "calm"
    if (prof.get("id") or "") == "turner":
        emotion = "curious"
    elif (prof.get("id") or "") == "rembrandt":
        emotion = "dramatic"
    elif (prof.get("id") or "") == "repin":
        emotion = "authoritative"
    sp = speech_params(prof, emotion=emotion)
    out.append({"timestamp": 0.0, "type": "EMOTION", "payload": {"emotion": emotion}})
    out.append({"timestamp": 0.0, "type": "GAZE_TARGET", "payload": {"target": "user_camera"}})
    out.append({"timestamp": 0.0, "type": "MICRO_MOVEMENT", "payload": {"breathing": True, "blink": True}})
    out.append({"timestamp": 0.0, "type": "SOUL", "payload": {"speech": sp, "hologram": hologram_uniforms(prof)}})
    for c in cues:
        out.append(c)
        if c.get("type") == "TEXT":
            # natural gap after speech
            ts = float(c.get("timestamp") or 0) + 0.05
            out.append({"timestamp": ts, "type": "SILENCE", "payload": {"duration_s": sp["pause_s"]}})
    return sorted(out, key=lambda x: (float(x.get("timestamp") or 0), str(x.get("type"))))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--professor", type=str, default="leonardo")
    args = ap.parse_args()
    p = get_professor(args.professor)
    if not p:
        print(json.dumps({"error": "not_found"}))
        return
    print(
        json.dumps(
            {
                "id": p.get("id"),
                "speech": speech_params(p),
                "hologram": hologram_uniforms(p),
                "personality": p.get("personality"),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
