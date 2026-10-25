---
hidden: true
noIndex: true
---

# Optimisation gaz — micro-trades LIA (MultiversX)

## Principe

Sur MVX, le coût ≈ `gas_limit × gas_price × modifier` (SC). Un micro-trade de **$2** avec un `gas_limit` de 30M peut **manger tout l’edge**.

## Leviers

| Levier                 | Action                                                                    |
| ---------------------- | ------------------------------------------------------------------------- |
| **gas\_limit calibré** | Table micro < table « safe deploy » ; jamais 200M pour un swap            |
| **Simuler avant send** | Gateway `/transaction/cost` (ou mxpy gas-limit estimate) → margin 15–25 % |
| **Min notional**       | Skip si `notional_usd < max(3× gas_usd, MIN_NOTIONAL)`                    |
| **Gas / edge**         | Skip si `gas_usd > EDGE_FRAC × expected_edge_usd`                         |
| **Venue simple**       | Préférer 1 hop xExchange vs route multi-DEX                               |
| **Fréquence**          | Cap déjà 48 trades/jour ; micro = moins de noise                          |
| **gas\_price**         | Rester sur `erd_min_gas_price` (pas de premium) sauf congestion           |
| **Batching**           | 1 decision cycle → au plus N micro-tx ; pas de spam block                 |

## Table gas\_limit recommandée (micro)

| Op                   | gas\_limit                      | Note                  |
| -------------------- | ------------------------------- | --------------------- |
| transfer EGLD        | 50\_000                         | —                     |
| ESDT transfer        | 500\_000                        | —                     |
| swap simple (1 pair) | **12\_000\_000 – 18\_000\_000** | calibrer via cost API |
| multi-hop / complex  | 25\_000\_000 – 35\_000\_000     | éviter en micro       |
| Hatom supply         | 20\_000\_000 – 25\_000\_000     | pas « micro » scalp   |
| deploy SC            | 200M+                           | hors micro-trade      |

## Env Vellum

```bash
LIA_LIVE_TRADING=0
MICRO_MIN_NOTIONAL_USD=5
MICRO_MAX_GAS_FRAC_OF_NOTIONAL=0.15   # gas ≤ 15% notional
MICRO_GAS_LIMIT_SWAP=15000000
MICRO_COST_MARGIN=1.20                 # +20% over simulated cost units
```

## Règle executor

```
if gas_usd > MICRO_MAX_GAS_FRAC * notional_usd: SKIP
if notional_usd < MICRO_MIN_NOTIONAL_USD: SKIP
if expected_edge_usd < 2 * gas_usd: SKIP
```
