# Sprint 2026-11-02 — Genesis 3D + commercial lock + mint paper

## Objectif
Version aboutie **paper-ready** : cartes 3D dual-face, landings `/packs/:id`, metadata mint alignée, CI E2E soft, Dependabot majors bridés.

## Livré sur main (cette session)

| Item | Status |
|------|--------|
| E2E Playwright pin + soft-fail | ✅ |
| dependabot ignore React19/RR7/sdk-core/recharts majors | ✅ |
| GenesisCard3D (recto peinture / verso HUD, spin Y) | ✅ |
| PackLandingPage + routes `/packs/:id` | ✅ (déjà) |
| GenesisPackShelf 3D | ✅ (déjà branch → import Card) |
| packNftMetadata + buildMintMetadata | ✅ |
| mint-on-payment.yml paper-first | ✅ |
| PACK_NFT_MINT_METADATA.md | ✅ |
| COMMERCIAL_MODEL one_time vs Whop TCA | ✅ (doc existante) |

## NO-GO commercial jusqu’à
1. **S1** — 1 paiement réel PayBox/Whop one_time (smoke Sentinel 50€)
2. **S2** — My Packs affiche NFT/SFT on-chain proof

`VITE_LIA_LIVE_TRADING=0` · mint paper · pas de PEM en CI publique.

## Prix Rule1 (catalogue)
| Pack | EUR | ≈ EGLD |
|------|-----|--------|
| Pulse | 110 | 33 |
| Yield | 75 | 22.5 |
| Sentinel | 50 | 15 |

## Whop
- Packs = **one_time** plans (déjà)
- **TCA Membership** = mensuel/annuel services only — **sans** NFT Genesis

## Next (ordre)
1. Fermer PR Dependabot restantes (UI bulk)
2. Pages rebuild → smoke `/packs/pulse` + shelf 3D
3. Assets IPFS recto/verso (optionnel UX CSS déjà OK)
4. Smoke mint-3-packs-to-admin (paper)
5. S1 réel → S2 My Packs → GO gate

## Collections mainnet
- XAIPLS-2cf72b · XAIYLD-987e24 · XAISNT-3d8a6b
