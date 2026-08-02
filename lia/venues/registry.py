"""
Venue catalog — MultiversX, Solana, Hyperliquid, Soul (future).
Status: live | partial | planned | experimental
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass
class Venue:
    id: str
    name: str
    chain: str  # multiversx | solana | hyperliquid | multi
    category: str  # dex | lending | nft | perps | aggregator | protocol
    status: str  # live | partial | planned | experimental
    roles: list[str] = field(default_factory=list)
    endpoints: dict[str, str] = field(default_factory=dict)
    notes: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "chain": self.chain,
            "category": self.category,
            "status": self.status,
            "roles": self.roles,
            "endpoints": self.endpoints,
            "notes": self.notes,
        }


VENUES: dict[str, Venue] = {
    # —— MultiversX ——
    "xexchange": Venue(
        id="xexchange",
        name="xExchange",
        chain="multiversx",
        category="dex",
        status="partial",
        roles=["swap", "lp", "price", "micro_arb"],
        endpoints={"app": "https://xexchange.com", "api": "https://api.multiversx.com"},
        notes="Primary DEX for EGLD/ESDT swaps; arb vs OneDex in strategies.micro_arb",
    ),
    "onedex": Venue(
        id="onedex",
        name="OneDex",
        chain="multiversx",
        category="dex",
        status="partial",
        roles=["swap", "lp", "price", "micro_arb"],
        endpoints={"app": "https://onedex.app"},
        notes="TRO/EGLD pool references in frontend LP page",
    ),
    "hatom": Venue(
        id="hatom",
        name="Hatom",
        chain="multiversx",
        category="lending",
        status="partial",
        roles=["supply", "borrow", "yield_sleeve", "collateral"],
        endpoints={
            "app": "https://app.hatom.com",
            "api": "https://mainnet-api.hatom.com",
        },
        notes="Frontend hatomService = wallet ESDT proxy; true HF needs protocol API/SC",
    ),
    "xoxno": Venue(
        id="xoxno",
        name="XOXNO",
        chain="multiversx",
        category="nft",
        status="partial",
        roles=["nft_market", "external_buy"],
        endpoints={"app": "https://xoxno.com"},
        notes="External NFT buy path; in-dApp marketplace SC is separate",
    ),
    "ashswap": Venue(
        id="ashswap",
        name="AshSwap",
        chain="multiversx",
        category="dex",
        status="planned",
        roles=["stable_swap", "yield"],
        notes="Stable pools candidate for yield_sleeve USDC",
    ),
    # —— Solana ——
    "jupiter": Venue(
        id="jupiter",
        name="Jupiter",
        chain="solana",
        category="aggregator",
        status="planned",
        roles=["swap", "route", "price"],
        endpoints={"api": "https://quote-api.jup.ag/v6", "app": "https://jup.ag"},
        notes="No Solana key in LIA yet — signals only until executor adapter",
    ),
    "raydium": Venue(
        id="raydium",
        name="Raydium",
        chain="solana",
        category="dex",
        status="planned",
        roles=["swap", "lp"],
        notes="Secondary SOL DEX for arb vs Jupiter mid",
    ),
    # —— Hyperliquid (own L1, not Solana) ——
    "hyperliquid": Venue(
        id="hyperliquid",
        name="Hyperliquid",
        chain="hyperliquid",
        category="perps",
        status="planned",
        roles=["perps", "funding", "hedge"],
        endpoints={"api": "https://api.hyperliquid.xyz", "app": "https://app.hyperliquid.xyz"},
        notes="Perps/funding strategies; separate risk budget from MVX spot compound",
    ),
    # —— Soul Protocol (future) ——
    "soul": Venue(
        id="soul",
        name="Soul Protocol",
        chain="multi",
        category="protocol",
        status="experimental",
        roles=["restake", "soulbound_credit", "yield", "identity"],
        endpoints={},
        notes="Future hooks only — see lia/venues/soul.py; enable when API/SC published",
    ),
}


def get_venue(venue_id: str) -> Optional[Venue]:
    return VENUES.get(venue_id)


def list_venues(*, chain: Optional[str] = None, status: Optional[str] = None) -> list[Venue]:
    out = list(VENUES.values())
    if chain:
        out = [v for v in out if v.chain == chain]
    if status:
        out = [v for v in out if v.status == status]
    return out
