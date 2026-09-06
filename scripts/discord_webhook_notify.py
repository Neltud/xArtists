#!/usr/bin/env python3
"""Post a simple message or embed to Discord via webhook.

Secrets (env only — never commit):
  DISCORD_WEBHOOK_URL       main channel
  DISCORD_WEBHOOK_OPS_URL   optional admin channel (--ops)

Usage:
  python scripts/discord_webhook_notify.py --text "Deploy OK"
  python scripts/discord_webhook_notify.py --embed-title "LIA" --embed-desc "paper run" --color 0x8b5cf6
  python scripts/discord_webhook_notify.py --ops --text "alert ops"
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request


def post_webhook(url: str, payload: dict) -> int:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json", "User-Agent": "xArtists-webhook/1.0"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"HTTP {e.code}: {body}", file=sys.stderr)
        return e.code
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1


def main() -> int:
    p = argparse.ArgumentParser(description="Discord webhook notifier (xArtists)")
    p.add_argument("--text", default="", help="Plain content")
    p.add_argument("--embed-title", default="")
    p.add_argument("--embed-desc", default="")
    p.add_argument("--color", type=lambda x: int(x, 0), default=0x8B5CF6)
    p.add_argument("--ops", action="store_true", help="Use DISCORD_WEBHOOK_OPS_URL")
    p.add_argument("--username", default="xArtists")
    args = p.parse_args()

    env_key = "DISCORD_WEBHOOK_OPS_URL" if args.ops else "DISCORD_WEBHOOK_URL"
    url = (os.environ.get(env_key) or "").strip()
    if not url.startswith("https://discord.com/api/webhooks/"):
        print(
            f"Missing or invalid {env_key}. Create webhook in Discord → channel → Integrations.",
            file=sys.stderr,
        )
        return 2

    payload: dict = {"username": args.username}
    if args.text:
        payload["content"] = args.text[:2000]

    if args.embed_title or args.embed_desc:
        embed = {"color": args.color}
        if args.embed_title:
            embed["title"] = args.embed_title[:256]
        if args.embed_desc:
            embed["description"] = args.embed_desc[:4096]
        payload["embeds"] = [embed]

    if "content" not in payload and "embeds" not in payload:
        payload["content"] = "xArtists webhook ping"

    status = post_webhook(url, payload)
    if status in (200, 204):
        print("OK", status)
        return 0
    return 1


if __name__ == "__main__":
    sys.exit(main())
