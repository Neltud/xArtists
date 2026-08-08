#!/usr/bin/env python3
"""Generate apps/frontend/.env.mainnet.example from contracts + codehash verify.
No secrets. Safe to commit the example file.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LIA = "erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6"


def main() -> None:
    contracts = {}
    cp = ROOT / "data" / "contracts.json"
    if cp.exists():
        contracts = json.loads(cp.read_text(encoding="utf-8")).get("contracts") or {}

    live = {}
    lp = ROOT / "data" / "marketplace_codehash_live.json"
    if lp.exists():
        live = json.loads(lp.read_text(encoding="utf-8"))

    mkt = contracts.get("marketplace") or ""
    ag = contracts.get("agents_marketplace") or ""
    mkt_ok = "1" if (live.get("marketplace") or {}).get("ok") else "0"
    ag_ok = "1" if (live.get("agents_marketplace") or {}).get("ok") else "0"

    lines = [
        "# Auto-generated — do not put PEM here",
        "VITE_CHAIN_ID=1",
        "VITE_MVX_API=https://api.multiversx.com",
        f"VITE_LIA_PROTOCOL_WALLET={LIA}",
        f"VITE_MARKETPLACE_ADDRESS={mkt}",
        f"VITE_MARKETPLACE_CODEHASH_OK={mkt_ok}",
        f"VITE_AGENTS_MARKETPLACE_ADDRESS={ag or ''}",
        f"VITE_AGENTS_CODEHASH_OK={ag_ok}",
        "VITE_AGENTS_FEE_BPS=300",
        "",
        "# After both CODEHASH_OK=1: rebuild GH Pages and remove SC banners",
    ]
    out = ROOT / "apps" / "frontend" / ".env.mainnet.example"
    out.write_text("\n".join(lines), encoding="utf-8")
    print("wrote", out)
    print("\n".join(lines))


if __name__ == "__main__":
    main()
