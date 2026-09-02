# LIA — Modes de trading + signaux sociaux

Modules : `lia/signals/social_intel.py`, `lia/circuit/trading_modes.py`, `lia/circuit/mode_orchestrator.py`.

## Modes

| Mode | Déclencheurs (résumé) | Stratégies autorisées | Notional max |
|------|----------------------|----------------------|--------------|
| **DEFENSE** | RISK_OFF, fear≤25, DD≥12%, rumeur SELL | SELL, YIELD, HOLD | 0 new BUY |
| **YIELD** | fuse YIELD / conf\<0.62 | YIELD, HOLD | 50 USD |
| **MICRO_ARB** | ARB conf≥0.62, spread\>2.5×fees | ARB | 40 USD |
| **MEAN_REVERSION** | MR BUY + liq + pas RISK_OFF | MR, SELL, HOLD | 30 USD |
| **MOMENTUM** | MOM + GSN bullish + pas rumeur | MOM, SELL, HOLD | 25 USD |
| **COMPOUND** | position ouverte + tp_mode | SELL, HOLD | manage only |
| **ADVISOR** | schedule daily Claude | HOLD (journal) | 0 |
| **SOCIAL_WATCH** | timer / cycle | HOLD | 0 |

Priorité de sélection : DEFENSE → COMPOUND → MICRO_ARB → MOMENTUM → MR → YIELD → SOCIAL_WATCH.

## Social

1. Items offline : `data/social_feed.json` (voir example).  
2. Watchlist : `data/social_watchlist.json`.  
3. Sortie : `data/social_intel.json`.  
4. `weight_cap=0.15` ; **rumor → bloque BUY**.  
5. Blend **après** fuse on-chain ; SELL LIA conf≥0.6 **protégé**.

Fetchers X/Reddit : injectables (secrets Vellum) — pas de tokens dans le repo.

## Orchestrateur Vellum

```bash
python -m lia.circuit.mode_orchestrator
# ou
python -c "from lia.circuit.mode_orchestrator import run_cycle; print(run_cycle(price=10, rsi_14=30, vwap_24h=10.2))"
```

Puis toujours : `LIA_LIVE_TRADING=0` + `should_skip_micro_trade` avant tout broadcast.

## Veille permanente

- Cadence recommandée : **5–15 min** (mode SOCIAL_WATCH + refresh feed).  
- Chaque cycle : social run → fuse → mode → `data/lia_mode_cycle.json`.  
- Claude ADVISOR : 1×/jour, `auto_execute=False`.
