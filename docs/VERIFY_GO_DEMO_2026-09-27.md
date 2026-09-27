# Vérification dApp complète — 27 sept 2026

## Live

| Check | Résultat |
|-------|----------|
| Pages `https://neltud.github.io/xArtists/` | HTTP 200 |
| Build meta | `4.0.2-process-polyfill` |
| `data/museum_catalog_daily.json` | 200 · 16 œuvres Met PD |
| `data/art_tour_locations.json` | 200 |
| `data/ads_active.json` | 200 · créative home_hero |
| MultiversX `/stats` | epoch ~2245 · refreshRate 600 ms |
| Posture produit | **GO_DEMO** — paper / pre-SC |

## Modules

| Module | UX | On-chain |
|--------|----|----------|
| Musée 3D + catalogue | Live | lecture NFT API |
| Carte OSM / tours | Live | — |
| Wallet xPortal | Live (fragile Pages) | lecture |
| Packs / theater | Paper | SC agents empty |
| Slot EGLD/USDC | Paper | SC slot non déployé |
| Trading LIA | Paper | `LIA_LIVE_TRADING=0` |
| Market list/buy | Gated | codeHash null |
| Staking / DAO vote | Gated | SC empty |
| Tip | Live (user sign) | transfer |
| Ads / venues | Paper | SC après audit |
| Digital twin | Paper | mint SC draft |
| Indexeur Akash | Deploy actif (Console) | lecture API MX |

## Deploy SC — blocage actuel

1. Wallet deploy `erd1kex0p…vl8v0g` : **balance 0 EGLD** (probe API)
2. PEM deploy **hors** session chat / pas dans git (correct)
3. Gate GO_LIVE : audit + treasury dest + verify codeHash avant `VITE_*_CODEHASH_OK`

**Impossible de déployer depuis ce chat sans** : fonds sur le deployer + secret `SC_DEPLOYER_PEM` (Actions) ou PEM local opérateur.

Wasm sources présents : `nft-marketplace`, `agents-marketplace`, `slot-casino`, `nft-staking`, `tro-staking`, `treasury-splitter` (btc-bridge = experimental OFF).

## Actions utilisateur finalisées (UI)

Voir `apps/frontend/src/config/userActions.ts` + panneau `UserActionsPanel`.

## Optimisations prioritaires suivantes

1. Brancher `UserActionsPanel` sur Dashboard + `/demo`
2. Stabiliser xPortal (allowlist + hard-refresh WC)
3. URI Akash indexer → `VITE_CATALOG_API`
4. Recharger deployer EGLD → dry-run `runbook_deploy` → 1 SC audit-ready
5. Health cron `/health` Akash
