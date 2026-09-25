# xArtists Smart Contracts (MultiversX) — MAINNET ONLY

| Contract | Path | Status |
|----------|------|--------|
| **NFT Marketplace** | `contracts/nft-marketplace` | P0+P1 hardened — mainnet deploy ready |
| **Agents Marketplace** | `contracts/agents-marketplace` | P0+P1 hardened — mainnet deploy ready |
| **Slot Casino** | `contracts/slot-casino` | Provably fair lock/resolve — **not deployed** |
| **NFT Staking** | `contracts/nft-staking` | Source complete — stake/unstake NFT + points view |
| **TRO Staking** | `contracts/tro-staking` | Source complete — stake/unstake TRO ESDT |
| **Agent Stake Escrow** | `contracts/agent-stake-escrow` | Source ready |
| **Treasury Splitter** | `contracts/treasury-splitter` | Source ready |
| **BTC Bridge** | `contracts/btc-bridge` | **EXPERIMENTAL — DO NOT deploy** |

## Supernova prep

Round duration **600 ms**. Avoid hardcoded 6s assumptions. See:
https://docs.multiversx.com/developers/best-practices/prepare-sc-supernova

Front probes `api.multiversx.com/stats` (`refreshRate`, `epoch`).

## Network policy

**Mainnet only** (`CHAIN=1`). PEM never in git.

## Deploy gate

`confirm_mainnet=DEPLOY_MAINNET` · codeHash verify · `VITE_*_CODEHASH_OK` only after verify.
