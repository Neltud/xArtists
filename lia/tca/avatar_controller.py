"""
TCA avatar controller — lesson → typed cue timeline for the front.
Protocol types: TEXT | ANIMATION | CAMERA | AUDIO | EFFECT

  PYTHONPATH=. python -m lia.tca.avatar_controller --lesson leo_w1_sfumato
  PYTHONPATH=. python -m lia.tca.avatar_controller --lesson leo_w1_sfumato --export
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "tca"

GESTURES = {
    "idle": "Idle",
    "point_canvas": "PointRight",
    "open_hands": "Explain",
    "look_painting": "TurnLeft",
    "think": "Think",
}

CAMERA_PRESETS = {
    "professor": {"x": 0.0, "y": 1.6, "z": 3.2, "look_at": [0, 1.4, 0]},
    "wide": {"x": 0.0, "y": 2.0, "z": 5.5, "look_at": [0, 1.2, 0]},
    "canvas": {"x": -1.2, "y": 1.5, "z": 2.4, "look_at": [0.8, 1.3, -0.5]},
    "stage": {"x": 0.4, "y": 1.8, "z": 4.0, "look_at": [0, 1.2, 0]},
}


def _cue(ts: float, type_: str, payload: dict[str, Any]) -> dict[str, Any]:
    return {"timestamp": round(ts, 3), "type": type_, "payload": payload}


def beats_to_cues(lesson: dict[str, Any], *, locale: str = "en") -> list[dict[str, Any]]:
    cues: list[dict[str, Any]] = []
    t = 0.0

    def add_block(text: str, gesture_id: str, camera_key: str, duration_s: float, effect: str | None = None):
        nonlocal t
        anim = GESTURES.get(gesture_id, "Idle")
        cam = CAMERA_PRESETS.get(camera_key, CAMERA_PRESETS["professor"])
        cues.append(_cue(t, "TEXT", {"text": text, "locale": locale}))
        cues.append(_cue(t, "ANIMATION", {"animation_name": anim}))
        cues.append(
            _cue(
                t,
                "CAMERA",
                {
                    "target_obj": camera_key,
                    "camera_pos": {"x": cam["x"], "y": cam["y"], "z": cam["z"]},
                    "look_at": cam["look_at"],
                },
            )
        )
        cues.append(
            _cue(
                t,
                "AUDIO",
                {
                    "text": text,
                    "locale": locale,
                    "audio_file": None,
                    "voice_id": "professor_default",
                },
            )
        )
        if effect:
            cues.append(_cue(t, "EFFECT", {"name": effect, "intensity": 0.4}))
        t += float(duration_s)

    intro = lesson.get("intro") or f"Welcome. Today: {lesson.get('title')}"
    add_block(intro, "open_hands", "wide", 12.0, effect="dust_soft")

    for i, section in enumerate(lesson.get("sections") or []):
        text = section.get("narration") or section.get("title") or ""
        g = section.get("gesture_id") or ("point_canvas" if i % 2 == 0 else "look_painting")
        cam = section.get("camera_target") or "stage"
        dur = float(section.get("duration_s") or 45)
        add_block(text, g, cam, dur, effect="gold_glint" if i == 0 else None)

    outro = lesson.get("outro") or "Reflect on what you observed. Class dismissed."
    add_block(outro, "idle", "professor", 10.0)

    return sorted(cues, key=lambda c: (c["timestamp"], c["type"]))


def run_lesson(lesson_id: str, *, locale: str = "en") -> dict[str, Any]:
    from lia.tca.curriculum_manager import get_lesson

    lesson = get_lesson(lesson_id)
    if not lesson:
        return {"ok": False, "error": "lesson_not_found", "id": lesson_id}
    cues = beats_to_cues(lesson, locale=locale)
    total = max((c["timestamp"] for c in cues), default=0) + 10.0
    return {
        "ok": True,
        "schema": "tca_cues/v1",
        "lesson_id": lesson_id,
        "title": lesson.get("title"),
        "professor_id": lesson.get("professor_id") or "leonardo",
        "locale": locale,
        "total_duration_s": total,
        "cues": cues,
        "note": "Silent observer — no ledger writes",
    }


def export_cues(lesson_id: str, *, locale: str = "en") -> Path:
    payload = run_lesson(lesson_id, locale=locale)
    DATA.mkdir(parents=True, exist_ok=True)
    path = DATA / f"cues_{lesson_id}.json"
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    for dest in (
        ROOT / "apps" / "frontend" / "public" / "data" / "tca" / f"cues_{lesson_id}.json",
        ROOT / "docs" / "data" / "tca" / f"cues_{lesson_id}.json",
    ):
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        except OSError:
            pass
    return path


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--lesson", type=str, default="leo_w1_sfumato")
    ap.add_argument("--locale", type=str, default="en")
    ap.add_argument("--export", action="store_true")
    args = ap.parse_args()
    if args.export:
        p = export_cues(args.lesson, locale=args.locale)
        print(json.dumps({"exported": str(p), **run_lesson(args.lesson, locale=args.locale)}, indent=2)[:2000])
    else:
        print(json.dumps(run_lesson(args.lesson, locale=args.locale), indent=2))


if __name__ == "__main__":
    main()
