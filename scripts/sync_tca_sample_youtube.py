#!/usr/bin/env python3
"""
Sync SAMPLE lesson from YouTube Data API v3 (ops only).

Env (never commit):
  YOUTUBE_API_KEY=...
  YOUTUBE_CHANNEL_ID=...     optional if using search by tag
  YOUTUBE_SAMPLE_TAG=TCA_Masterclass

Writes:
  data/tca/sample_lesson.json
  apps/frontend/public/data/tca/sample_lesson.json

Does not touch trading or ledger.
"""
from __future__ import annotations

import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_PATHS = [
    ROOT / "data" / "tca" / "sample_lesson.json",
    ROOT / "apps" / "frontend" / "public" / "data" / "tca" / "sample_lesson.json",
]


def yt_get(path: str, params: dict) -> dict:
    key = os.environ.get("YOUTUBE_API_KEY", "").strip()
    if not key:
        print("Missing YOUTUBE_API_KEY (set in env, never commit)", file=sys.stderr)
        sys.exit(2)
    params = {**params, "key": key}
    url = f"https://www.googleapis.com/youtube/v3/{path}?{urllib.parse.urlencode(params)}"
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.loads(r.read().decode())


def latest_by_tag(tag: str) -> dict | None:
    data = yt_get(
        "search",
        {
            "part": "snippet",
            "q": f"#{tag}",
            "type": "video",
            "order": "date",
            "maxResults": "5",
        },
    )
    items = data.get("items") or []
    if not items:
        return None
    it = items[0]
    vid = it["id"]["videoId"]
    sn = it["snippet"]
    return {
        "id": "sample_01",
        "title": sn.get("title") or "TCA sample",
        "youtubeId": vid,
        "professor_id": "leonardo",
        "duration_label": "sample",
        "cta": "Unlock full holographic classroom with Pack Pulse (12 months)",
        "source": "youtube_api",
        "tag": tag,
        "publishedAt": sn.get("publishedAt"),
    }


def main() -> int:
    tag = os.environ.get("YOUTUBE_SAMPLE_TAG", "TCA_Masterclass").strip()
    lesson = latest_by_tag(tag)
    if not lesson:
        print(f"No videos found for #{tag}", file=sys.stderr)
        return 1
    body = json.dumps(lesson, indent=2, ensure_ascii=False) + "\n"
    for p in OUT_PATHS:
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(body, encoding="utf-8")
        print("wrote", p)
    print("youtubeId", lesson["youtubeId"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
