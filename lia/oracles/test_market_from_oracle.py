"""Smoke tests for oracle → market snapshot."""
from __future__ import annotations

from lia.oracles.market_from_oracle import (
    build_book_from_status,
    build_market_from_oracle,
    egld_usd_from_sources,
)


def test_build_without_network_fallback() -> None:
    m = build_market_from_oracle(refresh=False)
    assert "price" in m
    assert "token" in m
    assert "egld_usd" in m
    b = build_book_from_status()
    assert b["equity_usd"] >= 0


def test_egld_from_oracle_dict() -> None:
    assert egld_usd_from_sources({"egld_usd": 3.5}) == 3.5
    assert egld_usd_from_sources({"pairs": {"EGLD-USD": {"price": 2.1}}}) == 2.1


if __name__ == "__main__":
    test_build_without_network_fallback()
    test_egld_from_oracle_dict()
    m = build_market_from_oracle(refresh=True)
    print("ok", m.get("oracle_ok"), "price", m.get("price"), "egld", m.get("egld_usd"))
