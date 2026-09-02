from lia.burnify.agent import BurnifyAgent, WalletSnapshot, run_burnify_cycle
from lia.burnify.config import BurnifyConfig
from lia.burnify.state import BurnifyState
from lia.burnify.tx_builder import build_claim_rewards_egld, build_stake_bfy


def test_stake_priority():
    d = BurnifyAgent().decide(WalletSnapshot(egld=1.0, bfy_free=5.0, tro=50.0), BurnifyState())
    assert d.action == "stake_bfy"


def test_claim_after_batches():
    st = BurnifyState(batches_since_claim=3)
    d = BurnifyAgent(BurnifyConfig(claim_after_batches=3)).decide(
        WalletSnapshot(egld=1.0, bfy_free=0.0, tro=50.0), st
    )
    assert d.action == "claim_egld"


def test_batch_when_funded():
    d = BurnifyAgent(BurnifyConfig(claim_after_batches=99, min_bfy_staked=1000)).decide(
        WalletSnapshot(egld=1.0, bfy_free=0.0, tro=50.0), BurnifyState()
    )
    assert d.action == "tro_batch"


def test_gas_defense():
    d = BurnifyAgent().decide(WalletSnapshot(egld=0.05, bfy_free=10.0), BurnifyState())
    assert d.action == "blocked"


def test_tx_builders():
    assert build_claim_rewards_egld().gas_limit > 0
    assert "ESDTTransfer" in build_stake_bfy(10**18).data


def test_run_cycle_paper():
    out = run_burnify_cycle(WalletSnapshot(egld=0.5, bfy_free=2.0), apply_paper_state=True)
    assert out["ok"] and out["paper"] is True


if __name__ == "__main__":
    test_stake_priority()
    test_claim_after_batches()
    test_batch_when_funded()
    test_gas_defense()
    test_tx_builders()
    test_run_cycle_paper()
    print("burnify agent OK")
