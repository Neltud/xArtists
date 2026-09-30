# xArtists — Audit A→Z (2026-09-30)

## On-chain

| Module | SC | Balance | Status |
|--------|-----|---------|--------|
| Slot | …s4g34f | **0.5 EGLD** (progressive seed) | LIVE code |
| TRO staking | …pe3xf3 | 0 EGLD | LIVE (stake dust done earlier) |
| Marketplace | …8txmm | 0 | LIVE · **0 listings** |
| Treasury | …nkezv | 0 | LIVE |
| Venue | …vje2y | 0 | LIVE |
| Deployer | …vl8v0g | ~0.34 EGLD + 479 TRO | gas residual |

## Front routes

All App lazy imports resolve (alias pages restored).

| Route | Role | Gap |
|-------|------|-----|
| `/` | Dashboard | OK |
| `/museum` | 3D + capacité murs | OK |
| `/marketplace` | **NFT list/buy** | Fixed (was F&G only) |
| `/market` | F&G analytics | Keep MarketPage |
| `/slot` | Casino | Needs CODEHASH secret + UI refresh |
| `/staking` | TRO + farms | OK unstake path |
| `/agents` `/my-packs` | Packs / salles | OK |
| `/studio` | Creator entry | Minimal OK |
| `/command-center` | Pack rooms | Guard present |
| `/go-live` | Checklist | OK |
| `/wallet` `/portfolio` | Wallet | OK |

## Gates (build secrets)

Workflow injects `VITE_*_CODEHASH_OK` from **GitHub Actions secrets**.  
If UI says « Bientôt » with SC live → **secrets missing or Pages not rebuilt**.

Required for full live UX:

- `VITE_LIVE_MODE` / `VITE_APP_MODE=live`
- `VITE_SLOT_CASINO_CODEHASH_OK=1`
- `VITE_TRO_STAKING_CODEHASH_OK=1`
- `VITE_MARKETPLACE_CODEHASH_OK=1`
- `VITE_VENUE_CODEHASH_OK=1`

## Product rules

- 1 pack IA = 1 salle · **4 murs × 4 œuvres** = 16 slots
- Public museum max **24** artworks displayed
- Slot REAL if house ≥ **0.5 EGLD** (seeded) **and** CODEHASH OK

## Remaining gaps (priority)

1. **CEO/ops:** confirm Pages secrets + rebuild (else forever « Bientôt »)
2. **Genesis spin** user dust after rebuild
3. **First listNft** → fill listings_index
4. **fundHouse liquid** endpoint (optional SC upgrade) — current seed = progressive only
5. Bottom nav now: Home · Musée · Market · Slot · Packs
6. Header SideNav: verify marketplace + slot links (SideNav file)
7. Unbonding countdown UX polish on stake
8. Pack mint SC still paper until minter CODEHASH

## Coherence

- Legal: « fond d’investissement » OK
- Soft labels Ouvert/Bientôt OK
- Fail-closed without secrets intentional
- War room / seed docs in `/docs`
