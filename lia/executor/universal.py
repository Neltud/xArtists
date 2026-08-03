"""
LIA UniversalExecutor — paper by default; live only if LIA_LIVE_TRADING=1 + PEM.
Never loads PEM into frontend. Circuit breaker after N consecutive failures.
"""
from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any, Optional

from lia.board.risk import DEFAULT_LIMITS, can_open_trade

ROOT = Path(__file__).resolve().parents[2]
STATE_PATH = ROOT / "data" / "executor_state.json"


@dataclass
class TxIntent:
    kind: str  # swap | list_nft | buy_nft | bid | agent_buy | transfer
    receiver: str
    value_egld: float = 0.0
    data: str = ""
    gas_limit: int = 30_000_000
    meta: dict[str, Any] = field(default_factory=dict)


@dataclass
class ExecResult:
    ok: bool
    mode: str  # paper | live
    tx_hash: Optional[str] = None
    error: Optional[str] = None
    intent: Optional[dict[str, Any]] = None
    confirmed: bool = False


class UniversalExecutor:
    def __init__(self) -> None:
        self.live = os.environ.get("LIA_LIVE_TRADING", "0") == "1"
        self.pem = os.environ.get("LIA_WALLET_PEM_PATH") or os.environ.get("PEM") or ""
        self.max_fails = int(os.environ.get("LIA_EXEC_MAX_FAILS", "3"))
        self.state = self._load_state()

    def _load_state(self) -> dict[str, Any]:
        if STATE_PATH.exists():
            try:
                return json.loads(STATE_PATH.read_text(encoding="utf-8"))
            except Exception:
                pass
        return {
            "consecutive_fails": 0,
            "halted": False,
            "trades_today": 0,
            "trades_hour": 0,
            "day": time.strftime("%Y-%m-%d"),
            "hour": time.strftime("%Y-%m-%d-%H"),
            "history": [],
        }

    def _save_state(self) -> None:
        STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
        STATE_PATH.write_text(json.dumps(self.state, indent=2), encoding="utf-8")

    def _roll_counters(self) -> None:
        day = time.strftime("%Y-%m-%d")
        hour = time.strftime("%Y-%m-%d-%H")
        if self.state.get("day") != day:
            self.state["day"] = day
            self.state["trades_today"] = 0
        if self.state.get("hour") != hour:
            self.state["hour"] = hour
            self.state["trades_hour"] = 0

    def health(self) -> dict[str, Any]:
        self._roll_counters()
        gate = can_open_trade(
            trades_today=int(self.state.get("trades_today") or 0),
            trades_this_hour=int(self.state.get("trades_hour") or 0),
        )
        return {
            "live": self.live,
            "pem_configured": bool(self.pem and Path(self.pem).is_file()),
            "halted": bool(self.state.get("halted")),
            "consecutive_fails": self.state.get("consecutive_fails"),
            "max_fails": self.max_fails,
            "risk": DEFAULT_LIMITS.to_dict(),
            "can_trade": gate,
            "mode": "live" if self.live and not self.state.get("halted") else "paper",
        }

    def reset_halt(self) -> None:
        self.state["halted"] = False
        self.state["consecutive_fails"] = 0
        self._save_state()

    def execute(self, intent: TxIntent) -> ExecResult:
        self._roll_counters()
        if self.state.get("halted"):
            return ExecResult(
                ok=False,
                mode="halted",
                error="Circuit breaker HALTED — reset_halt() after investigation",
                intent=asdict(intent),
            )

        gate = can_open_trade(
            trades_today=int(self.state.get("trades_today") or 0),
            trades_this_hour=int(self.state.get("trades_hour") or 0),
        )
        if not gate["ok"] and intent.kind in ("swap", "agent_buy", "buy_nft"):
            return ExecResult(
                ok=False,
                mode="paper" if not self.live else "live",
                error=gate.get("reason") or "trade limit",
                intent=asdict(intent),
            )

        # Live path requires explicit flag + PEM file
        if self.live:
            if not self.pem or not Path(self.pem).is_file():
                return ExecResult(
                    ok=False,
                    mode="live",
                    error="LIA_LIVE_TRADING=1 but PEM path missing/invalid",
                    intent=asdict(intent),
                )
            return self._execute_live(intent)

        return self._execute_paper(intent)

    def _execute_paper(self, intent: TxIntent) -> ExecResult:
        fake = f"paper-{int(time.time())}-{intent.kind}"
        self.state["trades_today"] = int(self.state.get("trades_today") or 0) + 1
        self.state["trades_hour"] = int(self.state.get("trades_hour") or 0) + 1
        self.state["consecutive_fails"] = 0
        hist = list(self.state.get("history") or [])[-49:]
        hist.append({"ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "mode": "paper", "kind": intent.kind, "tx": fake})
        self.state["history"] = hist
        self._save_state()
        return ExecResult(ok=True, mode="paper", tx_hash=fake, confirmed=True, intent=asdict(intent))

    def _execute_live(self, intent: TxIntent) -> ExecResult:
        """
        Live submit via mxpy subprocess (no PEM in logs).
        Operator must set PROXY/CHAIN=1.
        """
        import subprocess

        proxy = os.environ.get("PROXY", "https://gateway.multiversx.com")
        chain = os.environ.get("CHAIN", "1")
        if chain != "1":
            return ExecResult(ok=False, mode="live", error="MAINNET only CHAIN=1", intent=asdict(intent))

        value_atomic = str(int(intent.value_egld * 1e18))
        cmd = [
            "mxpy",
            "tx",
            "new",
            "--proxy",
            proxy,
            "--chain",
            chain,
            "--pem",
            self.pem,
            "--recall-nonce",
            "--receiver",
            intent.receiver,
            "--value",
            value_atomic if intent.value_egld > 0 else "0",
            "--gas-limit",
            str(intent.gas_limit),
            "--data",
            intent.data or "0",
            "--send",
        ]
        try:
            # Do not print PEM path content
            proc = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=120,
                check=False,
            )
            out = (proc.stdout or "") + (proc.stderr or "")
            if proc.returncode != 0:
                self._fail(out[:500])
                return ExecResult(
                    ok=False,
                    mode="live",
                    error=f"mxpy exit {proc.returncode}: {out[:300]}",
                    intent=asdict(intent),
                )
            # Best-effort hash extract
            tx_hash = None
            for line in out.splitlines():
                if "hash" in line.lower() or len(line.strip()) == 64:
                    tx_hash = line.strip().split()[-1]
                    break
            self.state["trades_today"] = int(self.state.get("trades_today") or 0) + 1
            self.state["trades_hour"] = int(self.state.get("trades_hour") or 0) + 1
            self.state["consecutive_fails"] = 0
            self._save_state()
            return ExecResult(
                ok=True,
                mode="live",
                tx_hash=tx_hash or "submitted",
                confirmed=False,
                intent=asdict(intent),
            )
        except FileNotFoundError:
            self._fail("mxpy not installed")
            return ExecResult(ok=False, mode="live", error="mxpy not found in PATH", intent=asdict(intent))
        except Exception as e:
            self._fail(str(e))
            return ExecResult(ok=False, mode="live", error=str(e), intent=asdict(intent))

    def _fail(self, reason: str) -> None:
        n = int(self.state.get("consecutive_fails") or 0) + 1
        self.state["consecutive_fails"] = n
        if n >= self.max_fails:
            self.state["halted"] = True
            self.state["halt_reason"] = reason[:200]
        self._save_state()


def health_report() -> dict[str, Any]:
    return UniversalExecutor().health()


if __name__ == "__main__":
    ex = UniversalExecutor()
    print(json.dumps(ex.health(), indent=2))
    r = ex.execute(
        TxIntent(kind="swap", receiver="erd1qqqqqqqqqqqqqpgq00000000000000000000000000000000000000000000", value_egld=0, data="paper")
    )
    print(json.dumps(asdict(r), indent=2))
