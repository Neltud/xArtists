"""Capital escrow isolé par NFT Agent Pack — validator + tests."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum


class EscrowState(str, Enum):
    CREATED = "CREATED"
    FUNDED = "FUNDED"
    WITHDRAWAL_REQUESTED = "WITHDRAWAL_REQUESTED"
    WITHDRAWN = "WITHDRAWN"


class CapitalEscrowError(Exception):
    pass


WITHDRAWAL_COOLDOWN_HOURS = 48
DEFAULT_MAX_DEPOSIT_MULTIPLIER = 10


@dataclass
class CapitalEscrowAccount:
    escrow_id: str
    nft_id: str
    owner_address: str
    pack_mint_price_atomic: int
    state: EscrowState = EscrowState.CREATED
    balance_atomic: int = 0
    max_deposit_multiplier: int = DEFAULT_MAX_DEPOSIT_MULTIPLIER
    withdrawal_requested_at: datetime | None = None
    history: list[tuple[str, EscrowState, str]] = field(default_factory=list)

    @property
    def max_deposit_atomic(self) -> int:
        return self.pack_mint_price_atomic * self.max_deposit_multiplier


class CapitalEscrowValidator:
    def deposit(
        self,
        account: CapitalEscrowAccount,
        amount_atomic: int,
        caller_address: str,
        now: datetime | None = None,
    ) -> CapitalEscrowAccount:
        now = now or datetime.now(timezone.utc)
        if amount_atomic <= 0:
            raise CapitalEscrowError("deposit amount must be positive")
        if caller_address != account.owner_address:
            raise CapitalEscrowError(
                f"escrow {account.escrow_id}: only NFT owner can deposit"
            )
        if account.state not in (EscrowState.CREATED, EscrowState.FUNDED):
            raise CapitalEscrowError(
                f"escrow {account.escrow_id}: deposit refused from {account.state.value}"
            )
        projected = account.balance_atomic + amount_atomic
        if projected > account.max_deposit_atomic:
            raise CapitalEscrowError(
                f"escrow {account.escrow_id}: exceeds cap {account.max_deposit_atomic}"
            )
        account.balance_atomic = projected
        account.state = EscrowState.FUNDED
        account.history.append(("DEPOSIT", account.state, f"+{amount_atomic}"))
        return account

    def apply_trade_pnl(
        self,
        account: CapitalEscrowAccount,
        pnl_atomic: int,
        now: datetime | None = None,
    ) -> CapitalEscrowAccount:
        if account.state != EscrowState.FUNDED:
            raise CapitalEscrowError(
                f"escrow {account.escrow_id}: trade refused from {account.state.value}"
            )
        new_balance = account.balance_atomic + pnl_atomic
        if new_balance < 0:
            raise CapitalEscrowError(
                f"escrow {account.escrow_id}: negative balance forbidden"
            )
        account.balance_atomic = new_balance
        account.history.append(("TRADE_PNL", account.state, str(pnl_atomic)))
        return account

    def request_withdrawal(
        self,
        account: CapitalEscrowAccount,
        caller_address: str,
        now: datetime | None = None,
    ) -> CapitalEscrowAccount:
        now = now or datetime.now(timezone.utc)
        if caller_address != account.owner_address:
            raise CapitalEscrowError("only owner can request withdrawal")
        if account.state != EscrowState.FUNDED:
            raise CapitalEscrowError(
                f"withdrawal only from FUNDED, not {account.state.value}"
            )
        account.state = EscrowState.WITHDRAWAL_REQUESTED
        account.withdrawal_requested_at = now
        account.history.append(("REQUEST_WITHDRAWAL", account.state, ""))
        return account

    def withdraw(
        self,
        account: CapitalEscrowAccount,
        caller_address: str,
        now: datetime | None = None,
    ) -> tuple[CapitalEscrowAccount, int]:
        now = now or datetime.now(timezone.utc)
        if caller_address != account.owner_address:
            raise CapitalEscrowError("only owner can withdraw")
        if account.state != EscrowState.WITHDRAWAL_REQUESTED:
            raise CapitalEscrowError(
                f"withdraw refused from {account.state.value}"
            )
        if account.withdrawal_requested_at is None:
            raise CapitalEscrowError("withdrawal_requested_at missing")
        elapsed = (now - account.withdrawal_requested_at).total_seconds() / 3600
        if elapsed < WITHDRAWAL_COOLDOWN_HOURS:
            raise CapitalEscrowError(
                f"cooldown {elapsed:.1f}h / {WITHDRAWAL_COOLDOWN_HOURS}h"
            )
        amount = account.balance_atomic
        account.balance_atomic = 0
        account.state = EscrowState.WITHDRAWN
        account.history.append(("WITHDRAW", account.state, str(amount)))
        return account, amount


if __name__ == "__main__":
    v = CapitalEscrowValidator()
    t0 = datetime(2026, 8, 22, 12, 0, tzinfo=timezone.utc)
    owner, other = "erd1owner", "erd1other"
    pack_price = 500_000_000_000_000_000

    acc = CapitalEscrowAccount("esc_001", "nft_1", owner, pack_price)
    v.deposit(acc, 2_000_000_000_000_000_000, owner, now=t0)
    assert acc.state == EscrowState.FUNDED

    try:
        v.deposit(acc, 4_000_000_000_000_000_000, owner, now=t0)
        raise AssertionError("cap")
    except CapitalEscrowError:
        pass

    try:
        v.deposit(acc, 100, other, now=t0)
        raise AssertionError("owner")
    except CapitalEscrowError:
        pass

    v.apply_trade_pnl(acc, 300_000_000_000_000_000, now=t0)
    assert acc.balance_atomic == 2_300_000_000_000_000_000

    v.request_withdrawal(acc, owner, now=t0)
    try:
        v.apply_trade_pnl(acc, 100, now=t0)
        raise AssertionError("frozen")
    except CapitalEscrowError:
        pass

    try:
        v.withdraw(acc, owner, now=t0 + timedelta(hours=10))
        raise AssertionError("cooldown")
    except CapitalEscrowError:
        pass

    updated, amount = v.withdraw(acc, owner, now=t0 + timedelta(hours=49))
    assert updated.state == EscrowState.WITHDRAWN
    assert amount == 2_300_000_000_000_000_000
    assert updated.balance_atomic == 0

    acc2 = CapitalEscrowAccount("esc_002", "nft_2", owner, pack_price)
    try:
        v.deposit(acc2, 0, owner, now=t0)
        raise AssertionError("zero")
    except CapitalEscrowError:
        pass

    print("capital_escrow_validator: 8/8 OK")
