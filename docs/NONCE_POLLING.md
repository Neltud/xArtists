# Polling des nonces MultiversX

## Problème

Un nonce stale (compte sdk-dapp vs réseau) → rejet `WRONG_NONCE`. Les TX en série nécessitent un incrément local après sync réseau.

## API (`src/services/nonce.ts`)

| Fonction | Rôle |
|----------|------|
| `fetchAccountNonce(addr)` | Lecture unique API/gateway |
| `waitNonceStable(addr)` | 2 lectures identiques consécutives |
| `getFreshNonce(addr)` | Nonce prêt pour 1 TX |
| `waitNonceAdvanced(addr, used)` | Après broadcast : nonce réseau > used |
| `NonceTracker` | Batch multi-TX (`sync` → `next()` × N) |

## Hook `useNonce(address)`

- Poll périodique (défaut 12 s)
- `getNonceForTx()` avant build
- `getTracker()` pour list→buy enchaînés
- `waitAfterTx(usedNonce)` post-confirm

## `useSendTx`

1. Phase **building** : `getFreshNonce` + `setNonce` sur la TX  
2. Sign / broadcast  
3. Poll status TX  
4. `waitNonceAdvanced` si succès  

Option : `{ refreshNonce: true, waitNonceAdvance: true }` (défaut).

## Exemple batch

```ts
const tracker = await getTracker()
const n1 = tracker.next()
// build + send TX1 with n1
const n2 = tracker.next()
// build + send TX2 with n2
// on failure: await tracker.resetFromNetwork()
```
