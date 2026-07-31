# dApp finale — timeouts, concurrence, wallets, cycle LIA

## Timeouts réseau

`src/services/network.ts` — `fetchWithTimeout` (défaut 15 s, 2 retries sur 408/429/5xx).

## Concurrence TX

`src/services/txQueue.ts` — file **FIFO par adresse**.

- `withTxLock(address, fn)` dans `useSendTx`
- `queue: false` → rejet immédiat si busy (`TX_CONCURRENCY`)

## Wallets

| Option | Provider |
|--------|----------|
| **xPortal** | WalletConnect V2 (`VITE_WALLETCONNECT_PROJECT_ID`) |
| **DeFi Wallet** | Extension navigateur |
| **Web Wallet** | wallet.multiversx.com |

Modal : `WalletModal` + `WalletConnect`.

## Bouton « Lancer le cycle LIA »

**Visible uniquement si** `address === LIA_WALLET` (case-insensitive).

- Utilisateur standard : **aucun** bouton cycle
- LIA ops connecté : panneau contrôle + webhook optionnel `VITE_LIA_CYCLE_WEBHOOK`

Helper : `src/utils/liaAuth.ts` → `isLiaWalletConnected()`.

## Env

```bash
VITE_WALLETCONNECT_PROJECT_ID=...
VITE_AGENTS_MARKETPLACE_ADDRESS=erd1...
VITE_LIA_CYCLE_WEBHOOK=https://...   # optionnel
```
