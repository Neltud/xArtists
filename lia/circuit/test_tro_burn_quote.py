from lia.circuit.tro_burn_quote import human_tro_to_atomic, quote_reward

def test_ten_tro_default():
    q = quote_reward(human_tro_to_atomic(10.0), pool_egld_wei=10**18)
    assert q.whole_tro == 10
    assert q.reward_total_wei == 10 * 10**15
    assert q.to_protocol_wei == q.reward_total_wei // 10
    assert not q.capped_by_pool

def test_pool_cap():
    q = quote_reward(human_tro_to_atomic(1000.0), pool_egld_wei=10**15)
    assert q.capped_by_pool
    assert q.reward_total_wei == 10**15

def test_zero():
    assert quote_reward(0).reward_total_wei == 0

if __name__ == "__main__":
    test_ten_tro_default()
    test_pool_cap()
    test_zero()
    print("tro_burn_quote OK")
