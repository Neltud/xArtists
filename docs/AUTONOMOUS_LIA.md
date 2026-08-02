# Autonomous LIA (Vellum)

**Objectif** : produire du profit de façon autonome — compounding trades + yields.  
**PEM** : détenu uniquement dans les secrets Vellum (`LIA_WALLET_PEM_PATH` / `LIA_WALLET_PEM`). Jamais dans le repo.

## Pipeline

```
ErrorBus (halt?)
    ↓
SignalHub (STATARB + MR/MOM/ARB)
    ↓
Jupiter Latency Arb (quote TTL + re-quote + drift check)
    ↓
Symbiosis (brains + STATARB + Risk + Yield)
    ↓
Guards G01–G20 + CompoundCircuit (+1% net)
    ↓
MultiVenueExecutor (mvx / jupiter / hyperliquid)
    ↓
PerformanceReporter + streak JSON
    ↓
Surplus → yield sleeve
```

## Nœud Vellum

`nodes/autonomous_lia.py` → classe `AutonomousLia`

Inputs principaux :
- `market`, `portfolio`, `pairs_market`
- `brain_outputs` (optionnel, autres cerveaux parallèles)
- `force_mode`: `paper` (défaut) | `live`
- `enable_jupiter_arb`: true

## Jupiter latency arb

`lia/executor/jupiter_latency_arb.py`

| Param | Défaut | Rôle |
|-------|--------|------|
| max_quote_age_ms | 400 | rejette quote lente |
| max_drift_bps | 15 | abort si re-quote dérive |
| min_edge_bps | 25 | edge net min après fees |
| slippage_bps | 30 | serré pour arb |

Flux : scan → si edge OK → **re-quote** → si drift OK → execute (paper/live).

## Error bus

`lia/vellum/error_bus.py`

Classes : `transient` | `stale` | `risk` | `execution` | `config` | `fatal`

- 3 fails exécution consécutifs → **halt**
- RISK / FATAL → halt entries
- CONFIG (PEM manquant) → live bloqué, paper continue
- Persistance : `data/lia_error_bus.json`

## Symbiose

Stratégies enregistrées (+ nouvelles) :
- STATARB, JUPITER_ARB, CIRCUIT_1PCT, TP1/3/5, LIABrain, Contrarian, YieldAgent, RiskAgent

Priorité : Risk → SELL → STATARB/entries (budget cap 85 %) → Yield.

## Secrets Vellum (recommandé)

```
LIA_WALLET_PEM_PATH=...      # MultiversX PEM
LIA_LIVE_TRADING=0
LIA_SOL_LIVE=0
LIA_SOL_KEYPAIR_PATH=...
LIA_HL_LIVE=0
LIA_HL_PRIVATE_KEY=...
```

Passer `force_mode=live` **uniquement** après validation paper et secrets OK.

## Objectif profit

1. Trades circuit +1 % net (compound 75 %)
2. StatArb pairs mean-reversion
3. Micro-arb Jupiter si latence / edge le permet
4. Idle capital → yield (Hatom / stables)
5. Jamais hold TRO ; redistribute policy

---
*LIA autonome — xArtists / Vellum*
