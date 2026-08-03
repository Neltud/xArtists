# Audit système complet xArtists

Date: 2026-08-03

---

## 0. Deux wallets — ne jamais confondre

| Rôle | Adresse | Qui signe | Usage |
|------|---------|-----------|--------|
| **LIA / protocole (ops)** | `erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6` | PEM **Vellum only** | Trades LIA, deploy SC, claimFees si owner, positions board |
| **Utilisateur (dApp)** | n’importe quel `erd1…` **≠** LIA | xPortal / extension / Web Wallet | List/Buy/Bid NFT, Buy agent, tip, stake |

**Règles code déjà en place :**
- `WalletContext` refuse connect avec l’adresse LIA
- Dashboard / tip affichent LIA comme compte protocole, pas comme « toi »
- `deploy-pages.yml` injecte `VITE_WALLET=erd1p4zy…` → **attention** : c’est le wallet **affichage LIA**, pas le user

**Risque logique :** si un jour le FE utilise `VITE_WALLET` comme destinataire de tip/user, confusion. Tip doit toujours permettre coller l’adresse user ou LIA **explicitement labelisée**.

---

## 1. Smart contracts — endpoints et conséquences

### 1.1 `agents-marketplace` (code repo — **non déployé** `agents_marketplace: null`)

| Endpoint | Qui | Args / payment | Conséquence on-chain |
|----------|-----|----------------|----------------------|
| `init(fee_bps)` | deployer | fee ≤ 1000 bps | Owner=caller, fees=0, paused=false |
| `upgrade` | owner | — | No-op storage gate (codehash via chain) |
| `setPaused(bool)` | owner | — | Bloque list/buy |
| `setFeeBps(u16)` | owner | ≤1000 | Change fee futures buys |
| `transferOwnership` | owner | new | Pending owner only |
| `acceptOwnership` | pending | — | Owner change |
| `claimFees` | owner | — | `accumulated_fees` → owner EGLD |
| **`listAgentAction`** | **anyone** | agent_id, price | Listing metadata only — **pas d’escrow d’actif** |
| **`buyAgentAction`** | buyer | listing_id + **EGLD ≥ price** | CEI inactive ; fee → accumulated ; **97% seller** (si 300 bps) ; excess → buyer |
| `cancelListing` | seller | id | active=false |
| views | anyone | getListing, getFeeBps, getAccumulatedFees, getContractEgldBalance, getOwner, isPaused | Lecture |

**Conséquences métier :**
- Achat = **paiement pour un `agent_id` string**, pas livraison automatique d’un agent exécutable on-chain.
- Droits off-chain (accès LIA / Vellum) doivent être **orchestrés hors SC** après event `buy`.
- Seller = caller de `listAgentAction` (peut être LIA ou un tiers).

**Gaps :**
- Pas de burn $TRO
- Pas de lien on-chain agent_id → SC exécuteur
- Deploy manquant → FE Agents Buy mort

---

### 1.2 `nft-marketplace` (adresse dans contracts.json — **vérifier codehash = repo**)

| Endpoint | Qui | Payment | Conséquence |
|----------|-----|---------|-------------|
| `init(fee_bps)` | deployer | — | idem agents |
| admin (pause, fee, ownership, claimFees, upgrade) | owner | — | idem |
| **`listNft(price, royalty_bps, royalty_receiver)`** | seller | **1 NFT** (payable `*`) | NFT escrowed on SC ; listing active |
| **`buyNft(id)`** | buyer | EGLD ≥ price | Refund bid if any ; NFT → buyer ; fee + royalty + seller ; excess → buyer ; inactive |
| **`placeBid(id)`** | bidder | EGLD ≥ price or > prev | Escrow bid ; **refund previous bidder** |
| **`acceptBid(id)`** | seller | — | Settle at bid amount (fee/royalty split) ; NFT → bidder |
| **`withdrawBid(id)`** | current bidder | — | EGLD back |
| **`cancelListing(id)`** | seller | — | Refund bid ; **NFT back to seller** |
| views | getListing, getBid, fees, owner, paused | |

**Splits buy / acceptBid (fee_bps=300, royalty=500 exemple) :**
- fee 3 % → `accumulated_fees`
- royalty 5 % → royalty_receiver
- reste 92 % → seller

**Offer :** aucun endpoint (voulu).

**Gaps / risques :**
- SC live peut être **ancien** sans placeBid
- FE `listNft` data encoding doit matcher (ESDTNFTTransfer + endpoint args)
- Pas de burn TRO on sale
- Pas de flag « physical escrow / phygital locked »

---

### 1.3 Autres contrats référencés (adresses contracts.json)

| Nom | Usage FE | Audit code repo |
|-----|----------|-----------------|
| `nft_staking` | DAO/staking UI | SC externe / legacy — **pas audité dans ce pass** |
| `tro_governance` | DAO votes UI | idem |
| `nft_minter` | mint path | à valider avant issue auto |
| `soul-zk-verifier` | experimental | stubs — **pas de fonds mainnet** |

---

## 2. Workflows GitHub

| Workflow | Trigger | Effet | Risque |
|----------|---------|-------|--------|
| **deploy-pages.yml** | push `apps/frontend|docs|data` + manual | Build Vite → **commit `docs/`** → Pages | Commit bot sur main ; `VITE_WALLET`=LIA |
| deploy-frontend.yml | ? | Autre path deploy | Possible **doublon** avec pages |
| deploy-exclusive.yml | ? | | Concurrence deploy |
| static.yml / jekyll-gh-pages / pages.yml | | | **Redondance** CI → conflits possibles |
| deploy-scs.yml | | Deploy SC CI | Secrets PEM en CI = surface d’attaque |
| ci-cd.yml / rust.yml / e2e.yml | | Build/test | OK si isolés |
| release-please | | Versions | |

**Recommandation :** 1 seul workflow Pages ; SC deploy **manual + PEM local/Vellum**, pas auto main sans review.

---

## 3. Agents LIA (logique produit)

| Agent (Dashboard) | Rôle | Exécution réelle |
|-------------------|------|------------------|
| LIA Trading | MR/MOM/ARB + TP | Executor paper ; live gated PEM |
| LIA Marketplace | NFT MM / list | Signaux + SC user-driven |
| LIA Yield | Hatom / farms | Feeds + liens ; supply off-app |
| LIA Security | BalanceGuard | Status JSON |
| LIA RWA Escrow | Phygital | **Pas de lock SC** encore |
| LIA DAO | Gouvernance $TRO | UI + SC governance legacy |

**Agents marketplace (`agent_id`)** : produit vendable (accès / config), **≠** déploiement d’un process on-chain.

**Vellum** : Timer → publish board/gas → orchestrator → executor (paper). Secrets : PEM, PINATA_JWT, LIA_LIVE_TRADING.

---

## 4. dApp — fonctions et problèmes de logique

| Fonction | Structure | Problème logique |
|----------|-----------|------------------|
| Connect | Refuse LIA | Manual address = **read-only** mais UI peut tenter TX |
| List/Buy/Bid | useMarketplaceTx | Signature dépend `__xartistsSendTx` ; listing ID **manuel** |
| Agents Buy | UI | SC null → argent **ne peut pas** partir |
| Tip | Adresses | Clarifier destinataire LIA vs user |
| Dashboard stats | LIA portfolio | User croit voir **son** portfolio si mal lu |
| DAO | Votes UI | Vote on-chain peut ne pas être branché sendTx |
| Studio mint | Guide | Pas de mint auto — OK si message clair |
| Board | Multi-URL | Seed OK ; live = Vellum |
| deploy-pages `VITE_WALLET` | Build | Nom trompeur = LIA ops |

---

## 5. Priorités correctives (après cet audit)

1. Deploy agents SC + post_deploy  
2. Vérifier codehash nft-marketplace vs placeBid  
3. Un seul workflow Pages ; retirer `VITE_WALLET` ambigu ou le renommer `VITE_LIA_PROTOCOL_WALLET`  
4. Après buyAgent : webhook Vellum pour provisionner l’accès  
5. E2E signature avant LIA_LIVE_TRADING=1  

---

## 6. Questions ouvertes pour le product owner

Voir section ci-dessous dans la conversation.
