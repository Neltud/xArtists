from lia.treasury.splitter_quote import quote_split

def test_default_split():
    q = quote_split(10_000)
    assert q["mission"] == 4000
    assert q["reserve"] == 3000
    assert q["community"] == 3000

def test_dust_to_reserve():
    q = quote_split(100)
    assert q["mission"] + q["reserve"] + q["community"] == 100

def test_rejects_bad_bps():
    try:
        quote_split(100, {"mission": 1, "reserve": 1, "community": 1})
        assert False
    except ValueError:
        pass
