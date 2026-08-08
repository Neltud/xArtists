"""Regression: frontend SC flag semantics (pure python mirror of scStatus.ts)."""
from __future__ import annotations


def truthy(v: str | None) -> bool:
    return v in ("1", "true", "TRUE", "yes")


def can_list_buy(codehash_ok: str | None, address: str | None) -> bool:
    return truthy(codehash_ok) and bool(address and address.startswith("erd1"))


def is_lia_ops(addr: str | None, lia: str) -> bool:
    if not addr:
        return False
    return addr.strip().lower() == lia.lower()


LIA = "erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6"


def test_list_buy_blocked_without_codehash():
    assert can_list_buy("0", "erd1qqqqqqqqqqqqqpgqjzn7zjyevwez8n0zfevpvnrwyp2ln879yj7sj8354t") is False
    assert can_list_buy(None, "erd1qqqqqqqqqqqqqpgqjzn7zjyevwez8n0zfevpvnrwyp2ln879yj7sj8354t") is False


def test_list_buy_allowed_when_live():
    assert can_list_buy("1", "erd1qqqqqqqqqqqqqpgqjzn7zjyevwez8n0zfevpvnrwyp2ln879yj7sj8354t") is True


def test_lia_ops_detection():
    assert is_lia_ops(LIA, LIA) is True
    assert is_lia_ops(LIA.upper().replace("ERD1", "erd1"), LIA) is True
    assert is_lia_ops("erd1qqqqqqqqqqqqqpgqjzn7zjyevwez8n0zfevpvnrwyp2ln879yj7sj8354t", LIA) is False
    assert is_lia_ops(None, LIA) is False


if __name__ == "__main__":
    test_list_buy_blocked_without_codehash()
    test_list_buy_allowed_when_live()
    test_lia_ops_detection()
    print("OK test_sc_status_flags")
