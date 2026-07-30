"""RewardsAgent — distribution automatisée des rewards (TRO / NFT staking). Paper by default."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any
from vellum.workflows import BaseNode

XARTISTS_COLLECTIONS = [
    "AGR-9bd53e", "ALISTOR-a646bc", "ASFT-a6273a", "BGG-2b627c",
    "HP47X2-b71543", "MAS-5189b6", "NFTUDURI-2990b6", "XTR-e5072b",
    "XAUS-d9cf1f", "XAR-cee2e0", "TRO-652d6d",
]

class RewardsAgent(BaseNode):
    force_mode: str = "paper"
    tro_staking_sc: str = "erd1qqqqqqqqqqqqqpgqrscvsxseyw04l0urzgnm2er5mxd2z64nyj7s6e0ca8"
    nft_staking_sc: str = "erd1qqqqqqqqqqqqqpgqmhtx5cctwwtatyaluycjfucre9y5vq2xyj7sqxr8cl"
    max_payout_usd: float = 50.0
    pending_tro_rewards: list[dict[str, Any]] = []
    pending_nft_rewards: list[dict[str, Any]] = []
    nft_floor_prices_usd: dict[str, float] = {}
    oracle_ok: bool = True

    class Outputs(BaseNode.Outputs):
        mode: str
        actions: list[dict[str, Any]]
        report: dict[str, Any]
        summary: str
        skipped_dust: int
        total_usd: float

    def run(self) -> "RewardsAgent.Outputs":
        mode = (self.force_mode or "paper").lower()
        actions: list[dict[str, Any]] = []
        skipped = 0
        total_usd = 0.0
        for item in list(self.pending_tro_rewards or []):
            usd = float(item.get("amount_usd") or 0)
            if usd < 0.01:
                skipped += 1
                continue
            if total_usd + usd > self.max_payout_usd:
                break
            actions.append({
                "type": "CLAIM_TRO_REWARDS",
                "address": item.get("address"),
                "amount": item.get("amount"),
                "amount_usd": usd,
                "sc": self.tro_staking_sc,
            })
            total_usd += usd
        for item in list(self.pending_nft_rewards or []):
            col = str(item.get("collection") or "")
            if col and col not in XARTISTS_COLLECTIONS:
                continue
            usd = float(item.get("amount_usd") or 0)
            if usd < 0.01:
                skipped += 1
                continue
            if total_usd + usd > self.max_payout_usd:
                break
            actions.append({
                "type": "CLAIM_NFT_REWARDS",
                "address": item.get("address"),
                "collection": col,
                "nonce": item.get("nonce"),
                "amount_usd": usd,
                "sc": self.nft_staking_sc,
            })
            total_usd += usd
        if mode == "paper":
            for a in actions:
                a["result"] = "PAPER_SIMULATED"
        report = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "mode": mode,
            "actions_count": len(actions),
            "total_usd": round(total_usd, 4),
            "skipped_dust": skipped,
            "oracle_ok": bool(self.oracle_ok),
            "actions": actions,
        }
        summary = f"RewardsAgent [{mode}] actions={len(actions)} usd={total_usd:.2f}"
        return self.Outputs(
            mode=mode, actions=actions, report=report, summary=summary,
            skipped_dust=skipped, total_usd=round(total_usd, 4),
        )
