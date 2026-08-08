"""
After every Vellum cycle: mirror critical JSON so the dApp sees fresh data.

1. data/*.json  (source of truth, git-committed)
2. docs/data/   (GitHub Pages static)
3. apps/frontend/public/data/  (Vite build embeds)

Call from Vellum Reporter node, then git add/commit/push (existing GitHubReporter).
"""
from __future__ import annotations

import json
import shutil
import time
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
MIRRORS = [
    ROOT / "docs" / "data",
    ROOT / "apps" / "frontend" / "public" / "data",
]

CRITICAL = [
    "lia_v6_status.json",
    "lia_trades.json",
    "lia_trailing_state.json",
    "lia_portfolio.json",
    "lia_board.json",
    "hatom_lia.json",
    "battle_of_nodes.json",
    "xartists_onchain.json",
    "tro_pool.json",
    "config.json",
    "greensmoke_top.json",
    "greensmoke_forecasts.json",
    "lia_tro_policy.json",
    "contracts.json",
    "rwa_escrow_intents.json",
    "vellum_last_run.json",
    "egld_price.json",
    "ads_active.json",
]


def _touch_status() -> None:
    path = DATA / "lia_v6_status.json"
    if not path.exists():
        return
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return
    data["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    data["updated"] = data["timestamp"]
    data["status"] = data.get("status") or "monitoring"
    data.setdefault("LIA_LIVE_TRADING", 0)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def mirror_files(names: Iterable[str] | None = None) -> dict:
    names = list(names or CRITICAL)
    _touch_status()
    copied: list[str] = []
    missing: list[str] = []
    for name in names:
        src = DATA / name
        if not src.is_file():
            missing.append(name)
            continue
        for dest_root in MIRRORS:
            dest_root.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dest_root / name)
        copied.append(name)
    return {
        "ok": True,
        "copied": copied,
        "missing": missing,
        "mirrors": [str(m) for m in MIRRORS],
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }


def publish() -> dict:
    """Alias for Vellum Reporter."""
    return mirror_files()


if __name__ == "__main__":
    print(json.dumps(publish(), indent=2))
