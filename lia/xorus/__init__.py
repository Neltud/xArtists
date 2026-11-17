"""DEPRECATED — use top-level package xorus (phase 1 complete)."""
from __future__ import annotations
import warnings
warnings.warn(
    "lia.xorus is deprecated; use package xorus. LIA is retired.",
    DeprecationWarning,
    stacklevel=2,
)
from xorus import run_xorus, SAFETY
__all__ = ["run_xorus", "SAFETY"]
