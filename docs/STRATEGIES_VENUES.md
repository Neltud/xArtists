# Strategies & venues — inventory

## Core strategies (`lia/circuit/strategies.py`)

| Strategy | Edge | Status |
|----------|------|--------|
| Mean-reversion | VWAP ±1.2% + RSI | Live logic |
| Momentum + regime | 1h/24h + GreenSmoke | Live logic |
| Micro-arb | 2 DEX mids, spread > 2.5× fees | Live logic |
| Yield-first | conf < 0.65 → YIELD | Live logic |
| TP curves | fixed/log/exp/ladder | Integrated compound |

## MultiversX

| Venue | Category | Status | LIA use |
|-------|----------|--------|--------|
| **xExchange** | DEX | partial | Swaps, arb leg, prices |
| **OneDex** | DEX | partial | TRO/EGLD LP, arb leg |
| **Hatom** | Lending | partial | yield_sleeve; UI wallet proxy |
| **XOXNO** | NFT | partial | External buy only — not +1% circuit |
| AshSwap | DEX stable | planned | Stable yield candidate |

## Solana

| Venue | Status | Notes |
|-------|--------|-------|
| **Jupiter** | planned | Quote API stub; no SOL executor key |
| Raydium | planned | Secondary mid for arb |

## Hyperliquid

| Note |
|------|
| **Not Solana** — own L1 perps |
| Status: planned funding/hedge signals only |
| Separate risk budget from MVX spot compound |

## Soul Protocol (future)

| Function | Status |
|----------|--------|
| `soul_yield_opportunity` | stub |
| `soul_restake_intent` | stub |
| `soul_signal` | stub (WAIT until ENABLED) |
| soulbound credit check | planned |
| cross-chain sleeve route | planned |

Enable: `lia/venues/soul.py` → `ENABLED = True` + `api_base` when published.

## Code map

```
lia/venues/registry.py      catalog
lia/venues/mvx.py           xExchange/OneDex/Hatom/XOXNO
lia/venues/solana.py        Jupiter
lia/venues/hyperliquid.py   funding signal
lia/venues/soul.py          future hooks
lia/circuit/strategies_venues.py  fuse core + venues
```

```bash
python -m lia.circuit.strategies_venues
```
