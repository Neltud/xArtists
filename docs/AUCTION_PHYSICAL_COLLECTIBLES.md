# xArtists — Salle des enchères (œuvres physiques & objets mintés)

**Statut :** design P1 · **pas** de live commercial · aligné pipeline `/rwa` + Studio + path B claim packs.

## Intention produit

Un **espace de vente aux enchères** pour :

1. **Œuvres physiques** (tableau, sculpture, objet) avec ou sans jeton de provenance NFT.
2. **Objets de collection mintés** (NFT/SFT MultiversX créés via Studio ou packs Genesis) — purement numériques ou liés à un physique.

Pas un marketplace “buy now” générique : **horloge d’enchère**, **escrow de règlement**, **preuve de livraison** si physique.

---

## Principes non négociables

| # | Règle |
|---|--------|
| 1 | **Titre légal physique ≠ ownership NFT** jusqu’à acceptation acheteur + (si prévu) transfert on-chain explicite |
| 2 | **Pas de double transfert non protégé** (EGLD/NFT + colis) sans séquence escrow |
| 3 | **Label transporteur ≠ expédition** ; **delivered carrier ≠ accepted buyer** (déjà `/rwa`) |
| 4 | Enchère **clos ≠ fonds libérés** ; settlement = fenêtre séparée |
| 5 | Dropship / print-on-demand **exclus** P1–P2 |
| 6 | IA = **triage**, jamais expert judiciaire ni déclencheur de payout auto |

---

## Modèle d’objet mis en vente

```text
Listing
  type: physical | digital_nft | hybrid
  seller_wallet (SIWX)
  title, medium, condition_hash (photo SHA-256 client-side)
  optional nft_identifier (MultiversX) + verify read-only
  reserve_price_eur | start_bid_eur
  currency_settlement: EUR (PayBox) | EGLD (chain) — P1 = EUR only recommended
  shipping_policy, inspection_hours (default 72)
  state: draft → published → live → ended → settlement → completed | cancelled | disputed
```

**Hybrid :** NFT de provenance reste en **custodie vendeur ou escrow wallet** jusqu’à `BUYER_ACCEPTED` ; puis transfer ou burn+reissue selon politique.

---

## Machine d’états enchère

```text
draft
  → published          (moderation légère / KYC seller later)
  → live               (start_at ≤ now < end_at)
  → ended              (end_at passed; winner = highest valid bid ≥ reserve)
  → settlement         (winner notified; payment window e.g. 48h)
  → paid               (PayBox IPN server_confirmed — path B style)
  → fulfill            (physical: same ladder as PHYSICAL_ART_SHOPIFY…)
  → carrier_delivered
  → buyer_accepted | disputed
  → completed          (release seller + optional NFT transfer)
```

**Bids :** append-only ledger Postgres ; max 1 high bid active per (listing, bidder) ; anti-sniping : extension +2–5 min si bid dans les N dernières minutes (paramètre).

**Proxy bids (P2) :** max_bid secret serveur, incréments fixes.

---

## Règlement (P1 recommandé = fiat)

Aligné **path B** packs :

1. Winner → session checkout PayBox **montant = highest bid + fees**.
2. IPN RSA → `server_confirmed` sur `auction_order`.
3. **Pas** de mint pack ici ; pour **digital_nft** : transfer depuis escrow **après** paid (et éventuellement après délai court anti-chargeback si politique EU).
4. Pour **physical / hybrid** : paid ouvre **fulfillment** (Shopify ou carrier plugin manuel d’abord) — **identique** aux gates `ORDER_PAID → SHIPPED → CARRIER_DELIVERED → BUYER_ACCEPTED`.
5. Libération vendeur (payout) **seulement** après `BUYER_ACCEPTED` ou fin inspection sans litige.

EGLD/on-chain auction (English on MultiversX) = **P2+** (dépôts de garantie, gas, UX friction) — ne pas bloquer le P1 fiat.

---

## UX dApp

| Route | Rôle |
|-------|------|
| `/explore/auction` ou `/explore/market/auction` | Catalogue live + ended |
| `/explore/auction/:id` | Lot · historique bids · countdown · CTA bid / settle |
| `/create/auction` (seller) | Création lot · lien Studio NFT · photo hash |
| Réutilise | `/rwa` receipt, `/studio` mint, Command bar intent « enchérir sur … » |

Mobile-first ; pas de WebGL obligatoire pour la salle (perf) ; option hall 3D **plus tard**.

---

## Intégration modules existants

| Module | Lien |
|--------|------|
| **Studio** | Mint NFT provenance avant listing hybrid |
| **RWA physical** | Fulfillment + receipt + dispute après hammer |
| **Marketplace V3** | Rayon « Enchères » distinct Buy-now |
| **PayBox / access-api** | Nouvelle famille `auction_orders` + IPN amount lock |
| **Path B claim** | Pattern voucher réutilisable pour transfer NFT digital post-paid |
| **LIA** | Signaux / narration lot — **jamais** bid auto ni payout |

---

## API (esquisse)

```text
POST /v1/auction/listings          SIWX seller
GET  /v1/auction/listings?state=live
GET  /v1/auction/listings/:id
POST /v1/auction/listings/:id/bids SIWX bidder (amount_cents)
POST /v1/auction/listings/:id/settle-checkout  winner → PayBox session
POST /v1/auction/ipn               (shared PayBox verify, ref=auction_*)
```

Flags : `AUCTION_ENABLED=0` default · same fail-closed culture as physical/studio.

---

## Phases de livraison

### P0 — Design + schema (cette doc)
- States, fees, non-goals figés

### P1 — Off-chain English auction + EUR settlement
- Postgres listings/bids/orders
- UI catalogue + lot + bid
- PayBox settle winner only
- Physical : brancher **après** paid sur pipeline RWA existant (pas de nouvel escrow crypto)
- Digital NFT : hold seller + **manual or voucher transfer** post-paid (pas atomic dual yet)

### P2 — Anti-sniping, proxy bids, fee TRO optionnel, KYC thresholds

### P3 — On-chain English / commit-reveal ou escrow EGLD MultiversX audité

### Explicit non-goals P1
- Auto-payout artiste sur webhook seul
- Enchère sur packs Pulse/Yield/Sentinel (catalogue fixe ≠ auction)
- Dropship
- « IA garantit authenticité »

---

## Risques & mitigations

| Risque | Mitigation |
|--------|------------|
| Winner ne paie pas | Blacklist / deposit P2 ; relist |
| Chargeback après ship | Inspection window ; payout delay ; assurance |
| NFT listé deux fois | Verify owner at publish + before transfer |
| Shill bidding | Rate limits · seller cannot bid · audit log |
| Confusion titre | Copy UI : physical title vs NFT |

---

## Continuité immédiate recommandée

1. Valider **P1 fiat English** (ce doc).
2. Schema SQL `auction_listings` / `auction_bids` / `auction_orders` (migrations **candidate**, pas apply prod aveugle).
3. Module frontend `auction` dans `experience/modules.ts`.
4. Réutiliser PayBox quote/IPN patterns ; **ne pas** rouvrir mint pack non atomique.
5. Garder `AUCTION_ENABLED=0` jusqu’à recette webhooks + 1 lot témoin non public.
