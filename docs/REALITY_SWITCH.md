# Reality Switch — simulation → live

> **État public (2026-08-30)** : demo [GO_DEMO / paper LIA](https://neltud.github.io/xArtists/) · `LIA_LIVE_TRADING=0` · packs = Pulse · Yield · Sentinel · Art Tours = service CULTURE (pas un pack agent) · SC market/agents : `codeHash` null.
>
> Ce document décrit le **chemin UX** paper → live. Il ne déclare **pas** le trading live allumé. Pas de gasless live, pas de swap auto non déployé.

## Objectif

L’utilisateur doit **percevoir** le passage de la simulation à la réalité blockchain. Le switch n’est pas un skin : c’est un contrat d’honnêteté (pas de fake-success).

Wallet **utilisateur** ≠ wallet **LIA ops**. Voir [`LIA_VS_USER_WALLET.md`](LIA_VS_USER_WALLET.md) et [`USER_WALLET.md`](USER_WALLET.md).

---

## 1. Indicateur de mode (status bar)

| Mode | Couleur | Icône | Texte | Quand |
|------|---------|-------|-------|--------|
| **SIMULATION / PAPER** (actuel) | Cyan / bleu | Ghost / circuit | `[MODE SIMULATION — PAPER]` | Défaut. `LIA_LIVE_TRADING=0` |
| **LIVE** (cible) | Vert émeraude / or | Shield / wallet | `[MODE LIVE — WALLET CONNECTED]` | Uniquement si env live **et** wallet user connecté **et** `userConfirmedLive` **et** doctrine OK |

Dès la connexion wallet, légère variation de lueur = « tes actifs, pas le desk paper LIA ». Ça n’active **pas** le trading live.

Fail-closed : si un flag manque, rester paper. L’UI ne passe jamais en Success sans hash confirmé (voir [`LIVE_EXECUTION_SPECS.md`](LIVE_EXECUTION_SPECS.md)).

---

## 2. MVP live (chemin, pas encore allumé)

### A. Connexion wallet (MultiversX)

Déjà en place (lecture / session) — [`WALLET_CONNECT_LIVE.md`](WALLET_CONNECT_LIVE.md) :

- Web Wallet redirect
- Extension DeFi
- xPortal deep link
- Coller `erd1` = **lecture seule** (pas de signature)

WalletConnect QR end-to-end = encore à durcir (sdk-dapp LoginButton). Connect **seul** n’ouvre pas List/Buy (codeHash null).

### B. Asset Hub / Asset Drawer

Panneau coulissant : tokens ESDT + NFTs de l’adresse **connectée**, sans quitter LIA. Skeleton loaders pendant le fetch indexer. Jamais le wallet ops LIA présenté comme « le tien ».

### C. Boucle agentique (intent → sign → chain)

```
Intention (⌘K / NL) → TransactionGuardian → signature wallet USER → TransactionWatcher → UI
```

- LIA **prépare** la tx. L’utilisateur **signe**.
- Success UI **uniquement** après confirmation réseau (hash).
- Interdit : `setTimeout` « success », gasless live non déployé, swap auto non déployé.

---

## 3. Gates (rappel)

Live seulement si **tous** vrais :

1. `LIA_LIVE_TRADING=1` / `VITE_LIA_LIVE_TRADING=1`
2. `userConfirmedLive`
3. Doctrine / Guardian OK
4. `signAndSend` wallet **user** (pas PEM LIA dans le front)
5. `codeHash` ≠ null pour market / agents

Aujourd’hui : **1 = 0**. Paper.

Suite sprints : [`ROADMAP_TRUST_INFRA.md`](ROADMAP_TRUST_INFRA.md).
