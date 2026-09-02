# Sprint 2 — Le Métabolisme (Liquidity & Swaps)

## Livré

| Mission | Fichier |
|---------|--------|
| Pools + price feeds | `src/services/liquidityService.ts` |
| Best route | `src/services/aggregatorService.ts` |
| Types SWAP / LP | `src/types/intent.ts` |
| Quote pendant frappe | `SwapQuoteStrip` dans IntentBar ⌘K |

## Comportement

- Quotes **paper** (référence + economics EGLD API).
- Comparaison xExchange vs OneDex **simulée** pour ranking.
- Aucun swap broadcast tant que Sprint 1 live gates non ouverts.

## Test manuel

1. ⌘K → `swap 1 EGLD USDC`
2. Voir quote + route + impact bps
3. Exécuter → navigation / paper (pas de TX auto)

## Suite Sprint 3

`strategyEngine` · `marketWatcher` · notifications — après validation quotes.
