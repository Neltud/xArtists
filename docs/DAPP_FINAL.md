# xArtists dApp — version finale (ops LIA)

## Règle critique : cycle LIA

Le bouton **« Lancer le cycle LIA »** :

- **N’apparaît PAS** pour un utilisateur standard (wallet quelconque connecté ou non)
- **Apparaît UNIQUEMENT** si l’adresse connectée === `LIA_WALLET`
  (`erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6`)

Implémentation : `isLiaWalletConnected()` dans `src/utils/liaAuth.ts` + rendu conditionnel dans `DashboardPage`.

Les cycles automatiques restent pilotés par **Vellum cron** — pas de trigger public.

## Wallet connect

| Provider | UI | Config |
|----------|-----|--------|
| **xPortal** | WalletConnect v2 | `VITE_WALLETCONNECT_PROJECT_ID` |
| **DeFi Wallet** | Extension | navigateur |
| **Web Wallet** | redirect | wallet.multiversx.com |

Fichiers : `WalletModal.tsx`, `WalletConnect.tsx`, `main.tsx` (`DappProvider`).

## Timeouts réseau

`src/services/network.ts`

- `fetchWithTimeout` — AbortController, défaut **15 s**, retries 2
- Codes HTTP retriables : 408, 429, 5xx
- `NetworkTimeoutError` / `NetworkError`

Utilisé par : nonce poll, waitTxStatus, webhook cycle LIA.

## Concurrence TX

`src/services/txQueue.ts`

- File **FIFO par adresse** (singleton)
- `useSendTx` enqueue chaque send → pas de double nonce
- `withTxLock(..., { queue: false })` → rejet immédiat si busy
- Code erreur `TX_CONCURRENCY`

## Stack TX complète

```
preflight → txQueue → nonce stable → sign (xPortal/ext/web)
  → broadcast → poll status (timeout) → wait nonce advance
```

## Env

```
VITE_WALLETCONNECT_PROJECT_ID=...
VITE_AGENTS_MARKETPLACE_ADDRESS=erd1...   # post-deploy
VITE_LIA_CYCLE_WEBHOOK=https://...        # optionnel, ops only
```
