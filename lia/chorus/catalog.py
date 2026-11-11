"""Chorus signal catalog — 120 defined signals. Missing inputs stay neutral (0)."""
from __future__ import annotations

from typing import Any

FAMILIES: tuple[str, ...] = (
    "price",
    "volume",
    "volatility",
    "liquidity",
    "onchain",
    "dex",
    "funding",
    "social",
    "art",
    "risk",
    "macro",
    "external",
)

_AXES: dict[str, tuple[str, ...]] = {
    "price": ("ret_1h", "ret_4h", "ret_24h", "ret_7d", "vwap_dev", "rsi_zone", "ma_cross", "range_pos", "gap", "close_vs_high"),
    "volume": ("spike_1h", "spike_24h", "trend_3d", "quiet_tape", "buy_ratio", "large_print", "dex_share", "stable_share", "nft_share", "decay"),
    "volatility": ("atr_1h", "atr_24h", "bb_width", "realized_7d", "jump", "compression", "skew", "wick_ratio", "overnight", "regime"),
    "liquidity": ("pool_usd", "depth_1pct", "spread_bps", "impact_10k", "lp_change", "withdrawals", "stable_depth", "egld_depth", "fragmentation", "stale_quote"),
    "onchain": ("tx_count", "active_addr", "contract_calls", "nft_mints", "stake_delta", "fee_burn", "failed_tx", "new_contracts", "bridge_in", "bridge_out"),
    "dex": ("xex_vs_onedex", "xex_vs_jex", "onedex_vs_jex", "route_cost", "arb_window", "quote_age", "slippage_sim", "pool_imbalance", "fee_tier", "mev_proxy"),
    "funding": ("perp_funding", "basis", "open_interest", "liq_long", "liq_short", "borrow_egld", "borrow_usdc", "utilization", "hatom_supply", "hatom_borrow"),
    "social": ("mentions_1h", "mentions_24h", "sentiment", "unique_authors", "bot_share", "news_shock", "discord_msgs", "x_engagement", "narrative_shift", "silence"),
    "art": ("floor_24h", "floor_7d", "listings", "sales_count", "royalty_volume", "wash_proxy", "holder_conc", "new_collectors", "museum_attention", "primary_vs_secondary"),
    "risk": ("drawdown", "concentration", "stable_depeg", "oracle_dev", "upgrade_flag", "payable_flag", "house_low", "consecutive_loss", "correlation_break", "operator_halt"),
    "macro": ("egld_usd", "btc_usd", "eth_usd", "dxy_proxy", "rates_proxy", "risk_on_basket", "weekend", "event_window", "exchange_notice", "liquidity_regime"),
    "external": ("chatgpt_brief", "grok_note", "gemini_note", "human_desk", "discord_mod", "news_digest", "partner_gsn", "curator_note", "legal_flag", "ops_freeze"),
}


def catalog() -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for family, axes in _AXES.items():
        for i, axis in enumerate(axes, start=1):
            rows.append(
                {
                    "id": f"{family}.{axis}",
                    "family": family,
                    "axis": axis,
                    "n": i,
                    "unit": "score_-1_1",
                }
            )
    if len(rows) != 120:
        raise RuntimeError(f"catalog size {len(rows)} != 120")
    return rows
