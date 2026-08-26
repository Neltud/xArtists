"""Regression: frontend SC flag semantics (pure python mirror of scStatus.ts)."""
from __future__ import annotations

KNOWN_EMPTY = "erd1qqqqqqqqqqqqqpgqjzn7zjyevwez8n0zfevpvnrwyp2ln879yj7sj8354t"
LIVE_OTHER = "erd1qqqqqqqqqqqqqpgqmhtx5cctwwtatyaluycjfucre9y5vq2xyj7sqxr8cl"


def truthy(v: str | None) -> bool:
    return v in ("1", "true", "TRUE", "yes")


def can_list_buy(codehash_ok: str | None, address: str | None) -> bool:
    if not truthy(codehash_ok):
        return False
    if not address or not address.startswith("erd1"):
        return False
    if address.lower() == KNOWN_EMPTY.lower():
        return False
    return True


def is_lia_ops(addr: str | None, lia: str) -> bool:
    if not addr:
        return False
    return addr.strip().lower() == lia.lower()


LIA = "erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6"


def test_list_buy_blocked_without_codehash():
    assert can_list_buy("0", KNOWN_EMPTY) is False
    assert can_list_buy(None, KNOWN_EMPTY) is False


def test_list_buy_blocked_known_empty_even_if_flag():
    """Mirror scStatus.ts: placeholder empty account never receives user funds."""
    assert can_list_buy("1", KNOWN_EMPTY) is False


def test_list_buy_allowed_when_live():
    assert can_list_buy("1", LIVE_OTHER) is True


def test_lia_ops_detection():
    assert is_lia_ops(LIA, LIA) is True
    assert is_lia_ops(LIA.upper().replace("ERD1", "erd1"), LIA) is True
    assert is_lia_ops(KNOWN_EMPTY, LIA) is False
    assert is_lia_ops(None, LIA) is False


if __name__ == "__main__":
    test_list_buy_blocked_without_codehash()
    test_list_buy_blocked_known_empty_even_if_flag()
    test_list_buy_allowed_when_live()
    test_lia_ops_detection()
    print("OK test_sc_status_flags")
