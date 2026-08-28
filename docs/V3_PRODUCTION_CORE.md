# v3.0 — Core production (MultiversX)

## Modules

| Couche | Fichier |
|--------|--------|
| Guardian | `src/core/doctrine.ts` |
| Provider | `src/services/multiversXService.ts` |
| Schema | `src/types/intent.ts` |
| Orchestrateur | `src/hooks/useLIA.ts` |

## Workflow

```
UI → useLIA.runNatural / runIntent
  → DoctrineEngine.validateIntent
  → MultiversXService.executeIntent
       → BALANCE_QUERY : API réelle
       → paper : success sans broadcast
       → live : signAndSend(wallet) → hash → monitorTransactionStatus (poll API)
```

## Interdits respectés

- Pas de `setTimeout` pour marquer une TX « success »
- Pas de `any` dans le flux intent
- UI ne parle pas au provider sans passer par useLIA / doctrine

## SWAP réel (testnet)

1. `VITE_MX_NETWORK=testnet`
2. `VITE_LIA_LIVE_TRADING=1`
3. Intent `paper:false` + `userConfirmedLive:true`
4. Fournir `signAndSend` branché sdk-dapp / extension
5. Route xExchange = ops (contrat pair) — jusqu’alors paper quote OK

## Demo SAFE aujourd’hui

```
runNatural("solde EGLD") → lecture API mainnet réelle
runNatural("swap 1 EGLD USDC") → doctrine + paper (pas de broadcast)
```
