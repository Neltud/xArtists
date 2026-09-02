"""
LIA — Hyperliquid perpetual / spot executor
===========================================
Info (public) + order placement (signed).
Paper by default. Live: LIA_HL_LIVE=1 + private key.
Guardian: live leverage > 1.5x blocked (10–20x reject).

Env:
  LIA_HL_LIVE=0|1
  LIA_HL_PRIVATE_KEY=0x...     # never commit
  LIA_HL_ACCOUNT_ADDRESS=0x...
  LIA_HL_BASE_URL=https://api.hyperliquid.xyz
  LIA_HL_TESTNET=0|1
  LIA_HL_MAX_LEVERAGE=1.5      # live hard cap
"""
from __future__ import annotations

import json
import os
import time
import urllib.request
from dataclasses import asdict, dataclass
from typing import Any, Optional

LIVE = os.getenv("LIA_HL_LIVE", "0") == "1"
PRIVATE_KEY = os.getenv("LIA_HL_PRIVATE_KEY", "")
ACCOUNT = os.getenv("LIA_HL_ACCOUNT_ADDRESS", "")
TESTNET = os.getenv("LIA_HL_TESTNET", "0") == "1"
MAX_LEV = float(os.getenv("LIA_HL_MAX_LEVERAGE", "1.5"))
BASE = os.getenv(
    "LIA_HL_BASE_URL",
    "https://api.hyperliquid-testnet.xyz" if TESTNET else "https://api.hyperliquid.xyz",
)


@dataclass
class HLResult:
    ok: bool
    mode: str
    venue: str = "hyperliquid"
    order_id: Optional[str] = None
    status: Optional[str] = None
    detail: str = ""
    raw: Optional[Any] = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _info(payload: dict[str, Any]) -> Any:
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{BASE}/info",
        data=data,
        headers={"Content-Type": "application/json", "User-Agent": "LIA/6"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read().decode())


def meta_and_asset_ctxs() -> Any:
    return _info({"type": "metaAndAssetCtxs"})


def all_mids() -> dict[str, str]:
    return _info({"type": "allMids"})


def user_state(address: str) -> Any:
    return _info({"type": "clearinghouseState", "user": address})


def open_orders(address: str) -> Any:
    return _info({"type": "openOrders", "user": address})


def resolve_asset_index(coin: str) -> int:
    meta = _info({"type": "meta"})
    universe = meta.get("universe") or []
    coin_u = coin.upper()
    for i, item in enumerate(universe):
        name = str(item.get("name") or "")
        if name.upper() == coin_u:
            return i
    raise ValueError(f"asset not found: {coin}")


def _guardian_lev(leverage: float, force_paper: bool) -> Optional[HLResult]:
    try:
        from lia.guardian.spiral import sol_perps_allowed

        live = LIVE and not force_paper
        v = sol_perps_allowed(live=live, requested_leverage=float(leverage or 1.0))
        if not v.allow:
            return HLResult(False, "blocked", detail=f"guardian:{v.reason}")
    except Exception as e:
        if LIVE and not force_paper:
            return HLResult(False, "blocked", detail=f"guardian_error:{e}")
    if LIVE and not force_paper and float(leverage or 1.0) > MAX_LEV:
        return HLResult(
            False,
            "blocked",
            detail=f"LIA_HL_MAX_LEVERAGE={MAX_LEV} exceeded ({leverage})",
        )
    return None


class HyperliquidExecutor:
    def __init__(self) -> None:
        self.failures = 0
        self.open_until = 0.0
        self._exchange = None

    def allow(self) -> bool:
        return time.time() >= self.open_until

    def _fail(self) -> None:
        self.failures += 1
        if self.failures >= 5:
            self.open_until = time.time() + 300

    def _ok(self) -> None:
        self.failures = 0

    def mid_price(self, coin: str) -> Optional[float]:
        try:
            mids = all_mids()
            v = mids.get(coin) or mids.get(coin.upper())
            return float(v) if v is not None else None
        except Exception:
            return None

    def _get_exchange(self):
        if self._exchange is not None:
            return self._exchange
        if not PRIVATE_KEY:
            raise RuntimeError("LIA_HL_PRIVATE_KEY missing")
        try:
            from hyperliquid.exchange import Exchange  # type: ignore
            from hyperliquid.utils import constants  # type: ignore
            from eth_account import Account  # type: ignore

            wallet = Account.from_key(PRIVATE_KEY)
            base = constants.TESTNET_API_URL if TESTNET else constants.MAINNET_API_URL
            account_addr = ACCOUNT or wallet.address
            self._exchange = Exchange(wallet, base, account_address=account_addr)
            return self._exchange
        except ImportError as e:
            raise RuntimeError(
                "install hyperliquid-python-sdk and eth-account for live HL trading"
            ) from e

    def place_order(
        self,
        *,
        coin: str,
        is_buy: bool,
        size: float,
        price: Optional[float] = None,
        order_type: str = "limit",
        tif: str = "Gtc",
        reduce_only: bool = False,
        force_paper: bool = False,
        leverage: float = 1.0,
    ) -> HLResult:
        if not self.allow():
            return HLResult(False, "blocked", detail="circuit breaker open")

        blocked = _guardian_lev(leverage, force_paper)
        if blocked is not None:
            return blocked

        mid = self.mid_price(coin)
        px = price
        if px is None:
            if mid is None:
                return HLResult(False, "error", detail="no mid price")
            px = mid * (1.001 if is_buy else 0.999)

        if force_paper or not LIVE:
            return HLResult(
                ok=True,
                mode="paper",
                status="simulated",
                detail=json.dumps(
                    {
                        "coin": coin,
                        "is_buy": is_buy,
                        "size": size,
                        "price": px,
                        "mid": mid,
                        "tif": tif,
                        "reduce_only": reduce_only,
                        "leverage": leverage,
                    }
                ),
            )

        try:
            ex = self._get_exchange()
            if order_type == "market":
                if hasattr(ex, "market_open"):
                    result = ex.market_open(coin, is_buy, size, None, 0.01)
                else:
                    result = ex.order(
                        coin,
                        is_buy,
                        size,
                        px,
                        {"limit": {"tif": "Ioc"}},
                        reduce_only=reduce_only,
                    )
            else:
                result = ex.order(
                    coin,
                    is_buy,
                    size,
                    px,
                    {"limit": {"tif": tif}},
                    reduce_only=reduce_only,
                )
            self._ok()
            oid = None
            status = "submitted"
            if isinstance(result, dict):
                status = str(result.get("status") or status)
                resp = result.get("response") or {}
                data = resp.get("data") if isinstance(resp, dict) else None
                if isinstance(data, dict):
                    statuses = data.get("statuses") or []
                    if statuses and isinstance(statuses[0], dict):
                        rest = statuses[0].get("resting") or statuses[0].get("filled") or {}
                        oid = str(rest.get("oid") or "") or None
            return HLResult(True, "live", order_id=oid, status=status, detail="ok", raw=result)
        except Exception as e:
            self._fail()
            return HLResult(False, "live", detail=str(e))

    def cancel(self, coin: str, oid: int) -> HLResult:
        if not LIVE:
            return HLResult(True, "paper", detail=f"cancel {coin} {oid} simulated")
        try:
            ex = self._get_exchange()
            result = ex.cancel(coin, oid)
            return HLResult(True, "live", detail="cancelled", raw=result)
        except Exception as e:
            self._fail()
            return HLResult(False, "live", detail=str(e))

    def health(self) -> dict[str, Any]:
        return {
            "venue": "hyperliquid",
            "live": LIVE,
            "testnet": TESTNET,
            "base": BASE,
            "key_configured": bool(PRIVATE_KEY),
            "account": ACCOUNT or None,
            "breaker_open": not self.allow(),
            "failures": self.failures,
            "max_leverage_live": MAX_LEV,
            "guardian": "sol_perps_allowed on place_order",
        }


if __name__ == "__main__":
    ex = HyperliquidExecutor()
    print(json.dumps(ex.health(), indent=2))
    try:
        print("BTC mid", ex.mid_price("BTC"))
    except Exception as e:
        print("mid error", e)
    r = ex.place_order(coin="BTC", is_buy=True, size=0.001, force_paper=True, leverage=1.0)
    print(json.dumps(r.to_dict(), indent=2))
    r2 = ex.place_order(coin="BTC", is_buy=True, size=0.001, force_paper=False, leverage=15.0)
    print("15x live gate", json.dumps(r2.to_dict(), indent=2))
