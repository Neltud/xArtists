"""
Calldata constructors for MultiversX (P0 — closes Brain→Guardian gap).

These build *data strings* for UniversalExecutor.sign_and_send / execute_swap.
They do NOT sign or broadcast. LIA_LIVE_TRADING remains independent.
"""
from lia.calldata.esdt import build_esdt_transfer, build_egld_transfer_data
from lia.calldata.swap import (
    WEGLD_MAINNET,
    XEXCHANGE_ROUTER_MAINNET,
    build_swap_tokens_fixed_input,
    build_wrap_egld,
    dust_egld_to_usdc_plan,
)

__all__ = [
    "build_esdt_transfer",
    "build_egld_transfer_data",
    "build_wrap_egld",
    "build_swap_tokens_fixed_input",
    "dust_egld_to_usdc_plan",
    "WEGLD_MAINNET",
    "XEXCHANGE_ROUTER_MAINNET",
]
