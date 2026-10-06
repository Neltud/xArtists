"""
TCA curriculum — syllabus + learning paths.

  PYTHONPATH=. python -m lia.tca.curriculum_manager --list
  PYTHONPATH=. python -m lia.tca.curriculum_manager --lesson leo_w1_sfumato
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "tca"


def load_curriculum(name: str = "curriculum_leonardo_m1") -> dict[str, Any]:
    path = DATA / f"{name}.json"
    if not path.is_file():
        # fallback seed inline if missing
        return {"schema": "tca_curriculum/v1", "id": name, "weeks": [], "error": "file_missing"}
    return json.loads(path.read_text(encoding="utf-8"))


def list_lessons(cur: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    cur = cur or load_curriculum()
    out: list[dict[str, Any]] = []
    for w in cur.get("weeks") or []:
        for lesson in w.get("lessons") or []:
            out.append({**lesson, "week": w.get("week"), "week_title": w.get("title")})
    return out


def get_lesson(lesson_id: str) -> dict[str, Any] | None:
    for L in list_lessons():
        if L.get("id") == lesson_id:
            return L
    return None


def learning_path(level: str = "beginner") -> dict[str, Any]:
    cur = load_curriculum()
    lessons = list_lessons(cur)
    if level == "advanced":
        ordered = lessons
    else:
        ordered = [L for L in lessons if L.get("level", "beginner") in ("beginner", level)]
        if not ordered:
            ordered = lessons
    return {
        "level": level,
        "curriculum_id": cur.get("id"),
        "lesson_ids": [L.get("id") for L in ordered],
        "titles": [L.get("title") for L in ordered],
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--lesson", type=str, default="")
    ap.add_argument("--path", type=str, default="beginner")
    args = ap.parse_args()
    if args.lesson:
        print(json.dumps(get_lesson(args.lesson) or {"error": "not_found"}, indent=2))
    elif args.list:
        print(json.dumps(list_lessons(), indent=2))
    else:
        print(json.dumps(learning_path(args.path), indent=2))


if __name__ == "__main__":
    main()
