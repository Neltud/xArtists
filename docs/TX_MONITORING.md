# Monitoring transactionnel

## Modules

| Fichier | Rôle |
|---------|------|
| `services/transactionMonitor.ts` | Poll API MVX · historique · events |
| `services/multiversXExecutionAdapter.ts` | Broadcast injecté (pas de fake success) |
| `components/TxMonitorPanel.tsx` | UI watch hash + statut |
| `hooks/useLIA.ts` | Après `broadcast` → `transactionMonitor.watch` |

## Flux

```
broadcast → txHash
  → transactionMonitor.watch(hash, network)
  → GET api.multiversx.com/transactions/{hash} toutes les 3s
  → success | fail | timeout (~3 min)
  → UI TxMonitorPanel + lifecycle useLIA
```

## Règles

- Hash contenant `FAKE` → fail immédiat
- Pas de `setTimeout` qui force success
- Vellum orchestre ; exécution = MultiversX
