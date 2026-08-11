"""Persistent Burnify cycle state for LIA (batches → claim gate)."""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

ROOT = Path(__file__).resolve().parents[2]
STATE_PATH = ROOT / "data" / "burnify_lia_state.json"


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


@dataclass
class BurnifyState:
    updated: str = ""
    mode: str = "paper"
    batches_since_claim: int = 0
    total_batches: int = 0
    total_tro_burned_atomic: int = 0
    last_batch_at: Optional[str] = None
    last_claim_at: Optional[str] = None
    last_stake_at: Optional[str] = None
    last_decision: str = ""
    last_reason: str = ""
    claims_count: int = 0
    tx_log: list[dict[str, Any]] = field(default_factory=list)

    def record_batch(self, tro_atomic: int, tx_hash: Optional[str] = None, paper: bool = True) -> None:
        self.batches_since_claim += 1
        self.total_batches += 1
        self.total_tro_burned_atomic += max(0, tro_atomic)
        self.last_batch_at = _now()
        self.updated = self.last_batch_at
        self.tx_log.append(
            {"type": "batch", "tro_atomic": tro_atomic, "tx": tx_hash, "paper": paper, "ts": self.last_batch_at}
        )
        self.tx_log = self.tx_log[-50:]

    def record_claim(self, tx_hash: Optional[str] = None, paper: bool = True) -> None:
        self.batches_since_claim = 0
        self.last_claim_at = _now()
        self.updated = self.last_claim_at
        self.claims_count += 1
        self.tx_log.append({"type": "claim_egld", "tx": tx_hash, "paper": paper, "ts": self.last_claim_at})
        self.tx_log = self.tx_log[-50:]

    def record_stake(self, bfy_atomic: int, tx_hash: Optional[str] = None, paper: bool = True) -> None:
        self.last_stake_at = _now()
        self.updated = self.last_stake_at
        self.tx_log.append(
            {"type": "stake_bfy", "bfy_atomic": bfy_atomic, "tx": tx_hash, "paper": paper, "ts": self.last_stake_at}
        )
        self.tx_log = self.tx_log[-50:]


def load_state(path: Path = STATE_PATH) -> BurnifyState:
    if not path.exists():
        return BurnifyState(updated=_now())
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
        return BurnifyState(
            updated=raw.get("updated") or _now(),
            mode=raw.get("mode", "paper"),
            batches_since_claim=int(raw.get("batches_since_claim") or 0),
            total_batches=int(raw.get("total_batches") or 0),
            total_tro_burned_atomic=int(raw.get("total_tro_burned_atomic") or 0),
            last_batch_at=raw.get("last_batch_at"),
            last_claim_at=raw.get("last_claim_at"),
            last_stake_at=raw.get("last_stake_at"),
            last_decision=raw.get("last_decision") or "",
            last_reason=raw.get("last_reason") or "",
            claims_count=int(raw.get("claims_count") or 0),
            tx_log=list(raw.get("tx_log") or [])[-50:],
        )
    except Exception:
        return BurnifyState(updated=_now())


def save_state(state: BurnifyState, path: Path = STATE_PATH) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    state.updated = _now()
    path.write_text(json.dumps(asdict(state), indent=2) + "\n", encoding="utf-8")
    return path
