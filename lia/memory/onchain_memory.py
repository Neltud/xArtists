"""
LIA On-Chain Memory — MultiversX Explorer / API
================================================
Charge toutes les transactions du wallet LIA, les classe,
construit une mémoire exploitable pour les décisions CT/MT/LT.

API: https://api.multiversx.com/accounts/{addr}/transactions
Explorer: https://explorer.multiversx.com/accounts/{addr}
"""
from __future__ import annotations

import json
import time
import urllib.request
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Optional

DEFAULT_WALLET = "erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6"
API = "https://api.multiversx.com"


@dataclass
class TxMemory:
    hash: str
    timestamp: int
    status: str
    function: str
    value_egld: float
    receiver: str
    sender: str
    data_preview: str
    kind: str  # swap | stake | transfer | claim | unknown
    token_hint: str = ""


@dataclass
class MemorySnapshot:
    wallet: str
    fetched_at: str
    tx_count: int
    by_kind: dict[str, int] = field(default_factory=dict)
    recent_hashes: list[str] = field(default_factory=list)
    last_swap_ts: int = 0
    last_stake_ts: int = 0
    avg_gap_sec_swaps: float = 0.0
    success_rate: float = 0.0
    known_counterparties: list[str] = field(default_factory=list)
    raw_sample: list[dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _get(url: str, timeout: int = 25) -> Any:
    req = urllib.request.Request(url, headers={"User-Agent": "xArtists-LIA/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


def _classify(tx: dict[str, Any]) -> tuple[str, str, str]:
    """Return (kind, function, token_hint)."""
    action = str(tx.get("action", {}) or {})
    if isinstance(tx.get("action"), dict):
        name = str(tx["action"].get("name", "") or "").lower()
        category = str(tx["action"].get("category", "") or "").lower()
    else:
        name, category = "", ""
    data = str(tx.get("data", "") or "")
    try:
        # data often base64 — keep raw string for keywords
        data_l = data.lower()
    except Exception:
        data_l = ""

    func = name or str(tx.get("function", "") or "")
    token_hint = ""
    operations = tx.get("operations") or []
    for op in operations:
        if isinstance(op, dict) and op.get("identifier"):
            token_hint = str(op["identifier"])
            break

    blob = f"{name} {category} {func} {data_l}"
    if any(k in blob for k in ("swap", "exchange", "pair", "esdttransfert", "multi")):
        return "swap", func or "swap", token_hint
    if any(k in blob for k in ("stake", "delegate", "bonding")):
        return "stake", func or "stake", token_hint
    if any(k in blob for k in ("claim", "reward", "undelegate")):
        return "claim", func or "claim", token_hint
    if any(k in blob for k in ("unbond", "unstake", "withdraw")):
        return "unstake", func or "unstake", token_hint
    val = int(tx.get("value", 0) or 0)
    if val > 0 or token_hint:
        return "transfer", func or "transfer", token_hint
    return "unknown", func or "unknown", token_hint


def fetch_transactions(
    address: str = DEFAULT_WALLET,
    size: int = 100,
    api: str = API,
) -> list[dict[str, Any]]:
    url = f"{api}/accounts/{address}/transactions?size={size}&withOperations=true"
    data = _get(url)
    if isinstance(data, list):
        return data
    return data.get("transactions", data.get("data", [])) if isinstance(data, dict) else []


def build_memory(
    address: str = DEFAULT_WALLET,
    size: int = 100,
    persist_path: str = "data/lia_onchain_memory.json",
) -> MemorySnapshot:
    txs = fetch_transactions(address, size=size)
    memories: list[TxMemory] = []
    by_kind: dict[str, int] = {}
    swap_ts: list[int] = []
    stake_ts: list[int] = []
    counterparties: set[str] = set()
    ok = 0

    for tx in txs:
        kind, func, token_hint = _classify(tx)
        by_kind[kind] = by_kind.get(kind, 0) + 1
        status = str(tx.get("status", "")).lower()
        if status in ("success", "executed"):
            ok += 1
        ts = int(tx.get("timestamp", 0) or 0)
        if kind == "swap":
            swap_ts.append(ts)
        if kind == "stake":
            stake_ts.append(ts)
        sender = str(tx.get("sender", ""))
        receiver = str(tx.get("receiver", ""))
        if receiver and receiver != address:
            counterparties.add(receiver)
        if sender and sender != address:
            counterparties.add(sender)
        memories.append(
            TxMemory(
                hash=str(tx.get("txHash") or tx.get("hash") or ""),
                timestamp=ts,
                status=status,
                function=func,
                value_egld=int(tx.get("value", 0) or 0) / 1e18,
                receiver=receiver,
                sender=sender,
                data_preview=str(tx.get("data", ""))[:80],
                kind=kind,
                token_hint=token_hint,
            )
        )

    swap_ts.sort()
    gaps = [swap_ts[i] - swap_ts[i - 1] for i in range(1, len(swap_ts)) if swap_ts[i] > swap_ts[i - 1]]
    avg_gap = sum(gaps) / len(gaps) if gaps else 0.0

    snap = MemorySnapshot(
        wallet=address,
        fetched_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        tx_count=len(txs),
        by_kind=by_kind,
        recent_hashes=[m.hash for m in memories[:20]],
        last_swap_ts=max(swap_ts) if swap_ts else 0,
        last_stake_ts=max(stake_ts) if stake_ts else 0,
        avg_gap_sec_swaps=round(avg_gap, 1),
        success_rate=round(ok / len(txs), 4) if txs else 0.0,
        known_counterparties=sorted(counterparties)[:40],
        raw_sample=[asdict(m) for m in memories[:15]],
    )

    path = Path(persist_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(snap.to_dict(), indent=2), encoding="utf-8")
    return snap


def hours_since_last_swap(snap: MemorySnapshot) -> float:
    if not snap.last_swap_ts:
        return 1e9
    return max(0.0, (time.time() - snap.last_swap_ts) / 3600.0)


def should_pace_trade(snap: MemorySnapshot, min_hours_between: float = 0.5) -> tuple[bool, str]:
    """True if enough time passed since last swap (cadence guard)."""
    h = hours_since_last_swap(snap)
    if h < min_hours_between:
        return False, f"pace: last swap {h:.2f}h ago < {min_hours_between}h"
    return True, f"pace ok ({h:.2f}h since last swap)"


if __name__ == "__main__":
    try:
        s = build_memory(size=50)
        print(json.dumps(s.to_dict(), indent=2)[:2000])
    except Exception as e:
        print("fetch failed (offline?):", e)
