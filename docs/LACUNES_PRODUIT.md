# Lacunes produit xArtists — Audit 29 juillet 2026

Inventaire des mécanismes **attendus mais absents ou incomplets**, distincts de la roadmap tech P0.

---

## 1. Burn $TRO à chaque vente NFT — ❌ MANQUANT on-chain

| Attendu | Réel |
|---------|------|
| À chaque `buyNft` / vente secondaire, un % de $TRO est brûlé (deflation) | Contrat marketplace actuel : `listNft` / `buyNft` / `cancelListing` uniquement — **aucun burn TRO** |
| Burn paramétrable (ex. 1–5 % du prix converti en TRO ou fixe en TRO) | Config `commissions` dans `data/config.json` a fees % mais **pas de clé `tro_burn_bps`** ni logique SC |

**Action requise :** étendre le SC marketplace (ou module) :
```
buyNft(listing_id) payable
  → transfer NFT buyer
  → fee seller / protocol
  → burn TRO (ESDT local burn ou send to dead address)
  → si escrow actif sur le nonce → revert
```

---

## 2. Vente bloquée si NFT en escrow — ❌ PARTIEL

| Attendu | Réel |
|---------|------|
| NFT locké en escrow phygital → **impossible de list/buy** jusqu’à unlock | Escrow demo (`demo-only-escrow`) : `lock` / `update` / `unlock` — **non branché** au marketplace mainnet |
| Check on-chain `isEscrowed(nonce)` avant list/buy | Marketplace ABI n’a pas de vue escrow |

**Action :** mapper `locked_nfts` escrow → require dans `listNft` / `buyNft`.

---

## 3. Achat en toute monnaie (multi-currency) — ❌ MANQUANT

| Attendu | Réel |
|---------|------|
| Payer en EGLD, USDC, WEGLD, **$TRO**, (plus tard sBTC) | `buyNft` payable générique mais UI = liens externes XOXNO uniquement |
| Prix listing multi-asset ou oracle conversion | Pas de `payment_token` dans listNft ABI exportée |

**Action :** `listNft(price, payment_token)` + router swap (xExchange) optionnel avant settlement.

---

## 4. Bouton Buy $TRO + page / onglet $TRO — 🟡 EN COURS (UI)

| Attendu | Réel avant ce commit | Après |
|---------|----------------------|-------|
| Onglet / page dédiée $TRO | Liens dispersés Trading / LP | **Page `/tro`** + nav Header |
| CTA « Buy TRO » clair | Lien xExchange dans LP seulement | Boutons OneDex + xExchange + JEXchange |

---

## 5. Affichage Liquidity Pool correct — 🟡 PARTIEL

| Attendu | Réel |
|---------|------|
| TVL / reserves pool TRO-EGLD (OneDex `erd1qqqq...sujc`) | LP page scanne **LP tokens du wallet LIA** — souvent vide si pas de position |
| Prix + APR pool | Pas de query reserves OneDex dans `apps/frontend` |

**Fix livré :** section « Pool OneDex TRO/EGLD » avec adresse config + fetch token price + lien DexScreener.

---

## 6. Hatom collateral numbers — 🟡 PARTIEL / FRAGILE

| Attendu | Réel |
|---------|------|
| Supplied / Borrowed / HF exacts | `useWalletTokens` → API `mainnet-api.hatom.com` **ou** fallback H-tokens wallet |
| Si API down → chiffres faux (HF 999, borrow 0) | Source badge « api » vs « wallet » présent mais collatéral peut être sous-estimé |

**Fix :** clarifier labels + ne jamais afficher HF 999 comme « Sûr » sans dette connue ; afficher « Non disponible ».

---

## 7. Autres confusions fréquentes

| Sujet | Clarification |
|-------|----------------|
| Marketplace dApp vs XOXNO | Galerie on-page ; achat réel encore **externalisé** XOXNO |
| Wallet connect | Mock / PEM lecture — **pas de signature tx réelle** sdk-dapp v2 |
| Commissions config | `marketplace_seller_fee_pct` etc. = **doc produit**, pas appliquées on-chain |
| Burn vs fee protocol | Fee ≠ burn ; burn doit détruire supply TRO |

---

## Priorisation produit (après P0 tech)

1. **Burn $TRO on sale** + **block if escrow** (même upgrade SC marketplace)
2. **Multi-currency buy** (EGLD + USDC + TRO minimum)
3. **Page $TRO** + Buy buttons ✅ (ce commit)
4. **LP TVL live** + **Hatom HF fiable**
5. Wire list/buy in-dApp (wallet réel)

---

*Neltud / Grok — 29 juillet 2026*
