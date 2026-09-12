# GrokyversX — stratégies unifiées (héritage LIA + signaux)

## Stack

| Source | Usage |
|--------|--------|
| **S1** Preservation | Réserve gas · risk % · bloque si réserve faible |
| **S2** Signal sleeve | Fusion GSN-style + momentum → BUY/SELL/WAIT |
| **S3** TRO DCA | 1–2×/semaine si BUY fort |
| **Momentum ESDT** | TP **+1,7 %** / SL **−1 %** sur position |
| **Externe** | `/economics` (prix EGLD, APR, staked ratio) + prix token API |
| **GSN labels** | Elite MVX / Alpha Macro (fusion, pas custody GSN) |

## Run

```bash
cd packages/grok-daily-trader
GROK_MODE=paper GROK_LIVE_TRADING=0 python3 strategies/unified_orchestrator.py
```

## Live

Uniquement si `GROK_LIVE_TRADING=1` **et** plan ≠ idle **et** routes swap/Hatom OK.  
Hatom HTM supply peut être **cap-bloqué** (vu 2026-09-12).
