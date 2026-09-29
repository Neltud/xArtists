# Suite prioritaire — xArtists mainnet (après checklist GO_LIVE)

## Par où commencer (ordre strict)

### 1. TX user réelle (priorité absolue)
**Pourquoi :** prouve la boucle complète xPortal → SC → explorer.

| Action | Page | Condition |
|--------|------|-----------|
| Stake dust TRO | `/staking` → onglet TRO | `VITE_TRO_STAKING_CODEHASH_OK=1` + adresse **nouvelle** |
| List / buy NFT dust | `/market` | `VITE_MARKETPLACE_CODEHASH_OK=1` |
| Claim points | Daily check-in | wallet connecté |

Sans 1 TX user visible explorer → ne pas annoncer LIVE public.

### 2. Ops checklist orange (toi, pas code)

| Item | Action |
|------|--------|
| WalletConnect allowlist | Cloud project : autoriser `neltud.github.io` |
| Slot CODEHASH | `VITE_SLOT_CASINO_CODEHASH_OK=1` **après** fund progressive + 1 spin dust |
| pulse-api | optionnel phase 1 |
| Vellum webhook | optionnel journal |

### 3. Polish produit (déjà en cours)
- Mini-logos tokens (`TokenIcon` TRO/EGLD/USDC) sur Staking
- ChainObjectCanvas home (RPC → couleur)
- Brain mood strip (local jusqu’à `VITE_BRAIN_WS`)
- 3 salles holder `/room/:packId`

### 4. Ensuite seulement
- Fund slot + spin public
- Market list réel collection
- Akash FastAPI → `VITE_BRAIN_WS`
- Mentions légales siège postal si besoin conformité FR

## Carte pages (détail modules)

| Route | Modules clés | SC |
|-------|--------------|-----|
| `/` | ChainObjectCanvas, session, Phase4 | miroir 4 SC |
| `/staking` | TroStakePanel, yield pools, TokenIcon | tro_staking |
| `/my-packs` | packs paper/live, enter room | — |
| `/room/:id` | AgentMonitor, LIA clone, desk link | — |
| `/trading` | PaperLiveDesk, useLIA | paper |
| `/market` | marketplace list/buy | nft_marketplace |
| `/slot` | spinEgld | slot_casino gated |
| `/venues` | rentPay | venue_split |
| `/dao` | vote | tro_governance |
| `/legal` | SIRET 82418276000028 | — |
| `/go-live` | checklist ops | — |

## Règles non négociables (rappel)
- PEM hors git / chat / Akash / front
- CODEHASH jamais `=1` commité dans le repo
- Pas de deploy mainnet sans revue humaine
