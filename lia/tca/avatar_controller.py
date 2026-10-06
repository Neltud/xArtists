"""
TCA avatar controller — lesson beats → gesture / camera / TTS cues.
Does not render 3D; front consumes the cue stream.

  PYTHONPATH=. python -m lia.tca.avatar_controller --lesson leo_w1_sfumato
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]

# Gesture library (ids consumed by Three.js animation mixer)
GESTURES = {
    "idle": {"animation": "Idle", "weight": 1.0},
    "point_canvas": {"animation": "PointRight", "weight": 1.0},
    "open_hands": {"animation": "Explain", "weight": 1.0},
    "look_painting": {"animation": "TurnLeft", "weight": 1.0},
    "think": {"animation": "Think", "weight": 0.8},
}


def beats_from_lesson(lesson: dict[str, Any]) -> list[dict[str, Any]]:
    """Expand lesson outline into timed beats for the avatar."""
    beats: list[dict[str, Any]] = []
    t = 0.0
    intro = {
        "t0": t,
        "duration_s": 12.0,
        "text": lesson.get("intro") or f"Welcome. Today: {lesson.get('title')}",
        "gesture_id": "open_hands",
        "camera_target": "professor",
        "subtitle_key": "intro",
    }
    beats.append(intro)
    t += 12.0
    for i, section in enumerate(lesson.get("sections") or []):
        dur = float(section.get("duration_s") or 45)
        g = section.get("gesture_id") or ("point_canvas" if i % 2 == 0 else "look_painting")
        beats.append(
            {
                "t0": t,
                "duration_s": dur,
                "text": section.get("narration") or section.get("title") or "",
                "gesture_id": g,
                "camera_target": section.get("camera_target") or "stage",
                "subtitle_key": section.get("id") or f"s{i}",
                "knowledge_ref": section.get("knowledge_ref"),
            }
        )
        t += dur
    beats.append(
        {
            "t0": t,
            "duration_s": 10.0,
            "text": lesson.get("outro") or "Reflect on what you observed. Class dismissed.",
            "gesture_id": "idle",
            "camera_target": "professor",
            "subtitle_key": "outro",
        }
    )
    return beats


def resolve_cues(beats: list[dict[str, Any]], *, locale: str = "en") -> list[dict[str, Any]]:
    cues = []
    for b in beats:
        g = GESTURES.get(str(b.get("gesture_id") or "idle"), GESTURES["idle"])
        cues.append(
            {
                **b,
                "animation": g["animation"],
                "locale": locale,
                "tts": {
                    "provider": "external",  # wire ElevenLabs / browser speech later
                    "text": b.get("text"),
                    "locale": locale,
                    "voice_id": "professor_default",
                },
            }
        )
    return cues


def run_lesson(lesson_id: str, *, locale: str = "en") -> dict[str, Any]:
    from lia.tca.curriculum_manager import get_lesson

    lesson = get_lesson(lesson_id)
    if not lesson:
        return {"ok": False, "error": "lesson_not_found", "id": lesson_id}
    beats = beats_from_lesson(lesson)
    cues = resolve_cues(beats, locale=locale)
    return {
        "ok": True,
        "lesson_id": lesson_id,
        "title": lesson.get("title"),
        "professor_id": lesson.get("professor_id") or "leonardo",
        "total_duration_s": sum(float(c.get("duration_s") or 0) for c in cues),
        "cues": cues,
        "note": "Front plays cues; no equity side-effects",
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--lesson", type=str, default="leo_w1_sfumato")
    ap.add_argument("--locale", type=str, default="en")
    args = ap.parse_args()
    print(json.dumps(run_lesson(args.lesson, locale=args.locale), indent=2))


if __name__ == "__main__":
    main()
