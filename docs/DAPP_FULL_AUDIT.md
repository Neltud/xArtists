# Audit complet dApp xArtists — clics, TX, implications, manques

Date: 2026-08-03 · Réseau cible: **mainnet only**

## Légende statut

| Tag | Signification |
|-----|----------------|
| ✅ | Fonctionne / code + data OK |
| ⚠️ | UI présente, backend/SC partiel |
| ❌ | Manquant ou bloqué |
| 🔐 | Ops/Vellum only (pas navigateur) |

---

## 1. Navigation (chaque clic)

| Clic | Destination | Implication | Manque |
|------|-------------|-------------|--------|
| Logo / Home | `/` | Dashboard agrégé | Données LIA si JSON stale ⚠️ |
| Studio | `/studio` | Wizard artiste | Mint on-chain non auto ❌ → mxpy 🔐 |
| Galerie | `/gallery` | Collections JSON | Refresh live partiel ⚠️ |
| Market | `/marketplace` | NFT grid + modal TX | SC marketplace adresse placeholder? ⚠️ ; listing ID manuel ⚠️ |
| Agents | `/agents` | Buy agents | **agents_marketplace = null** ❌ |
| Trading | `/trading` | Board + trades | `lia_board.json` / trades si non publish ⚠️ |
| Portfolio | `/portfolio` | Positions + scénarios | Gas panel si `mvx_gas.json` absent ⚠️ |
| $TRO | `/tro` | Info token | — |
| Hatom | `/hatom` | Yield | API protocole limitée ⚠️ |
| LP | `/lp` | Pools | Liens externes |
| Wallet | `/wallet` | Vue compte | Session manuelle ≠ signing ⚠️ |
| Tip | `/tip` | Dons | OK (pas GoFundMe) |
| Staking / DAO | secondaires | | UI seule ⚠️ |
| Soul testnet | experimental | | Pas de funds mainnet ✅ |
| BottomNav Art | `/marketplace` | | Studio absent bottom ⚠️ → fix |
| Connect | Modal | Web/xPortal/ext/manual | `__xartistsSendTx` souvent absent ❌ ; WC QR pas complet ⚠️ |
| Disconnect | clear session | | OK |

---

## 2. Transactions (chaque action)

| Action | Endpoint / data | Gas ordre | Implication | Manque |
|--------|-----------------|-----------|-------------|--------|
| Connect Web Wallet | redirect hook | 0 | Session | Callback path Pages ⚠️ |
| **List NFT** | ESDTNFTTransfer → SC `listNft` | ~25M | Escrow NFT on SC | Adresse SC vérifiée mainnet? ⚠️ ; bootstrap sendTx ❌ |
| **Buy NFT** | `buyNft@id` + value EGLD | ~18M | Fee+royalty split | Listing ID à connaître (pas d’index UI) ❌ |
| **placeBid** | `placeBid@id` + EGLD | ~12M | Escrow bid | **SC redéployé requis** ; ABI FE à jour ⚠️ |
| acceptBid / withdrawBid | seller / bidder | — | | Pas d’UI FE encore ❌ |
| **Offer** | — | — | | **Pas d’endpoint** ✅ documenté |
| Cancel listing | `cancelListing` | — | | Pas d’UI FE ❌ |
| Buy agent | agents SC | — | | **SC non déployé** ❌ |
| claimFees | owner only | — | | 🔐 ops |
| Issue collection | ESDT system | ~60M + 0.05 EGLD | Nouvelle col | Studio = guide only ❌ mint auto |
| ESDTNFTCreate | system SC | ~20M | Mint | mxpy 🔐 |
| Swap DEX | xExchange/OneDex | ~30M | Trading | Pas de tx swap in-dApp ❌ (signaux + liens) |
| Hatom supply | Hatom SC | ~25M | Yield | Lien externe, pas tx in-dApp ⚠️ |
| MoonPay | fiat | 0 on-chain | On-ramp | OK externe |

### Chaîne de signature actuelle

```text
UI → useMarketplaceTx → useSendTransaction
  → window.__xartistsSendTx  (souvent ABSENT)
  → sinon erreur "SDK dapp non branché"
```

**Implication :** Buy/List/Bid affichent le flux mais **échouent sans bootstrap sdk-dapp**.

**Correction prioritaire P0 :** injecter `__xartistsSendTx` via DappProvider / sendTransactions sdk-dapp au boot.

---

## 3. Manques par persona

### Artiste
- ✅ Wizard Studio + IPFS policy + YouTube externe
- ❌ Upload Pinata depuis le navigateur (JWT secret → Vellum)
- ❌ Issue/mint one-click
- ⚠️ URI collée à la main

### Collectionneur
- ⚠️ Buy nécessite listing ID
- ❌ Index on-chain des listings actifs
- ❌ acceptBid UI vendeur
- ⚠️ Offer désactivé (correct)

### Trader
- ✅ Board limites / séries
- ❌ Exécution swap in-dApp
- 🔐 Live Vellum

### Ops
- ❌ agents_marketplace address
- ⚠️ Redeploy nft-marketplace (bid)
- 🔐 Pinata JWT, PEM mint

---

## 4. Corrections livrées / à livrer

| ID | Item | Statut |
|----|------|--------|
| G1 | agents SC deploy + VITE_ | ouvert P0 |
| G2 | sdk-dapp sendTx bootstrap | ouvert P0 |
| G3 | listing index / events API | ouvert P1 |
| G4 | placeBid après redeploy | code SC ✅ deploy ⚠️ |
| G5 | acceptBid/withdrawBid UI | ouvert P1 |
| G6 | cancelListing UI | ouvert P1 |
| G7 | BottomNav Studio | fix |
| G8 | Gas panel portfolio | fix |
| G9 | Manual wallet ≠ can sign banner | fix |
| G10 | Vellum next-run manifest | fix |
| G11 | marketplace ABI + placeBid | fix |

---

## 5. Vellum prochain run

Voir `data/VELLUM_NEXT_RUN.json` et `python -m lia.vellum.next_run`.
