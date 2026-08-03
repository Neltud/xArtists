# xArtists dApp — composition finale & rendu frontend

**Base URL (Pages)** : https://neltud.github.io/xArtists/  
**Stack FE** : React 18 + Vite + Tailwind · MultiversX sdk-dapp · lazy routes

## Shell UI

| Élément | Rôle |
|---------|------|
| `Header` | Nav PRIMARY_NAV + Connect wallet |
| `BottomNav` | Mobile |
| `ErrorBoundary` + `PageLoader` | Robustesse |
| `PwaInstallBanner` | PWA |
| Footer desktop | GitHub · Explorer · xExchange |

## Routes & pages (rendu)

| Route | Page | Contenu principal |
|-------|------|-------------------|
| `/` | Dashboard | Vue LIA / statut agrégé |
| `/studio` | **ArtistStudio** | Wizard collection → média IPFS/YouTube externe → metadata → publier |
| `/gallery` | Gallery | Collections NFT, modal détail |
| `/marketplace` | Marketplace | Grille NFT, Buy/Sell/Offer/Bid UI |
| `/agents` | Agents | Catalogue agents + fee split |
| `/trading` | Trading | **LiaBoardPanel** (limites, arb, séries $10) + trailing + historique |
| `/portfolio` | Portfolio | Positions wallet, scénarios 365j win-rate |
| `/tro` | TroPage | Token $TRO |
| `/hatom` | HatomPage | Yield sleeve / liens Hatom |
| `/lp` | LPPoolsPage | Pools |
| `/wallet` | Wallet | Compte |
| `/tip` | Tip | EGLD / BTC / MoonPay (pas GoFundMe) |
| `/staking` `/dao` | Secondaires | |
| `/soul-testnet` | Experimental | Pas de fonds mainnet |
| `/burnify` | Shell | |
| `/agents/polylia` | Optionnel | |

## Composants clés

- `NFTDetailModal` — List / Buy / Bid ; Offer **sans** endpoint SC
- `LiaBoardPanel` — board JSON GitHub
- `GasCostPanel` — table gaz (`mvx_gas.json`)
- `MoonpayButton` — on-ramp EGLD
- `AgentsMarketplacePanel` — buy agents (SC agents déployé = Sprint A)

## Backend data (GitHub raw)

| Fichier | Producteur |
|---------|------------|
| `data/lia_board.json` | `lia.board.publish` |
| `data/mvx_gas.json` | `lia.gas.publish` |
| `data/lia_trades.json` | Vellum live cycle |
| collections NFT JSON | pipeline galerie |

## Couche LIA (hors navigateur)

- Venues : xExchange, OneDex, JEXchange, AshSwap, Hatom, XOXNO, Soul experimental
- Arb block-time, risk max 48 trades/j
- Media : Pinata IPFS, mxpy mint helpers
- SC : agents-marketplace, nft-marketplace (+ placeBid), soul-zk stubs

## Ce qui n’est **pas** dans le rendu FE

- PEM / clés Pinata
- Exécution trading live (Vellum)
- Transfert de chaîne YouTube
- Offer on-chain

## Rebuild Pages

```bash
cd apps/frontend && npm ci && npm run build
# déployer dist/ selon workflow gh-pages
```
