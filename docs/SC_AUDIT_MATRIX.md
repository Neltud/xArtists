# xArtists SC audit matrix (2026-09-28)

Legend: **LIVE** = on mainnet · **READY** = source audit-pass, wasm path proven · **DRAFT** = needs structure/security pass · **NO** = do not deploy

| Contract | Path | Status | LIA link | Notes |
|----------|------|--------|----------|--------|
| **venue-split** | `contracts/venue_split` | **LIVE mainnet** | 25% → LIA | Split immuable · pause only · no owner withdraw |
| nft-marketplace | `contracts/nft-marketplace` | READY | fee → LIA | list/buy/cancel · fee/royalty caps · AUDIT_DRAFT |
| agents-marketplace | `contracts/agents-marketplace` | READY | fee → LIA | agent_id cap · 2-step owner · pause |
| nft-staking | `contracts/nft-staking` | READY* | rewards policy off-chain | *needs meta/wasm like venue · no upgrade |
| tro-staking | `contracts/tro-staking` | READY* | principal only | *is_empty API · sc 0.50 → bump 0.66 |
| slot-casino | `contracts/slot-casino` | DRAFT | house → LIA | provably fair design · audit RNG before mainnet |
| treasury-splitter | `contracts/treasury-splitter` | DRAFT | multi-bucket | setSplitBps mutable by owner — DAO/multisig required |
| tro-burn | `contracts/tro-burn` | DRAFT | fee → LIA | needs ESDTLocalBurn role |
| tro-governance | `contracts/tro-governance` | DRAFT | treasury LIA | LP + ArtPass power |
| agent-stake-escrow | `contracts/agent-stake-escrow` | DRAFT | isolated | user lock EGLD for agent |
| rwa-escrow-bridge | `contracts/rwa-escrow-bridge` | DRAFT | — | |
| soul-zk-verifier | `contracts/soul-zk-verifier` | DRAFT | — | |
| btc-bridge | `contracts/btc-bridge` | **NO** | — | EXPERIMENTAL |

## venue-split security checklist (signed-off for first mainnet)

| Check | Result |
|-------|--------|
| No setSplit after init | ✅ |
| No owner withdraw / sweep | ✅ |
| Pause blocks new pay only | ✅ |
| Zero-address reject on init | ✅ |
| Dust → holders (no stuck remainder) | ✅ |
| Event arity sc 0.66 | ✅ |
| CEI-ish: compute then send | ✅ |
| Upgrade endpoint exists | ⚠️ present but owner-only; **policy: never call** |
| isPayable account flag | ⚠️ false — test rentPay dust |

## Deploy order (remaining)

1. venue-split ✅ LIVE
2. nft-marketplace (after same wasm/meta packaging)
3. agents-marketplace
4. nft-staking / tro-staking
5. slot-casino only after RNG audit
6. Never btc-bridge without separate security review

## PEM / ops

- Deployer: `erd1kex0p…vl8v0g` · secret `SC_DEPLOYER_PEM`
- Balance post-deploy ≈ 1.08 EGLD
- PEM never on Akash / never in repo
