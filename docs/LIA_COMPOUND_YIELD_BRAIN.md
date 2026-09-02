# Compound + Yield + Brain (mémoire on-chain)

## Compound (`lia/circuit/compound_engine.py`)

- Objectif : enchaîner trades à **+1 % net** (après fees).
- **tp_mode** : `log` (défaut) | `exp` | `ladder` | `fixed`.
- Sur gain : **70 %** → `compound_equity_usd` · **30 %** → `yield_sleeve_usd`.
- SL 1 % · BE · trailing · max 3 pertes consécutives → halt.

## Yield (`lia/circuit/yield_strategy.py`)

| Action | Quand |
|--------|--------|
| YIELD_DEPLOY | sleeve ≥ min, HF ok, pas DEFENSE |
| YIELD_HOLD | DEFENSE ou pas de venue |
| YIELD_WITHDRAW | HF < 1.5 |
| SKIP | pool trop petite |

Venues signal (paper) : Hatom lend · liquid stake · stable idle.

## Brain (`lia/circuit/compound_yield_brain.py`)

Entraîne le contexte Vellum avec **mémoire on-chain** (`lia/memory/onchain_memory.py`) :

- kinds TX (swap/stake/claim…)
- success_rate
- hours since last swap / cadence
- lessons heuristiques (pace, idle, success rate)

Sortie : `data/lia_brain_state.json`

```bash
python -m lia.circuit.compound_yield_brain
python -m lia.circuit.yield_strategy
```

`LIA_LIVE_TRADING=0` jusqu’à preuve micro (`docs/MICRO_PROOF.md`).
