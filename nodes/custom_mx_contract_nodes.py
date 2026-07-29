"""
Custom MultiversX contract query nodes.

Provides read-only contract queries for the xArtists ecosystem contracts:
  - NFT Staking
  - TRO Governance / Staking
  - Marketplace / Escrow
  - NFT Minter

All queries go through ProxyNetworkProvider('https://api.multiversx.com').
A simple in-memory TTL cache avoids redundant API calls for read-only queries
within a single workflow run.
"""
import time
from typing import Any

from multiversx_sdk import (
    ContractQuery,
    ProxyNetworkProvider,
)

# ---------------------------------------------------------------------------
# Real deployed contract addresses (from data/config.json & packages/core)
# ---------------------------------------------------------------------------
NFT_STAKING_ADDR = "erd1qqqqqqqqqqqqqpgqmhtx5cctwwtatyaluycjfucre9y5vq2xyj7sqxr8cl"
TRO_GOVERNANCE_ADDR = "erd1qqqqqqqqqqqqqpgqrscvsxseyw04l0urzgnm2er5mxd2z64nyj7s6e0ca8"
MARKETPLACE_ADDR = "erd1qqqqqqqqqqqqqpgqjzn7zjyevwez8n0zfevpvnrwyp2ln879yj7sj8354t"
NFT_MINTER_ADDR = "erd1qqqqqqqqqqqqqpgq00a2jzre64akaw4jx257gwwyfxxd8fzfyj7snyztkn"


class _TtlCache:
    """Tiny in-memory cache with per-entry TTL (seconds)."""

    def __init__(self, default_ttl: int = 30) -> None:
        self._store: dict[str, tuple[float, Any]] = {}
        self.default_ttl = default_ttl

    def get(self, key: str) -> Any | None:
        entry = self._store.get(key)
        if entry is None:
            return None
        expires_at, value = entry
        if time.monotonic() > expires_at:
            self._store.pop(key, None)
            return None
        return value

    def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        t = ttl if ttl is not None else self.default_ttl
        self._store[key] = (time.monotonic() + t, value)

    def clear(self) -> None:
        self._store.clear()


class MxContractCustomNode:
    """Read-only contract query node for the xArtists MultiversX contracts."""

    # Contract addresses (overridable for testing)
    nft_staking_addr: str = NFT_STAKING_ADDR
    tro_governance_addr: str = TRO_GOVERNANCE_ADDR
    marketplace_addr: str = MARKETPLACE_ADDR
    nft_minter_addr: str = NFT_MINTER_ADDR

    def __init__(self, cache_ttl: int = 30) -> None:
        self.proxy = ProxyNetworkProvider("https://api.multiversx.com")
        self._cache = _TtlCache(default_ttl=cache_ttl)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _cache_key(self, contract_address: str, function: str, args: list) -> str:
        return f"{contract_address}::{function}::{tuple(args)}"

    async def _query_contract(
        self,
        contract_address: str,
        function: str,
        args: list | None = None,
        use_cache: bool = True,
    ) -> Any:
        """Low-level contract query with caching + error handling."""
        args = args or []
        key = self._cache_key(contract_address, function, args)
        if use_cache:
            cached = self._cache.get(key)
            if cached is not None:
                return cached
        try:
            query = ContractQuery(contract_address, function, args)
            result = await self.proxy.execute_contract_query(query)
            if use_cache:
                self._cache.set(key, result)
            return result
        except Exception as e:
            print(f"[MxContractCustomNode] Error querying {function} on {contract_address}: {e}")
            return None

    # ------------------------------------------------------------------
    # Public query methods
    # ------------------------------------------------------------------
    async def query_nft_staking(
        self, contract_address: str | None = None, function: str = "getStakingInfo", args: list | None = None
    ) -> Any:
        """Query the NFT Staking contract (stake / unstake / claimRewards / getStakingInfo)."""
        addr = contract_address or self.nft_staking_addr
        return await self._query_contract(addr, function, args)

    async def query_tro_staking(
        self, contract_address: str | None = None, function: str = "getUserStake", args: list | None = None
    ) -> Any:
        """Query the TRO Governance / Staking contract (stake / unstake / claimRewards / vote / getUserStake)."""
        addr = contract_address or self.tro_governance_addr
        return await self._query_contract(addr, function, args)

    async def query_marketplace(
        self, contract_address: str | None = None, function: str = "listNft", args: list | None = None
    ) -> Any:
        """Query the Marketplace / Escrow contract (listNft / buyNft / cancelListing)."""
        addr = contract_address or self.marketplace_addr
        return await self._query_contract(addr, function, args)

    async def query_nft_minter(
        self, contract_address: str | None = None, function: str = "mint", args: list | None = None
    ) -> Any:
        """Query the NFT Minter contract (mint / burn)."""
        addr = contract_address or self.nft_minter_addr
        return await self._query_contract(addr, function, args)

    def clear_cache(self) -> None:
        """Manually flush the read-only query cache."""
        self._cache.clear()


# More custom nodes for TRO staking, BTC bridge, etc.
