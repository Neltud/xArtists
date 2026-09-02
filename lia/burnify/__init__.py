"""Burnify protocol integration for LIA (MultiversX mainnet).

1) Protocol Burnify (external): LIA stakes BFY, burns TRO via batches, claims EGLD after X batches.
2) xArtists tro-burn SC: optional user product — not the same as Burnify.app.

LIA never burns user wallets. Only the protocol LIA ops wallet.
"""
from .config import BurnifyConfig, DEFAULT_CONFIG
from .agent import BurnifyAgent, BurnifyDecision, run_burnify_cycle
from .state import BurnifyState, load_state, save_state

__all__ = [
    "BurnifyConfig",
    "DEFAULT_CONFIG",
    "BurnifyAgent",
    "BurnifyDecision",
    "run_burnify_cycle",
    "BurnifyState",
    "load_state",
    "save_state",
]
