"""On-chain-leaning price oracles for LIA (MVX indexer + secondary refs)."""

from lia.oracles.price_oracle import (
    OracleQuote,
    PriceOracle,
    fetch_egld_usd,
    fetch_token_usd,
    load_config,
)

try:
    from lia.oracles.market_from_oracle import (
        build_book_from_status,
        build_market_from_oracle,
        egld_usd_from_sources,
        load_oracle_prices,
        refresh_oracle,
    )
except Exception:  # pragma: no cover
    build_market_from_oracle = None  # type: ignore
    build_book_from_status = None  # type: ignore

__all__ = [
    "PriceOracle",
    "OracleQuote",
    "fetch_egld_usd",
    "fetch_token_usd",
    "load_config",
    "build_market_from_oracle",
    "build_book_from_status",
    "egld_usd_from_sources",
    "load_oracle_prices",
    "refresh_oracle",
]
