# Audit dApp double-check — 2026-08-05

## Matrice pages

| Route | Rôle | OK | Lacune principale |
|-------|------|----|-------------------|
| `/` Dashboard | LIA ops view | ✅ | Board JSON si non publié |
| `/studio` | Parcours mint | ✅ | Mint auto SC absent |
| `/gallery` | Catalogue | ✅ | Bios génériques OK |
| `/marketplace` | Buy/sell UI | ⚠️ | **SC empty** — bannière P0 |
| `/agents` | 3 couches | ✅ | agents_marketplace null |
| `/trading` | Board | ⚠️ | data si non publish |
| `/portfolio` | LIA + simu | ⚠️ | confondre user/LIA |
| `/tro` | Token | ✅ | Illiquidité à afficher |
| `/dao` | Lecture $TRO | ✅ | Vote TX off ; SC gov empty |
| `/wallet` | User | ✅ | Signature réelle P0 |
| `/tip` | Dons | ✅ | Labels Mission/ops |
| `/ads` | Pub enchères | ✅ | V1 memo only |
| `/hatom` `/lp` | DeFi | ⚠️ | Proxy / lecture |
| `/soul-testnet` | Exp | ✅ | Isolé |
| `/burnify` | Shell | ✅ | UI only |

## Contrats (contracts.json)

| SC | État |
|----|------|
| marketplace | **empty** codeHash null |
| agents_marketplace | **null** |
| nft_minter / staking / tro_gov | **0 EGLD / empty** |

→ Ne jamais envoyer fonds/NFT vers ces adresses.

## Séparation produit

| Couche | |
|--------|--|
| LIA Vellum protocole | Book pyramides, dashboard |
| Agent Pack NFT limité | Créateur, escrow isolé |
| GreenSmoke | Signaux externes |

## Sécurité UX

| Item | Statut |
|------|--------|
| Vote DAO factice | Désactivé |
| Nelson Tuduri titre galerie | Absent |
| $TRO max 500k | Affiché |
| Connect ≠ LIA | Header enforce |
| Ad label sponsored | AdSlot |
| API keys packs | hash-only backend |

## P0 order

1. Top-up EGLD LIA  
2. Deploy nft + agents market  
3. codeHash + env + Pages  
4. Signature List/Buy  

## Fixes this pass

- Tip : copy mission/ops + pas promesse yield  
- DAO : TreasuryBanner + empty SC warning  
- Studio : AdSlot studio_banner  
