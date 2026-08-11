# xArtists — Matrice clic / TX end-to-end

**Version** : 2026-08-11 · **Réseau** : MultiversX mainnet · **Repo** : Neltud/xArtists  
**Principe** : chaque clic est classé *lecture* | *session* | *TX on-chain* | *externe*.  
**Règle sécurité** : aucune TX user vers un SC tant que `codeHash` ≠ null + `VITE_*_CODEHASH_OK=1`.

---

## 0. Wallets (ne jamais confondre)

| Rôle | Adresse | Peut signer List/Buy user ? |
|------|---------|-----------------------------|
| **User Connect** | wallet de l’utilisateur | Oui (cible) |
| **LIA Ops / Protocol** | `erd1p4zyy…lerqu0crn6` | **Non** — bloqué UI (`isLiaOpsWallet`) |
| **Mission / Reserve** | à créer | Ops / multisig uniquement |
| **SC marketplace** | `erd1qq…8354t` (placeholder) | **Compte vide** — ne pas envoyer de fonds |
| **agents_marketplace** | `null` | Non déployé |

Session « coller erd1 » = **lecture seule** (`method: web_wallet` sans signature fiable).

---

## 1. Navigation globale

| Clic | Type | Effet | Risque |
|------|------|-------|--------|
| Logo / Home | lecture | Route `/` Dashboard | Faible |
| PRIMARY_NAV (Header desktop) | lecture | Routes lazy | Faible |
| BottomNav mobile (Home, Studio, Market, Agents, LIA, Wallet) | lecture | KPI rétention ; **pas DAO** (DAO via menu ☰) | Faible |
| Connect | session | Modal Web Wallet / xPortal / extension / paste erd1 | Moyen si paste LIA (bloqué) |
| Disconnect | session | Clear local session | Faible |
| OraclePriceBadge | lecture | Prix EGLD | Faible |
| Footer GitHub / Explorer / Editions / Ads | externe | Liens canoniques `LINKS.*` | Faible |

**TxGate** : lazy `TxShell` uniquement sur `/marketplace` `/studio` `/agents` `/agents/polylia` `/tip` `/wallet` `/staking` `/tro` `/burnify`.

---

## 2. Par page — clics & TX

### `/` Dashboard
| Clic | Type | Notes |
|------|------|-------|
| PersonaWelcome (Artiste / Collectionneur / Investisseur / Curieux) | lecture | Oriente vers Studio / Market / Portfolio / Galerie |
| Cartes LIA status / Board | lecture | JSON `data/*.json` (Vellum publish) |
| AdSlot home_hero | lecture | `ads_active.json` si publié |

**Manque** : si Board 404 → lancer `python -m lia.board.publish`.

### `/studio` ArtistStudio
| Clic | Type | Notes |
|------|------|-------|
| Upload image/vidéo/audio | local | Pas de pin auto tant que proxy Pinata backend absent |
| Pin IPFS (si branché) | externe API | JWT Pinata ops — **jamais en front public** |
| Issue collection / mint | TX | Bloqué sans minter live + estimation gas |
| List after mint | TX | Même gate marketplace |

**P1** : pin proxy backend ; mint mxpy/SC avec gas exact.

### `/gallery`
| Clic | Type | Notes |
|------|------|-------|
| Filtres collections | lecture | Catalogue `xartists_collections.json` |
| Carte NFT → détail | lecture | Explorer / XOXNO liens |
| Titre | — | **xArtists** (pas Nelson Tuduri en titre galerie) |

### `/marketplace`
| Clic | Type | Gate |
|------|------|------|
| Search / sort / pills | lecture | — |
| Refresh MultiversX | API | `api.multiversx.com/collections/.../nfts` |
| Buy / Sell / Bid (carte) | ouvre modal | TX désactivées si `!canListBuyNft()` |
| **Offer** | **désactivé** | Pas d’endpoint escrow — message uniquement |
| Listing ID | input manuel | P1 index events |
| MoonPay | externe fiat | EGLD on-ramp |
| AdSlot market_sidebar | lecture | |

**Flux TX (après deploy)** :
1. Connect wallet user ≠ LIA  
2. `__xartistsSendTx` injecté (sdk-dapp)  
3. `listNft` : ESDTNFTTransfer → SC `@listNft@price@royalty`  
4. `buyNft` : EGLD value + `@buyNft@listingId`  
5. `placeBid` / `acceptBid` / `withdrawBid` / `cancelListing`  
6. Fees SC restent sur contrat jusqu’à `claimFees` owner  

**Adresse actuelle** = empty account → bandeau P0 obligatoire.

### `/agents`
| Zone | Type | Gate |
|------|------|------|
| Packs LIA protocole | lecture + Buy | `agents_marketplace` null → bouton « Bientôt » |
| Agent Packs NFT 5–25 € | formulaire | Création concept ; paiement on-chain post-deploy |
| GreenSmoke leaderboard | lecture | **≠ packs LIA** — score advisory plafonné |
| Buy pack | TX | FEE_BPS=300 ; seller 97 % ; fee 3 % on SC |

### `/trading`
| Clic | Type | Notes |
|------|------|-------|
| Modes / board | lecture | Paper tant que `LIA_LIVE_TRADING=0` |
| Aucune TX user vers DEX depuis cette page (V1) | — | LIA exécute via Vellum + PEM ops |

### `/portfolio` (LIA protocole)
| Clic | Type | Notes |
|------|------|-------|
| Actualiser | API | Wallet LIA fixe |
| Scénarios 365j | calcul local | **pas une promesse** |
| LiaMultichainPanel | lecture | BTC/SOL signals |

### `/wallet` (user)
| Clic | Type | Notes |
|------|------|-------|
| Connect requis | session | Soldes **user only** |
| Copier / Explorer | lecture | |
| MoonPay | externe | |

### `/dao`
| Clic | Type | Notes |
|------|------|-------|
| Holders $TRO API | lecture | `/tokens/TRO-94c925/accounts` |
| Buy $TRO | externe xExchange | |
| **Vote** | **absent volontairement** | Pas de faux bouton |
| Governance / Staking addrs | lecture | Comptes vides — ne pas envoyer fonds |

### `/tip`
| Clic | Type | Notes |
|------|------|-------|
| Tip EGLD → LIA ops | TX simple transfer | Memo tip/mission recommandé |

### `/hatom` `/lp`
| Clic | Type | Notes |
|------|------|-------|
| Liens protocole | externe | LIA yield sleeve ops ; user peut ouvrir Hatom |
| HF 999 | label N/A | BigInt + fallback |

### `/staking` `/tro`
| Clic | Type | Notes |
|------|------|-------|
| Stake UI | TX future | SC staking empty — lecture + liens |

### `/burnify` `/soul-testnet`
| Clic | Type | Notes |
|------|------|-------|
| PreMainnetBanner | lecture | **Pas de fonds user** |
| LIA Burnify flow | ops LIA | Stake BFY + burn TRO + claim EGLD batches |

### `/ads` `/editions`
| Clic | Type | Notes |
|------|------|-------|
| Bid ad memo | transfer EOA | MVP sans SC |
| Abonnement Editions | off-chain / futur Stripe | Lettre mensuelle |

---

## 3. Chaîne de signature (critique)

```
User clic Buy
  → NFTDetailModal.guard()
      → canListBuyNft() ?          # VITE_MARKETPLACE_CODEHASH_OK=1 + addr ≠ empty
      → isLoggedIn && !isLiaOpsWallet
  → useMarketplaceTx.buyNft()
      → isMarketplaceLive()
      → useSendTransaction.send()
          → window.__xartistsSendTx  # bootstrapSendTx (sdk-dapp | extension)
          → sinon erreur explicite (pas de faux succès)
```

**Lacunes signature** :
1. Paste erd1 → session sans sign → TxCapabilityBanner amber  
2. Extension `signTransaction` sans broadcast → risque « signed but not sent »  
3. WalletConnect project ID doit être configuré dans `sdkDapp.ts`  

---

## 4. Flux trésorerie (après market live)

| Source | Split indicatif |
|--------|-----------------|
| Fees marketplace / agents | 40 % Mission · 30 % Reserve · 20 % Ops · 10 % incentives |
| Tips | 70 % Mission · 20 % Reserve · 10 % Ops |
| PnL LIA live | seulement si `LIA_LIVE_TRADING=1` + micro-proofs |

`claimFees` agents : **owner only** — pas encore déployé.

---

## 5. Checklist P0 avant « market live » UI

- [ ] Deploy `nft-marketplace` mainnet (PEM LIA + EGLD)  
- [ ] Deploy `agents-marketplace` FEE_BPS=300  
- [ ] `python scripts/verify_marketplace_codehash.py` → codeHash ≠ null  
- [ ] `post_deploy_contracts.py` → `data/contracts.json` + VITE_*  
- [ ] Rebuild GH Pages  
- [ ] Micro List/Buy avec wallet **user**  
- [ ] Retirer bandeau rouge « SC non déployé » seulement si gates verts  
- [ ] Garder `LIA_LIVE_TRADING=0` jusqu’à micro-trades OK  

---

## 6. Questions ouvertes (ops)

1. Mission + Reserve : multisig ou EOA séparés ?  
2. Index listings : indexer MVX events ou API custom post-deploy ?  
3. Offer V2 : escrow SC dédié ou rester off-chain ?  
4. Pinata : JWT uniquement serveur — confirmer endpoint proxy Studio  
5. Vote DAO on-chain : ABI tro_governance réel ou redesign ?  

---

*Document généré pour audit interne / externe. Ne pas inventer de codeHash live.*
