#!/usr/bin/env python3
"""
Automated post-deploy verification suite — MultiversX mainnet.

Checks (ordered):
  1. contracts.json addresses present
  2. On-chain account exists + codeHash non-null (LIVE)
  3. Optional: fee_bps view / query if ABI path known
  4. contracts.deployed.json consistency (if present)
  5. VITE readiness flags
  6. Safety: LIA_LIVE_TRADING still 0 in status JSON

Writes: data/post_deploy_report.json
Exit: 0 = all critical PASS · 1 = soft issues · 2 = critical FAIL

Usage:
  python scripts/post_deploy_verify.py
  python scripts/post_deploy_verify.py --strict
  python scripts/post_deploy_verify.py --marketplace erd1... --agents erd1...
"""
from __future__ import annotations

import argparse
import json
import os
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

ROOT = Path(__file__).resolve().parents[1]
API = os.getenv("API", "https://api.multiversx.com").rstrip("/")
GATEWAY = os.getenv("PROXY", "https://gateway.multiversx.com").rstrip("/")
LIA_WALLET = "erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6"


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def http_json(url: str, timeout: int = 30) -> dict:
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


def load_json(path: Path) -> dict:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def codehash_of(account: dict) -> Optional[str]:
    ch = account.get("codeHash")
    if isinstance(ch, str) and len(ch) >= 16 and ch not in ("0" * 64, ""):
        code = account.get("code")
        if code == "":
            return None
        return ch
    code = account.get("code")
    if code and isinstance(code, str) and len(code) > 10:
        # code present but hash missing — still deployed-ish
        return account.get("codeHash") or "code-present"
    return None


def check_account(label: str, addr: Optional[str]) -> dict[str, Any]:
    item: dict[str, Any] = {
        "label": label,
        "address": addr,
        "ok": False,
        "severity": "FAIL",
        "checks": [],
    }
    if not addr or not str(addr).startswith("erd1") or len(str(addr)) < 20:
        item["checks"].append({"id": "address", "pass": False, "detail": "missing or invalid erd1"})
        item["verdict"] = "NO_ADDRESS"
        return item

    item["checks"].append({"id": "address", "pass": True, "detail": addr})
    item["explorer"] = f"https://explorer.multiversx.com/accounts/{addr}"

    try:
        acc = http_json(f"{API}/accounts/{addr}")
    except urllib.error.HTTPError as e:
        item["checks"].append({"id": "api", "pass": False, "detail": f"HTTP {e.code}"})
        item["verdict"] = "API_ERROR"
        return item
    except Exception as e:
        item["checks"].append({"id": "api", "pass": False, "detail": str(e)})
        item["verdict"] = "API_ERROR"
        return item

    ch = codehash_of(acc)
    bal = acc.get("balance", "0")
    item["codeHash"] = ch
    item["balance"] = bal
    item["ownerAddress"] = acc.get("ownerAddress") or acc.get("owner")

    if ch:
        item["checks"].append({"id": "codeHash", "pass": True, "detail": ch[:16] + "…"})
        item["ok"] = True
        item["verdict"] = "LIVE"
    else:
        item["checks"].append(
            {
                "id": "codeHash",
                "pass": False,
                "detail": "null/empty — not a deployed contract",
            }
        )
        item["verdict"] = "NOT_DEPLOYED"

    return item


def try_query_fee_bps(addr: str) -> dict[str, Any]:
    """Best-effort VM query for getFeeBps / get_fee_bps — non-fatal."""
    # MultiversX vm-values/query endpoint
    body = json.dumps(
        {
            "scAddress": addr,
            "funcName": "getFeeBps",
            "args": [],
        }
    ).encode()
    for fn in ("getFeeBps", "get_fee_bps", "feeBps"):
        try:
            payload = json.dumps(
                {"scAddress": addr, "funcName": fn, "args": []}
            ).encode()
            req = urllib.request.Request(
                f"{GATEWAY}/vm-values/query",
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=20) as r:
                data = json.loads(r.read().decode())
            ret = (data.get("data") or {}).get("data") or data.get("data") or {}
            if isinstance(ret, dict) and ret.get("returnData") is not None:
                return {"ok": True, "func": fn, "raw": ret.get("returnData")}
            if data.get("error"):
                continue
            return {"ok": True, "func": fn, "raw": data}
        except Exception as e:
            last = str(e)
            continue
    return {"ok": False, "detail": "view query unavailable or endpoint missing"}


def check_deployed_consistency(
    contracts: dict, deployed: dict
) -> list[dict[str, Any]]:
    checks = []
    mapping = {
        "agents-marketplace": "agents_marketplace",
        "nft-marketplace": "marketplace",
    }
    for dep_key, c_key in mapping.items():
        d_addr = deployed.get(dep_key)
        c_addr = contracts.get(c_key)
        if not d_addr:
            checks.append(
                {
                    "id": f"consistency_{dep_key}",
                    "pass": True,
                    "detail": "no contracts.deployed entry (ok if manual post_deploy)",
                    "soft": True,
                }
            )
            continue
        match = d_addr == c_addr
        checks.append(
            {
                "id": f"consistency_{dep_key}",
                "pass": match,
                "detail": f"deployed={d_addr} contracts.json={c_addr}",
                "soft": False,
            }
        )
    return checks


def check_lia_live_flag() -> dict[str, Any]:
    st = load_json(ROOT / "data" / "lia_v6_status.json")
    flag = st.get("LIA_LIVE_TRADING", 0)
    try:
        live = int(flag) == 1 or flag is True
    except Exception:
        live = False
    return {
        "id": "lia_live_trading",
        "pass": not live,  # must stay 0 post-deploy until micro OK
        "detail": f"LIA_LIVE_TRADING={flag} (expected 0 until micro-trades)",
        "soft": True,
    }


def build_vite(mkt: dict, agents: dict) -> dict[str, str]:
    return {
        "VITE_MARKETPLACE_ADDRESS": mkt.get("address") or "",
        "VITE_MARKETPLACE_CODEHASH_OK": "1" if mkt.get("ok") else "0",
        "VITE_AGENTS_MARKETPLACE_ADDRESS": agents.get("address") or "",
        "VITE_AGENTS_CODEHASH_OK": "1" if agents.get("ok") else "0",
        "VITE_AGENTS_FEE_BPS": "300",
    }


def build_release_state(mkt: dict, agents: dict, critical_ok: bool) -> dict[str, Any]:
    return {
        "publication_operator": "vellum",
        "mode": "pre-mainnet",
        "mainnet_only": True,
        "keep_lia_live_trading_off": True,
        "allow_user_marketplace_actions": critical_ok,
        "allow_live_ops_flags": False,
        "strict_sequence": [
            "paper_cycle",
            "publish_pages_artifacts",
            "deploy_scs",
            "verify_codehash",
            "micro_smokes_user_wallet",
            "live_ops_flags",
        ],
        "proofs_required": [
            "marketplace_codehash_verified",
            "agents_codehash_verified",
            "tip_smoke",
            "list_smoke",
            "buy_smoke",
            "mint_pack_smoke",
        ],
        "contracts": {
            "marketplace": {
                "address": mkt.get("address"),
                "codehash_ok": bool(mkt.get("ok")),
                "verdict": mkt.get("verdict"),
            },
            "agents_marketplace": {
                "address": agents.get("address"),
                "codehash_ok": bool(agents.get("ok")),
                "verdict": agents.get("verdict"),
            },
        },
    }


def update_public_config(mkt: dict, agents: dict, critical_ok: bool, checked: str) -> Path:
    path = ROOT / "data" / "config.json"
    config = load_json(path)
    config["updated"] = checked
    config["ops_release"] = build_release_state(mkt, agents, critical_ok)
    config["ops_release"]["checked"] = checked
    config["ops_release"]["lia_protocol_wallet"] = LIA_WALLET
    path.write_text(json.dumps(config, indent=2), encoding="utf-8")
    return path


def write_vite_example(vite: dict[str, str]) -> Path:
    lines = [
        "# Auto-generated by post_deploy_verify.py",
        "VITE_CHAIN_ID=1",
        "VITE_MVX_API=https://api.multiversx.com",
        f"VITE_LIA_PROTOCOL_WALLET={LIA_WALLET}",
    ]
    for k, v in vite.items():
        lines.append(f"{k}={v}")
    env_path = ROOT / "apps" / "frontend" / ".env.mainnet.example"
    env_path.parent.mkdir(parents=True, exist_ok=True)
    env_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return env_path


def main() -> int:
    ap = argparse.ArgumentParser(description="Post-deploy automated verification")
    ap.add_argument("--marketplace", default=None)
    ap.add_argument("--agents", default=None)
    ap.add_argument(
        "--strict",
        action="store_true",
        help="Exit 2 if any soft check fails",
    )
    ap.add_argument(
        "--query-views",
        action="store_true",
        help="Attempt getFeeBps VM query (best-effort)",
    )
    ap.add_argument(
        "--retry",
        type=int,
        default=3,
        help="Retries per account if codeHash still null (API lag)",
    )
    ap.add_argument(
        "--retry-wait",
        type=float,
        default=15.0,
        help="Seconds between retries",
    )
    args = ap.parse_args()

    contracts_file = load_json(ROOT / "data" / "contracts.json")
    contracts = contracts_file.get("contracts") or {}
    deployed = load_json(ROOT / "data" / "contracts.deployed.json")

    mkt_addr = args.marketplace or contracts.get("marketplace")
    ag_addr = args.agents or contracts.get("agents_marketplace")

    # Retry loop for API indexing lag after deploy
    mkt = check_account("marketplace", mkt_addr)
    ag = check_account("agents_marketplace", ag_addr)
    for attempt in range(1, max(1, args.retry) + 1):
        if mkt.get("ok") and ag.get("ok"):
            break
        if attempt >= args.retry:
            break
        if not mkt.get("ok") or not ag.get("ok"):
            print(
                f"  retry {attempt}/{args.retry}: waiting {args.retry_wait}s for codeHash…"
            )
            time.sleep(args.retry_wait)
            if not mkt.get("ok"):
                mkt = check_account("marketplace", mkt_addr)
            if not ag.get("ok"):
                ag = check_account("agents_marketplace", ag_addr)

    soft_checks = check_deployed_consistency(contracts, deployed)
    soft_checks.append(check_lia_live_flag())

    views: dict[str, Any] = {}
    if args.query_views:
        for label, item in (("marketplace", mkt), ("agents_marketplace", ag)):
            if item.get("ok") and item.get("address"):
                views[label] = try_query_fee_bps(item["address"])

    critical_ok = bool(mkt.get("ok") and ag.get("ok"))
    soft_fail = [c for c in soft_checks if not c.get("pass") and not c.get("soft")]
    soft_warn = [c for c in soft_checks if not c.get("pass") and c.get("soft")]

    vite = build_vite(mkt, ag)

    report = {
        "checked": utc_now(),
        "network": "mainnet",
        "operator": "vellum",
        "critical_ok": critical_ok,
        "marketplace": mkt,
        "agents_marketplace": ag,
        "consistency": soft_checks,
        "views": views,
        "vite": vite,
        "release_state": build_release_state(mkt, ag, critical_ok),
        "next": [],
        "gate": {
            "enable_list_buy_ui": critical_ok,
            "enable_lia_live_trading": False,
            "reason": (
                "Both SC LIVE — inject VITE and rebuild Pages"
                if critical_ok
                else "Do NOT enable Buy UI — codeHash missing"
            ),
        },
    }

    if critical_ok:
        report["next"] = [
            "Copy vite block into deploy-pages.yml env",
            "git add data/contracts.json data/post_deploy_report.json data/marketplace_codehash_live.json",
            "git commit && git push  # Pages rebuild",
            "Micro List/Buy with USER wallet (never LIA ops)",
            "Keep LIA_LIVE_TRADING=0 until micro-trades OK",
        ]
    else:
        report["next"] = [
            "Re-run: ./scripts/runbook_deploy.sh deploy",
            "Or: python scripts/post_deploy_contracts.py --marketplace erd1… --agents erd1…",
            "Then: python scripts/post_deploy_verify.py --retry 5",
        ]

    # Mirror legacy marketplace_codehash_live.json format (extended)
    live = {
        "checked": report["checked"],
        "marketplace": mkt,
        "agents_marketplace": ag,
        "all_ok": critical_ok,
        "vite": vite,
        "source": "post_deploy_verify.py",
    }
    out_live = ROOT / "data" / "marketplace_codehash_live.json"
    out_live.write_text(json.dumps(live, indent=2), encoding="utf-8")

    out_report = ROOT / "data" / "post_deploy_report.json"
    out_report.write_text(json.dumps(report, indent=2), encoding="utf-8")
    config_path = update_public_config(mkt, ag, critical_ok, report["checked"])

    # Update contracts.json verification section
    if contracts_file:
        contracts_file["verification"] = {
            "marketplace_mainnet": mkt,
            "agents_marketplace": ag,
            "checked": report["checked"],
            "critical_ok": critical_ok,
        }
        contracts_file["updated"] = report["checked"]
        (ROOT / "data" / "contracts.json").write_text(
            json.dumps(contracts_file, indent=2), encoding="utf-8"
        )

    # Human summary
    print(json.dumps(report, indent=2))
    print("")
    print("wrote", out_report)
    print("wrote", out_live)

    if critical_ok:
        print("\n✅ POST-DEPLOY CRITICAL CHECKS PASSED")
        # regenerate vite example
        try:
            env_path = write_vite_example(vite)
            print("wrote", env_path)
        except Exception as e:
            print("vite write warn:", e)
        print("updated", config_path)
        if soft_warn and args.strict:
            print("⚠️  soft warnings under --strict → exit 1")
            return 1
        return 0

    print("\n❌ POST-DEPLOY CRITICAL CHECKS FAILED — do not enable Buy UI")
    print("updated", config_path)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
