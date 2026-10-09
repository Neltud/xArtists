# DeFi Hub — Hatom · AshSwap · Soul

## Architecture

```
src/services/defi/
  types.ts           PreparedTx, Health Factor (≥ 1.4)
  hatomBuilder.ts    supply / withdraw / borrow / repay
  ashswapBuilder.ts  addLiquidity stable, stake LP
  soulBuilder.ts     placeholder (MVX SC pending)

src/components/defi/DeFiCommandPanel.tsx  → Command Center
```

## Adresses mainnet (docs publiques)

| Protocole | SC / note |
|-----------|-----------|
| Hatom EGLD market | `erd1…jleq3` |
| Hatom USDC market | `erd1…4aldu` |
| AshSwap stable pool | `erd1…hfyd9c` |
| Soul | deep-link `soul.io` — pas de router MVX dans le repo |

## Flux UX

1. Utilisateur choisit protocole + montant
2. Builder génère `PreparedTx` (receiver, data, value, gas)
3. **Copier payload** ou future `signTransactions` xPortal
4. Signature **manuelle** — xArtists ne custody pas

## LIA

LIA reste **paper / analyse**. Les TX DeFi sont user-signed only.
