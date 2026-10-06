#!/usr/bin/env python3
"""CI PR architecture review. OPENAI_API_KEY from Actions secrets only."""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from pathlib import Path

MAX_DIFF = 12000

SYSTEM_RULES = """Tu es l'architecte systeme xArtists.
Regles: air-gap TCA read-only; zero-trust (pas FULL localStorage);
pas d'equity auto study-time; secrets hors git; Guardian/Genesis locked.
Analyse le diff: (A) vulns (B) dette/orphelins (C) corrections concretes.
Francais, puces, concis."""


def main() -> int:
    api_key = (os.environ.get("OPENAI_API_KEY") or "").strip()
    comments_url = (os.environ.get("PR_COMMENTS_URL") or "").strip()
    gh_token = (os.environ.get("GH_TOKEN") or "").strip()
    diff_path = Path("pr_diff.txt")
    diff_text = diff_path.read_text(encoding="utf-8", errors="replace") if diff_path.exists() else ""
    diff_text = diff_text[:MAX_DIFF]

    if not api_key:
        print("OPENAI_API_KEY absent — review skip")
        return 0
    if not comments_url or not gh_token:
        print("Missing PR_COMMENTS_URL or GH_TOKEN")
        return 0

    payload = {
        "model": os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
        "messages": [
            {"role": "system", "content": SYSTEM_RULES},
            {"role": "user", "content": f"Diff PR:\n\n{diff_text}"},
        ],
        "temperature": 0.2,
    }
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            body = json.loads(resp.read().decode())
        review = body["choices"][0]["message"]["content"]
    except Exception as e:
        print("OpenAI error:", e)
        return 0

    comment = {
        "body": "### Analyse Architecture & Securite (CI)\n\n"
        + review
        + "\n\n_Bot CI — review humaine requise._"
    }
    creq = urllib.request.Request(
        comments_url,
        data=json.dumps(comment).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"token {gh_token}",
            "Accept": "application/vnd.github+json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(creq, timeout=30) as resp:
            print("Comment posted", resp.status)
    except Exception as e:
        print("GitHub comment error:", e)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
