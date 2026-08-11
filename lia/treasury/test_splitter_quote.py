from lia.treasury.splitter_quote import quote_split

def test_default_split_40_30_20_10():
    q = quote_split(10_000)
    assert q["mission"] == 4000
    assert q["reserve"] == 3000
    assert q["reward"] == 2000
    assert q["ops"] == 1000

def test_dust_to_ops():
    q = quote_split(100)
    assert q["mission"] + q["reserve"] + q["reward"] + q["ops"] == 100

def test_rejects_bad_bps():
    try:
        quote_split(100, {"mission": 1, "reserve": 1, "reward": 1, "ops": 1})
        assert False
    except ValueError:
        pass
