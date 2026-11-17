"""Thin OneDex MCP client (Streamable HTTP / JSON-RPC).

No private keys. Only public tools.
Endpoint: https://aggregator.onedex.app/ai/mcp
"""
from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any, Optional

MCP_URL = "https://aggregator.onedex.app/ai/mcp"
HEALTH_URL = "https://aggregator.onedex.app/ai/health"
TIMEOUT = 30


class OneDexClientError(RuntimeError):
    pass


def _rpc(method: str, params: Optional[dict] = None, req_id: int = 1) -> dict[str, Any]:
    payload = {
        "jsonrpc": "2.0",
        "id": req_id,
        "method": method,
        "params": params or {},
    }
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        MCP_URL,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            body = resp.read().decode()
    except urllib.error.HTTPError as e:
        raise OneDexClientError(f"HTTP {e.code}: {e.read().decode()[:300]}") from e
    except Exception as e:
        raise OneDexClientError(str(e)) from e

    try:
        parsed = json.loads(body)
    except json.JSONDecodeError as e:
        raise OneDexClientError(f"invalid JSON: {body[:200]}") from e

    if "error" in parsed:
        err = parsed["error"]
        raise OneDexClientError(f"RPC error {err.get('code')}: {err.get('message')}")

    return parsed.get("result", parsed)


def health() -> dict[str, Any]:
    req = urllib.request.Request(HEALTH_URL, method="GET")
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode())


def list_tools() -> list[dict[str, Any]]:
    result = _rpc("tools/list")
    return result.get("tools", [])


def call_tool(name: str, arguments: dict[str, Any]) -> dict[str, Any]:
    """Call a tool and return structuredContent when present."""
    result = _rpc(
        "tools/call",
        {"name": name, "arguments": arguments},
    )
    # MCP often returns content list; prefer structuredContent
    if isinstance(result, dict):
        if "structuredContent" in result:
            return result["structuredContent"]
        # sometimes nested
        content = result.get("content")
        if isinstance(content, list) and content:
            text = content[0].get("text")
            if text:
                try:
                    return json.loads(text)
                except Exception:
                    return {"text": text}
    return result if isinstance(result, dict) else {"raw": result}


# --- Convenience wrappers ---------------------------------------------------

def list_tokens(search: Optional[str] = None) -> dict[str, Any]:
    args: dict[str, Any] = {}
    if search:
        args["search"] = search
    return call_tool("list_tokens", args)


def get_wallet_balances(address: str) -> dict[str, Any]:
    return call_tool("get_wallet_balances", {"address": address})


def get_quote(
    token_in: str,
    token_out: str,
    amount_in: str,
    *,
    confirm_high_slippage: bool = False,
    confirm_high_impact: bool = False,
) -> dict[str, Any]:
    args: dict[str, Any] = {
        "tokenIn": token_in,
        "tokenOut": token_out,
        "amountIn": amount_in,
    }
    if confirm_high_slippage:
        args["confirmHighSlippage"] = True
    if confirm_high_impact:
        args["confirmHighImpact"] = True
    return call_tool("get_quote", args)


def build_swap_tx(
    token_in: str,
    token_out: str,
    amount_in: str,
    sender: str,
    *,
    confirm_high_slippage: bool = False,
    confirm_high_impact: bool = False,
) -> dict[str, Any]:
    args: dict[str, Any] = {
        "tokenIn": token_in,
        "tokenOut": token_out,
        "amountIn": amount_in,
        "sender": sender,
    }
    if confirm_high_slippage:
        args["confirmHighSlippage"] = True
    if confirm_high_impact:
        args["confirmHighImpact"] = True
    return call_tool("build_swap_tx", args)


def simulate_swap_tx(transaction: dict[str, Any], min_out_raw: Optional[str] = None) -> dict[str, Any]:
    args: dict[str, Any] = {"transaction": transaction}
    if min_out_raw is not None:
        args["minOut"] = min_out_raw
    return call_tool("simulate_swap_tx", args)


def tx_status(tx_hash: str) -> dict[str, Any]:
    return call_tool("tx_status", {"txHash": tx_hash})
