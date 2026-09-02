"""
Go-live security gates — fail closed.

Critical rules:
  - CHAIN must be mainnet (1)
  - LIA_LIVE_TRADING requires explicit env AND micro_proof file
  - Marketplace / agents codeHash must be non-null before user-fund product claims
  - Never treat paper PnL as live treasury

Usage:
  from lia.security.go_live_gates import assert_paper_only, evaluate_gates
  python -m lia.security.go_live_gates
"""
from __future__ import annotations

import json
import os
import time
import urllib.request
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Optional

ROOT = Path(__file__).resolve().parents[2]
API = os.getenv("API", "https://api.multiversx.com").rstrip("/")


@dataclass
class GateResult:
    id: str
    ok: bool
    critical: bool
    detail: str


@dataclass
class GateReport:
    ts: str
    chain_id: str
    live_env: bool
    all_critical_ok: bool
    results: list[GateResult] = field(default_factory=list)
    allow_live_trading: bool = False
    allow_product_claims_live: bool = False

    def to_dict(self) -> dict[str, Any]:
        return {
            **{k: v for k, v in asdict(self).items() if k != "results"},
            "results": [asdict(r) for r in self.results],
        }


def _load_json(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _codehash(addr: str) -> tuple[Optional[str], str]:
    if not addr or not str(addr).startswith("erd1"):
        return None, "invalid address"
    try:
        req = urllib.request.Request(
            f"{API}/accounts/{addr}",
            headers={"User-Agent": "xArtists-GoLiveGates/1.0", "Accept": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=12) as r:
            acc = json.loads(r.read().decode())
        ch = acc.get("codeHash") or acc.get("code_hash")
        if not ch or ch in ("", "null", None):
            return None, "empty account / null codeHash"
        return str(ch), "ok"
    except Exception as e:
        return None, str(e)[:120]


def evaluate_gates(*, check_network: bool = True) -> GateReport:
    chain = str(os.getenv("CHAIN_ID") or os.getenv("CHAIN") or "1")
    live = os.getenv("LIA_LIVE_TRADING", "0") == "1"
    results: list[GateResult] = []

    results.append(
        GateResult("chain_mainnet", chain == "1", True, f"CHAIN={chain} (must be 1)")
    )

    contracts = _load_json(ROOT / "data" / "contracts.json")
    c = (contracts.get("contracts") or {}) if contracts else {}
    market = c.get("marketplace")
    agents = c.get("agents_marketplace")
    results.append(
        GateResult(
            "contracts_file",
            bool(contracts.get("network") == "mainnet"),
            False,
            f"network={contracts.get('network')} marketplace={market!r} agents={agents!r}",
        )
    )

    market_ch = agents_ch = None
    market_detail = agents_detail = "skipped"
    if check_network:
        if market:
            market_ch, market_detail = _codehash(str(market))
        else:
            market_detail = "address null"
        if agents:
            agents_ch, agents_detail = _codehash(str(agents))
        else:
            agents_detail = "address null"

    results.append(
        GateResult(
            "marketplace_codehash",
            bool(market_ch),
            True,
            market_detail if not market_ch else f"codeHash={market_ch[:16]}…",
        )
    )
    results.append(
        GateResult(
            "agents_marketplace_codehash",
            bool(agents_ch),
            True,
            agents_detail if not agents_ch else f"codeHash={agents_ch[:16]}…",
        )
    )

    proof_paths = [
        ROOT / "data" / "micro_proof_log.json",
        ROOT / "data" / "micro_proofs.json",
    ]
    proofs = []
    for pp in proof_paths:
        if pp.exists():
            try:
                raw = json.loads(pp.read_text(encoding="utf-8"))
                if isinstance(raw, list):
                    proofs.extend(raw)
                elif isinstance(raw, dict) and raw.get("proofs"):
                    proofs.extend(raw["proofs"])
                elif isinstance(raw, dict) and raw.get("txs"):
                    proofs.extend(raw["txs"])
            except Exception:
                pass
    n_ok = sum(
        1
        for p in proofs
        if isinstance(p, dict) and (p.get("ok") or p.get("status") in ("success", "ok"))
    )
    results.append(
        GateResult(
            "micro_proofs",
            n_ok >= 1,
            True if live else False,
            f"successful_proofs={n_ok} (need ≥1 before LIVE)",
        )
    )

    pem_leaks = [
        p
        for p in ROOT.glob("**/*.pem")
        if "node_modules" not in str(p) and ".git" not in str(p)
    ]
    results.append(
        GateResult(
            "no_pem_in_repo",
            len(pem_leaks) == 0,
            True,
            "clean" if not pem_leaks else f"FOUND {len(pem_leaks)} pem files",
        )
    )
    results.append(
        GateResult("live_flag", True, False, f"LIA_LIVE_TRADING={'1' if live else '0'}")
    )

    critical_ok = all(r.ok for r in results if r.critical)
    allow_live = live and critical_ok and n_ok >= 1 and chain == "1"
    allow_product = bool(market_ch) and bool(agents_ch)

    report = GateReport(
        ts=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        chain_id=chain,
        live_env=live,
        all_critical_ok=critical_ok,
        results=results,
        allow_live_trading=allow_live,
        allow_product_claims_live=allow_product,
    )
    out = ROOT / "data" / "go_live_gates.json"
    try:
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(report.to_dict(), indent=2) + "\n", encoding="utf-8")
        for rel in (
            "apps/frontend/public/data/go_live_gates.json",
            "docs/data/go_live_gates.json",
        ):
            dest = ROOT / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(out.read_text(encoding="utf-8"), encoding="utf-8")
    except Exception:
        pass
    return report


def assert_paper_only() -> None:
    if os.getenv("LIA_LIVE_TRADING", "0") != "1":
        return
    rep = evaluate_gates(check_network=True)
    if not rep.allow_live_trading:
        raise RuntimeError(
            "LIA_LIVE_TRADING=1 blocked by go_live_gates: "
            + json.dumps(rep.to_dict())[:500]
        )


def main() -> int:
    import sys

    strict = "--strict" in sys.argv
    rep = evaluate_gates(check_network=True)
    print(json.dumps(rep.to_dict(), indent=2))
    if strict and not rep.all_critical_ok:
        return 2
    if os.getenv("LIA_LIVE_TRADING", "0") == "1" and not rep.allow_live_trading:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
