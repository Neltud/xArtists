"""On-chain-leaning price oracles for LIA (MVX indexer + secondary refs)."""

from lia.oracles.price_oracle import (
    OracleQuote,
    PriceOracle,
    fetch_egld_usd,
    fetch_token_usd,
    load_config,
)

__all__ = [
    "PriceOracle",
    "OracleQuote",
    "fetch_egld_usd",
    "fetch_token_usd",
    "load_config",
]
