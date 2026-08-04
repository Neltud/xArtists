"""Daily structured proposal from Claude — never signs."""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Callable, Optional

VALID_ACTIONS = {"BUY", "SELL", "HOLD", "SKIP"}
VALID_TOKENS = {"EGLD", "WBTC", "WTAO", "TRO", "USDC"}

SYSTEM_PROMPT = """You are a daily trading advisor for a MultiversX DeFi wallet (xArtists / LIA).
Propose exactly ONE decision per call, or SKIP if no good setup.
You do NOT execute trades. Respond with a single JSON object, no markdown:

{
  "action": "BUY" | "SELL" | "HOLD" | "SKIP",
  "token": "EGLD" | "WBTC" | "WTAO" | "TRO" | "USDC",
  "size_pct_of_budget": number 0-100,
  "confidence": number 0-100,
  "rationale": "short string, max 240 chars"
}

Never fabricate market data not given in context. Respect gas costs on micro notionals.
$TRO max supply product rule is 500000. LIA_LIVE_TRADING may be 0 — prefer SKIP if live off."""


@dataclass
class TradeProposal:
    action: str
    token: str
    size_pct_of_budget: float
    confidence: float
    rationale: str
    raw_response: str = field(default="", repr=False)

    def to_dict(self) -> dict:
        return {
            "action": self.action,
            "token": self.token,
            "size_pct_of_budget": self.size_pct_of_budget,
            "confidence": self.confidence,
            "rationale": self.rationale,
        }


class ProposalValidationError(Exception):
    pass


def validate_proposal(data: dict) -> TradeProposal:
    if not isinstance(data, dict):
        raise ProposalValidationError("response is not a JSON object")
    action = data.get("action")
    if action not in VALID_ACTIONS:
        raise ProposalValidationError(f"invalid action: {action!r}")
    token = data.get("token")
    if token not in VALID_TOKENS:
        raise ProposalValidationError(f"invalid token: {token!r}")
    size = data.get("size_pct_of_budget")
    if not isinstance(size, (int, float)) or not (0 <= size <= 100):
        raise ProposalValidationError(f"invalid size_pct_of_budget: {size!r}")
    confidence = data.get("confidence")
    if not isinstance(confidence, (int, float)) or not (0 <= confidence <= 100):
        raise ProposalValidationError(f"invalid confidence: {confidence!r}")
    rationale = data.get("rationale")
    if not isinstance(rationale, str) or len(rationale) == 0 or len(rationale) > 240:
        raise ProposalValidationError(f"invalid rationale: {rationale!r}")
    if action in ("HOLD", "SKIP") and size != 0:
        raise ProposalValidationError(f"action={action} must have size 0, got {size}")
    return TradeProposal(
        action=action,
        token=token,
        size_pct_of_budget=float(size),
        confidence=float(confidence),
        rationale=rationale,
    )


ClaudeCallFn = Callable[[str, str], str]


def get_daily_proposal(
    market_context: str,
    call_claude: ClaudeCallFn,
    min_confidence_to_act: float = 60.0,
) -> Optional[TradeProposal]:
    try:
        raw = call_claude(SYSTEM_PROMPT, market_context)
    except Exception:
        return None
    try:
        parsed = json.loads(raw)
        proposal = validate_proposal(parsed)
        proposal.raw_response = raw
    except (json.JSONDecodeError, ProposalValidationError):
        return None
    if proposal.action in ("BUY", "SELL") and proposal.confidence < min_confidence_to_act:
        return TradeProposal(
            action="SKIP",
            token=proposal.token,
            size_pct_of_budget=0,
            confidence=proposal.confidence,
            rationale=f"below confidence threshold ({proposal.confidence} < {min_confidence_to_act}): {proposal.rationale}",
            raw_response=raw,
        )
    return proposal
