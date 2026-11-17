"""xOrus execution types — OneDex assisted flow (paper-safe by default)."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass(frozen=True)
class SwapIntent:
    """User or agent intent for a swap. Public address only."""
    token_in: str
    token_out: str
    amount_in: str          # human decimal string, e.g. "0.3"
    sender: str             # erd1... public address only
    max_slippage_bps: int = 100   # 1% default
    confirm_high_slippage: bool = False
    confirm_high_impact: bool = False


@dataclass
class PolicyDecision:
    allowed: bool
    reason: str = ""
    limits_applied: dict[str, Any] = field(default_factory=dict)


@dataclass
class QuoteResult:
    ok: bool
    quoted_out: Optional[str] = None
    min_out: Optional[str] = None
    min_out_raw: Optional[str] = None
    cost_summary: Optional[str] = None
    price_impact: Optional[str] = None
    route: Optional[str] = None
    warnings: list[str] = field(default_factory=list)
    raw: dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None


@dataclass
class BuildResult:
    ok: bool
    transaction: Optional[dict[str, Any]] = None
    summary: Optional[str] = None
    signing_link: Optional[str] = None
    expires_at: Optional[str] = None
    min_out: Optional[str] = None
    min_out_raw: Optional[str] = None
    raw: dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None


@dataclass
class SimulationResult:
    ok: bool
    status: Optional[str] = None          # success | fail | ...
    meets_min_out: Optional[bool] = None
    raw: dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None


@dataclass
class AssistedOutcome:
    """Final output of the assisted path. Never contains a private key."""
    stage: str                            # quote | build | simulate | ready_to_sign | blocked
    intent: SwapIntent
    quote: Optional[QuoteResult] = None
    build: Optional[BuildResult] = None
    simulation: Optional[SimulationResult] = None
    message: str = ""
    requires_human_signature: bool = False
