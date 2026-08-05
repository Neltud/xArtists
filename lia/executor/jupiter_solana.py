"""
LIA — Jupiter (Solana) swap executor
====================================
Quote + swap via Jupiter Aggregator API.
Paper/dry-run by default. Live requires LIA_SOL_LIVE=1 + keypair.

Env:
  LIA_SOL_LIVE=0|1
  LIA_SOL_KEYPAIR_PATH=...     # JSON keypair file (never commit)
  LIA_SOL_RPC=https://api.mainnet-beta.solana.com
  LIA_JUPITER_QUOTE_API=https://quote-api.jup.ag/v6
  LIA_JUPITER_SLIPPAGE_BPS=50  # 0.50%

Refs:
  https://station.jup.ag/docs/apis/swap-api
"""
from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Optional

LIVE = os.getenv("LIA_SOL_LIVE", "0") == "1"
KEYPAIR_PATH = os.getenv("LIA_SOL_KEYPAIR_PATH", "")
RPC = os.getenv("LIA_SOL_RPC", "https://api.mainnet-beta.solana.com")
QUOTE_API = os.getenv("LIA_JUPITER_QUOTE_API", "https://quote-api.jup.ag/v6")
DEFAULT_SLIPPAGE_BPS = int(os.getenv("LIA_JUPITER_SLIPPAGE_BPS", "50"))

# Common mints (mainnet)
MINTS = {
    "SOL": "So11111111111111111111111111111111111111112",
    "USDC": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "USDT": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    "WBTC": "3NZ9JMVBMVeBeyMVDuzp2WSPHeGq1sTCfXzBJvEfcg7E",  # portal WBTC approx — verify before live
    "BONK": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
}


@dataclass
class JupiterResult:
    ok: bool
    mode: str  # paper | dry-run | live
    venue: str = "jupiter"
    tx_sig: Optional[str] = None
    in_amount: Optional[str] = None
    out_amount: Optional[str] = None
    price_impact_pct: Optional[float] = None
    route: Optional[str] = None
    detail: str = ""
    raw: Optional[dict] = None

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        if self.raw and len(json.dumps(self.raw)) > 4000:
            d["raw"] = {"truncated": True}
        return d


def resolve_mint(symbol_or_mint: str) -> str:
    s = (symbol_or_mint or "").strip()
    if len(s) >= 32 and not s.startswith("0x"):
        return s  # already a mint
    return MINTS.get(s.upper(), s)


def _http_get(url: str, timeout: float = 25) -> dict[str, Any]:
    req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "LIA/6"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


def _http_post(url: str, body: dict[str, Any], timeout: float = 30) -> dict[str, Any]:
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json", "Accept": "application/json", "User-Agent": "LIA/6"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


def get_quote(
    *,
    input_mint: str,
    output_mint: str,
    amount: int,
    slippage_bps: int = DEFAULT_SLIPPAGE_BPS,
    only_direct_routes: bool = False,
) -> dict[str, Any]:
    """Fetch Jupiter v6 quote. amount in smallest units of input mint."""
    params = {
        "inputMint": resolve_mint(input_mint),
        "outputMint": resolve_mint(output_mint),
        "amount": str(int(amount)),
        "slippageBps": str(int(slippage_bps)),
        "onlyDirectRoutes": "true" if only_direct_routes else "false",
    }
    url = f"{QUOTE_API}/quote?{urllib.parse.urlencode(params)}"
    return _http_get(url)


def build_swap_transaction(
    *,
    quote: dict[str, Any],
    user_public_key: str,
    wrap_and_unwrap_sol: bool = True,
    prioritization_fee_lamports: str = "auto",
) -> dict[str, Any]:
    body = {
        "quoteResponse": quote,
        "userPublicKey": user_public_key,
        "wrapAndUnwrapSol": wrap_and_unwrap_sol,
        "dynamicComputeUnitLimit": True,
        "prioritizationFeeLamports": prioritization_fee_lamports,
    }
    return _http_post(f"{QUOTE_API}/swap", body)


def _load_keypair_pubkey() -> tuple[Any, str]:
    """Return (keypair, pubkey_str). Requires solders or solana-py."""
    if not KEYPAIR_PATH or not Path(KEYPAIR_PATH).is_file():
        raise RuntimeError("LIA_SOL_KEYPAIR_PATH missing or invalid")
    raw = json.loads(Path(KEYPAIR_PATH).read_text(encoding="utf-8"))
    if isinstance(raw, list):
        secret = bytes(raw)
    elif isinstance(raw, dict) and "secretKey" in raw:
        secret = bytes(raw["secretKey"])
    else:
        raise RuntimeError("unsupported keypair JSON format")

    try:
        from solders.keypair import Keypair  # type: ignore

        kp = Keypair.from_bytes(secret[:64] if len(secret) >= 64 else secret)
        return kp, str(kp.pubkey())
    except ImportError:
        try:
            from solana.keypair import Keypair  # type: ignore

            kp = Keypair.from_secret_key(secret[:64] if len(secret) >= 64 else secret)
            return kp, str(kp.public_key)
        except ImportError as e:
            raise RuntimeError("install solders or solana for live Solana signing") from e


def _send_versioned_tx(swap_tx_b64: str, keypair: Any) -> str:
    """Decode Jupiter swapTransaction, sign, send via RPC."""
    import base64

    try:
        from solders.transaction import VersionedTransaction  # type: ignore
        from solders.keypair import Keypair  # type: ignore
        from solders.commitment_config import CommitmentLevel  # type: ignore
        from solders.rpc.requests import SendVersionedTransaction  # type: ignore
        from solders.rpc.config import RpcSendTransactionConfig  # type: ignore
    except ImportError as e:
        raise RuntimeError("solders required for live Jupiter send") from e

    raw = base64.b64decode(swap_tx_b64)
    tx = VersionedTransaction.from_bytes(raw)
    # Re-sign with user keypair
    signed = VersionedTransaction(tx.message, [keypair])
    # Prefer JSON-RPC sendTransaction
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "sendTransaction",
        "params": [
            base64.b64encode(bytes(signed)).decode(),
            {"encoding": "base64", "skipPreflight": False, "maxRetries": 3},
        ],
    }
    resp = _http_post(RPC, payload)
    if "error" in resp:
        raise RuntimeError(str(resp["error"]))
    return str(resp.get("result") or "")


class JupiterExecutor:
    """High-level quote → (optional) swap for LIA."""

    def __init__(self) -> None:
        self.failures = 0
        self.open_until = 0.0

    def allow(self) -> bool:
        return time.time() >= self.open_until

    def _fail(self) -> None:
        self.failures += 1
        if self.failures >= 5:
            self.open_until = time.time() + 300

    def _ok(self) -> None:
        self.failures = 0

    def quote_swap(
        self,
        *,
        input_mint: str,
        output_mint: str,
        amount: int,
        slippage_bps: int = DEFAULT_SLIPPAGE_BPS,
    ) -> JupiterResult:
        if not self.allow():
            return JupiterResult(False, "blocked", detail="circuit breaker open")
        try:
            q = get_quote(
                input_mint=input_mint,
                output_mint=output_mint,
                amount=amount,
                slippage_bps=slippage_bps,
            )
            impact = float(q.get("priceImpactPct") or 0)
            route_plan = q.get("routePlan") or []
            labels = []
            for step in route_plan[:4]:
                sw = (step.get("swapInfo") or {}).get("label") or ""
                if sw:
                    labels.append(sw)
            return JupiterResult(
                ok=True,
                mode="quote",
                in_amount=str(q.get("inAmount") or amount),
                out_amount=str(q.get("outAmount") or ""),
                price_impact_pct=impact,
                route=" → ".join(labels) if labels else "jupiter",
                detail="quote ok",
                raw=q,
            )
        except Exception as e:
            self._fail()
            return JupiterResult(False, "quote", detail=str(e))

    def execute_swap(
        self,
        *,
        input_mint: str,
        output_mint: str,
        amount: int,
        slippage_bps: int = DEFAULT_SLIPPAGE_BPS,
        user_public_key: str = "",
        force_paper: bool = False,
    ) -> JupiterResult:
        if not self.allow():
            return JupiterResult(False, "blocked", detail="circuit breaker open")

        qres = self.quote_swap(
            input_mint=input_mint,
            output_mint=output_mint,
            amount=amount,
            slippage_bps=slippage_bps,
        )
        if not qres.ok or not qres.raw:
            return qres

        if force_paper or not LIVE:
            return JupiterResult(
                ok=True,
                mode="paper",
                in_amount=qres.in_amount,
                out_amount=qres.out_amount,
                price_impact_pct=qres.price_impact_pct,
                route=qres.route,
                detail="paper: quote only, no broadcast",
                raw={"quote": {"inAmount": qres.in_amount, "outAmount": qres.out_amount}},
            )

        try:
            kp, pubkey = _load_keypair_pubkey()
            pk = user_public_key or pubkey
            swap = build_swap_transaction(quote=qres.raw, user_public_key=pk)
            tx_b64 = swap.get("swapTransaction")
            if not tx_b64:
                raise RuntimeError(f"no swapTransaction: {swap}")
            sig = _send_versioned_tx(tx_b64, kp)
            self._ok()
            return JupiterResult(
                ok=True,
                mode="live",
                tx_sig=sig,
                in_amount=qres.in_amount,
                out_amount=qres.out_amount,
                price_impact_pct=qres.price_impact_pct,
                route=qres.route,
                detail=f"sent {sig}",
            )
        except Exception as e:
            self._fail()
            return JupiterResult(
                False,
                "live",
                in_amount=qres.in_amount,
                out_amount=qres.out_amount,
                detail=str(e),
            )

    def health(self) -> dict[str, Any]:
        return {
            "venue": "jupiter",
            "live": LIVE,
            "keypair_configured": bool(KEYPAIR_PATH and Path(KEYPAIR_PATH).is_file()),
            "rpc": RPC,
            "quote_api": QUOTE_API,
            "slippage_bps": DEFAULT_SLIPPAGE_BPS,
            "breaker_open": not self.allow(),
            "failures": self.failures,
        }


if __name__ == "__main__":
    ex = JupiterExecutor()
    print(json.dumps(ex.health(), indent=2))
    # Dry quote: 0.01 SOL → USDC
    r = ex.quote_swap(
        input_mint="SOL",
        output_mint="USDC",
        amount=10_000_000,  # 0.01 SOL
    )
    print(json.dumps(r.to_dict(), indent=2))
