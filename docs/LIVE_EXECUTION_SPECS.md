# Specs d’exécution — data layer & anti fake-success

> **État public (2026-08-30)** : paper / GO_DEMO · `LIA_LIVE_TRADING=0` · packs Pulse · Yield · Sentinel. Ces specs éliminent la dette « fake-success ». Elles ne déploient pas le live trading.

Stack front : Vite `apps/frontend` (pas Next.js). Wallet via sdk-dapp existant — voir [`USER_WALLET.md`](USER_WALLET.md), [`SPRINT1_ANCRAGE_VERITE.md`](SPRINT1_ANCRAGE_VERITE.md).

---

## 1. Architecture services (data layer)

### Hook `useMultiversX`

Rôle : état wallet **utilisateur** (jamais l’adresse ops LIA en session user).

| API | Détail |
|-----|--------|
| `connect()` / `disconnect()` | Web Wallet, extension, xPortal ; paste `erd1` = read-only |
| `getBalances()` / `getNFTs()` | Adresse connectée uniquement |
| `status` | `'disconnected' \| 'connecting' \| 'connected' \| 'error'` |

Mapping actuel : `WalletContext` + `useUserAccount` + `useWalletTokens`. Le hook unifie ; il ne remplace pas le reject « LIA protocol address never as user session ».

### Service `AssetService`

- Fetch **officiel** MultiversX (API / indexer) — pas de mock soldes en mode connected.
- Tokens ESDT, MultiESDT, NFTs ; fraîcheur > surcharge.
- Erreurs réseau = état error + retry, pas un solde inventé.

### Module `TransactionGuardian`

Intercepte **chaque** intention IA avant signature.

| Check | Règle |
|-------|--------|
| Montant | `> 0`, atomique (pas de float humain brut) |
| Destination | `erd1` valide · anti-scam (pas d’adresse ops LIA comme dest « user ») |
| Slippage | Borné ; reject si hors doctrine |
| Mode | Paper si live gates incomplets |
| Signature | Wallet **user** uniquement |

Workflow : `User Intent → Guardian → Wallet Signature → Blockchain`.

---

## 2. Remédiation du pattern « fake-success »

**Interdit** : `setTimeout` qui passe l’UI en Success.

**Remplacement** : `TransactionWatcher`

1. État `PENDING` tant que pas de hash.
2. Écoute réseau (API tx / event) `PENDING → SUCCESS | FAIL`.
3. Success UI **seulement** si hash confirmé.
4. Fail = message + lien explorateur si hash connu.

Paper : succès **explicitement** étiqueté `PAPER` — jamais le chrome LIVE.

---

## 3. UI — Asset Drawer

- Slide-over : tokens + NFTs sans quitter le chat LIA / ⌘K.
- Skeleton loaders (pas de layout shift).
- Source = adresse connectée. Bandeau si lecture seule (paste).
- Connect n’active pas Buy/List tant que `codeHash` null.

---

## 4. Hors scope (ne pas promettre)

- Gasless live
- Swap auto non déployé
- Trading live (`LIA_LIVE_TRADING` reste 0)
- Art Tours comme pack agent (service CULTURE séparé)
