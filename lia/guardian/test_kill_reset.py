"""Kill-Switch reset circuit tests."""
from __future__ import annotations

import time

from lia.guardian.kill_reset import KillResetCircuit, apply_reset_to_kill_switch
from lia.guardian.preflight import KillReason, KillState, KillSwitch, PreFlightValidator


def test_soft_reset_single_step(tmp_path, monkeypatch):
    monkeypatch.setattr("lia.guardian.kill_reset.COOLDOWN_SOFT_SEC", 0.0)
    monkeypatch.setattr("lia.guardian.kill_reset.COOLDOWN_HARD_SEC", 0.0)
    monkeypatch.setattr("lia.guardian.kill_reset.LOG_PATH", tmp_path / "log.json")
    monkeypatch.setattr("lia.guardian.kill_reset.LIVE", False)

    c = KillResetCircuit()
    kill = KillSwitch()
    kill.trip(KillReason.LOSS_STREAK, "5", hard=False)
    r = c.confirm_reset(
        operator_id="ops1",
        state=kill.state.value,
        reason=kill.reason.value,
        tripped_at=kill.tripped_at,
    )
    assert r.ok and r.action == "reset"
    assert apply_reset_to_kill_switch(kill, r)
    assert kill.state == KillState.ARMED


def test_hard_kill_needs_two_step(tmp_path, monkeypatch):
    monkeypatch.setattr("lia.guardian.kill_reset.COOLDOWN_SOFT_SEC", 0.0)
    monkeypatch.setattr("lia.guardian.kill_reset.COOLDOWN_HARD_SEC", 0.0)
    monkeypatch.setattr("lia.guardian.kill_reset.LOG_PATH", tmp_path / "log.json")
    monkeypatch.setattr("lia.guardian.kill_reset.LIVE", False)

    c = KillResetCircuit()
    kill = KillSwitch()
    kill.trip(KillReason.DEATH_SPIRAL, "spiral_score", hard=True)

    r = c.confirm_reset(
        operator_id="ops1",
        state=kill.state.value,
        reason=kill.reason.value,
        tripped_at=kill.tripped_at,
        post_mortem_ref="pm-1",
    )
    assert not r.ok and r.action == "need_request"

    assert c.request_reset(
        operator_id="ops1",
        state=kill.state.value,
        reason=kill.reason.value,
        tripped_at=kill.tripped_at,
        note="reviewed",
    ).ok

    r2 = c.confirm_reset(
        operator_id="ops1",
        state=kill.state.value,
        reason=kill.reason.value,
        tripped_at=kill.tripped_at,
        post_mortem_ref="pm-death-spiral-001",
    )
    assert r2.ok
    apply_reset_to_kill_switch(kill, r2)
    assert kill.state == KillState.ARMED


def test_live_blocks_without_ack(tmp_path, monkeypatch):
    monkeypatch.setattr("lia.guardian.kill_reset.COOLDOWN_SOFT_SEC", 0.0)
    monkeypatch.setattr("lia.guardian.kill_reset.LOG_PATH", tmp_path / "log.json")
    monkeypatch.setattr("lia.guardian.kill_reset.LIVE", True)
    monkeypatch.setattr("lia.guardian.kill_reset.LIVE_ACK", False)

    c = KillResetCircuit()
    r = c.confirm_reset(
        operator_id="ops1",
        state="TRIPPED",
        reason="LOSS_STREAK",
        tripped_at=time.time() - 10,
    )
    assert not r.ok and r.action == "live_block"


def test_validator_helpers(tmp_path, monkeypatch):
    monkeypatch.setattr("lia.guardian.kill_reset.COOLDOWN_SOFT_SEC", 0.0)
    monkeypatch.setattr("lia.guardian.kill_reset.COOLDOWN_HARD_SEC", 0.0)
    monkeypatch.setattr("lia.guardian.kill_reset.LOG_PATH", tmp_path / "log.json")
    monkeypatch.setattr("lia.guardian.kill_reset.LIVE", False)

    v = PreFlightValidator()
    v.kill.trip(KillReason.DRAWDOWN, "dd=-0.15", hard=True)
    assert v.request_kill_reset("ops1", note="post-mortem draft").ok
    assert v.confirm_kill_reset("ops1", post_mortem_ref="docs/pm-001.md").ok
    assert v.kill.state == KillState.ARMED


def test_cooldown_blocks(tmp_path, monkeypatch):
    monkeypatch.setattr("lia.guardian.kill_reset.COOLDOWN_HARD_SEC", 9999.0)
    monkeypatch.setattr("lia.guardian.kill_reset.LOG_PATH", tmp_path / "log.json")
    monkeypatch.setattr("lia.guardian.kill_reset.LIVE", False)

    c = KillResetCircuit()
    r = c.request_reset(
        operator_id="ops1",
        state="KILLED",
        reason="DRAWDOWN",
        tripped_at=time.time(),
    )
    assert not r.ok and r.action == "cooldown"
