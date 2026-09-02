# Parcours utilisateurs xArtists — interlocuteurs

## 1. Artiste (créer & monétiser)

**Objectif :** publier une collection/album et minter des œuvres (image, vidéo, audio) numériques ou phygital.

| Étape | Action | Où |
|-------|--------|----|
| 1 | Connecter **son** wallet (pas le wallet LIA) | Header Connect |
| 2 | Ouvrir **Artist Studio** `/studio` | Créer collection / album |
| 3 | Choisir type média + digital vs physique | Formulaire |
| 4 | Préparer media + metadata (nom, royalties) | IPFS/Arweave off-dApp si gros fichiers |
| 5 | Estimer **gaz** (issue + mint) | Panneau frais |
| 6 | Signer txs mainnet | Wallet |
| 7 | Lister sur Marketplace (Sell) ou XOXNO | `/marketplace` |

**Phygital :** NFT = certificat ; livraison physique hors chaîne (escrow / process artiste).

---

## 2. Collectionneur / acheteur

| Étape | Action |
|-------|--------|
| 1 | Explorer Galerie / Marketplace |
| 2 | Voir détail → Buy / Bid (listing) |
| 3 | Option MoonPay → EGLD |
| 4 | Wallet signe buyNft ou placeBid |

**Offer :** pas d’endpoint on-chain — utiliser Bid sur un listing.

---

## 3. Trader / LIA follower

| Étape | Action |
|-------|--------|
| 1 | `/trading` Board (arb, limites, séries) |
| 2 | `/portfolio` scénarios 365j + gaz |
| 3 | Signaux JSON Vellum (pas de PEM dans le navigateur) |

**Limite :** max 48 trades/jour · block-time arb ≠ HFT CEX.

---

## 4. Yield / DeFi

| Étape | Action |
|-------|--------|
| 1 | `/hatom` positions |
| 2 | Lien app.hatom.com pour supply |
| 3 | LIA sleeve 30 % wins → yield narrative |

---

## 5. Opérateur Vellum

```text
publish board + gas table + hatom
orchestrator LIA_LIVE_TRADING=0
Sprint A deploy agents SC
```

---

## Gaz — ordre de grandeur (estimations)

Voir `python -m lia.gas.mvx_gas` — issue collection et mint sont les plus chers côté artiste ; swap/list/buy côté trading.
