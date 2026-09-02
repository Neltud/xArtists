"""
MultiversX mainnet gas cost estimates for LIA + artists.
Uses network config when available; falls back to documented defaults.
"""
from __future__ import annotations

import json
import time
import urllib.request
from typing import Any

MVX_API = "https://api.multiversx.com"

# Typical gas limits (units) — conservative mainnet ops
GAS_LIMITS = {
    "transfer_egld": 50_000,
    "esdt_transfer": 500_000,
    "nft_transfer": 1_000_000,
    "list_nft": 25_000_000,
    "buy_nft": 18_000_000,
    "place_bid": 12_000_000,
    "swap_dex": 30_000_000,
    "hatom_supply": 25_000_000,
    "issue_collection": 60_000_000,
    "mint_nft": 20_000_000,
    "deploy_sc": 200_000_000,
}

# Defaults if network config unreachable
DEFAULT_MIN_GAS_PRICE = 1_000_000_000  # 1000000000 = 0.001 EGLD per 1e9 units style
DEFAULT_GAS_PRICE_MODIFIER = 0.01


def _get(url: str) -> Any:
    req = urllib.request.Request(url, headers={"User-Agent": "xArtists-LIA/1.0"})
    with urllib.request.urlopen(req, timeout=12) as r:
        return json.loads(r.read().decode())


def network_gas_config() -> dict[str, Any]:
    try:
        # gateway-style often mirrored on api network/config
        data = _get(f"{MVX_API}/network/config")
        cfg = data.get("config") or data.get("data", {}).get("config") or data
        min_gp = int(cfg.get("erd_min_gas_price") or DEFAULT_MIN_GAS_PRICE)
        mod = float(cfg.get("erd_gas_price_modifier") or DEFAULT_GAS_PRICE_MODIFIER)
        return {
            "ok": True,
            "erd_min_gas_price": min_gp,
            "erd_gas_price_modifier": mod,
            "source": "api.multiversx.com/network/config",
        }
    except Exception as e:
        return {
            "ok": False,
            "erd_min_gas_price": DEFAULT_MIN_GAS_PRICE,
            "erd_gas_price_modifier": DEFAULT_GAS_PRICE_MODIFIER,
            "error": str(e),
            "source": "defaults",
        }


def estimate_fee_egld(
    gas_limit: int,
    *,
    gas_price: int | None = None,
    is_contract: bool = True,
    cfg: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Approximate fee in EGLD.
    Contract execution component uses gas_price * modifier (MVX model simplified).
    """
    c = cfg or network_gas_config()
    gp = gas_price or int(c.get("erd_min_gas_price") or DEFAULT_MIN_GAS_PRICE)
    mod = float(c.get("erd_gas_price_modifier") or DEFAULT_GAS_PRICE_MODIFIER)
    # Simplified: treat full limit as execution-heavy for SC ops
    if is_contract:
        fee_atomic = int(gas_limit * gp * mod)
    else:
        fee_atomic = int(gas_limit * gp)
    fee_egld = fee_atomic / 1e18
    return {
        "gas_limit": gas_limit,
        "gas_price": gp,
        "modifier": mod if is_contract else 1.0,
        "fee_egld": fee_egld,
        "fee_atomic": fee_atomic,
    }


def cost_table(*, egld_usd: float = 0.0) -> dict[str, Any]:
    cfg = network_gas_config()
    rows = []
    for name, limit in GAS_LIMITS.items():
        is_sc = name not in ("transfer_egld",)
        est = estimate_fee_egld(limit, is_contract=is_sc, cfg=cfg)
        fee = est["fee_egld"]
        rows.append(
            {
                "op": name,
                "gas_limit": limit,
                "fee_egld": round(fee, 8),
                "fee_usd": round(fee * egld_usd, 6) if egld_usd else None,
            }
        )
    return {
        "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "network": "mainnet",
        "config": cfg,
        "egld_usd": egld_usd,
        "operations": rows,
        "note": "Estimates only — use /transaction/cost for exact simulation before send",
    }


def simulate_portfolio_with_gas(
    *,
    start_usd: float,
    days: int = 30,
    trades_per_day: float = 5.0,
    win_rate: float = 0.55,
    gain_pct: float = 0.01,
    loss_pct: float = 0.008,
    gas_per_trade_egld: float | None = None,
    egld_usd: float = 20.0,
) -> dict[str, Any]:
    """Equity path after deducting gas each trade (approx swap gas)."""
    cfg = network_gas_config()
    if gas_per_trade_egld is None:
        gas_per_trade_egld = estimate_fee_egld(
            GAS_LIMITS["swap_dex"], is_contract=True, cfg=cfg
        )["fee_egld"]
    gas_usd = gas_per_trade_egld * egld_usd
    trades = int(trades_per_day * days)
    wins = int(round(trades * win_rate))
    losses = trades - wins
    eq = start_usd
    gas_total = 0.0
    for i in range(trades):
        eq -= gas_usd
        gas_total += gas_usd
        if eq <= 0:
            eq = 0.0
            break
        if i < wins:
            eq *= 1 + gain_pct
        else:
            eq *= 1 - loss_pct
    return {
        "start_usd": start_usd,
        "end_usd": round(eq, 4),
        "trades": trades,
        "gas_per_trade_usd": round(gas_usd, 6),
        "gas_total_usd": round(gas_total, 4),
        "net_after_gas": True,
        "egld_usd": egld_usd,
        "gas_per_trade_egld": gas_per_trade_egld,
    }


if __name__ == "__main__":
    print(json.dumps(cost_table(egld_usd=25.0), indent=2))
    print(json.dumps(simulate_portfolio_with_gas(start_usd=100.0), indent=2))
