# Optimisation gaz — micro-trades LIA (MultiversX)

## Principe

Sur MVX, le coût ≈ `gas_limit × gas_price × modifier` (SC). Un micro-trade de **$2** avec un `gas_limit` de 30M peut **manger tout l’edge**.

## Leviers

| Levier | Action |
|--------|--------|
| **gas_limit calibré** | Table micro &lt; table « safe deploy » ; jamais 200M pour un swap |
| **Simuler avant send** | Gateway `/transaction/cost` (ou mxpy gas-limit estimate) → margin 15–25 % |
| **Min notional** | Skip si `notional_usd < max(3× gas_usd, MIN_NOTIONAL)` |
| **Gas / edge** | Skip si `gas_usd > EDGE_FRAC × expected_edge_usd` |
| **Venue simple** | Préférer 1 hop xExchange vs route multi-DEX |
| **Fréquence** | Cap déjà 48 trades/jour ; micro = moins de noise |
| **gas_price** | Rester sur `erd_min_gas_price` (pas de premium) sauf congestion |
| **Batching** | 1 decision cycle → au plus N micro-tx ; pas de spam block |

## Table gas_limit recommandée (micro)

| Op | gas_limit | Note |
|----|-----------|------|
| transfer EGLD | 50_000 | — |
| ESDT transfer | 500_000 | — |
| swap simple (1 pair) | **12_000_000 – 18_000_000** | calibrer via cost API |
| multi-hop / complex | 25_000_000 – 35_000_000 | éviter en micro |
| Hatom supply | 20_000_000 – 25_000_000 | pas « micro » scalp |
| deploy SC | 200M+ | hors micro-trade |

## Env Vellum

```bash
LIA_LIVE_TRADING=0
MICRO_MIN_NOTIONAL_USD=5
MICRO_MAX_GAS_FRAC_OF_NOTIONAL=0.15   # gas ≤ 15% notional
MICRO_GAS_LIMIT_SWAP=15000000
MICRO_COST_MARGIN=1.20                 # +20% over simulated cost units
```

## Règle executor

```text
if gas_usd > MICRO_MAX_GAS_FRAC * notional_usd: SKIP
if notional_usd < MICRO_MIN_NOTIONAL_USD: SKIP
if expected_edge_usd < 2 * gas_usd: SKIP
```
