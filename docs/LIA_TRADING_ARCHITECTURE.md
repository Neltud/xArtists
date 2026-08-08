# LIA × Vellum — architecture trading (organisation complète)

**Principe :** Guardian before Brain · paper-first · `LIA_LIVE_TRADING=0` jusqu’à micro-proof · mainnet only.

**Entrée unique cycle :** `python -m lia.vellum.pipeline`  
(legacy : `python -m lia.vellum.next_run` · `lia.vellum.orchestrator`)

---

## 1. Carte des modules (par couche)

```
┌──────────────────────────────────────────────────────────────────┐
│  PERCEPTION                                                      │
│  oracles/ · venues/onchain_feeds · board/arb · signals/          │
│  social_intel · gsn_leaderboard · gas/                           │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  COGNITION                                                       │
│  agents/mvx_agent · circuit/strategies · trading_modes           │
│  claude_agent/* (SignalBus, allocator, advisor)                  │
│  decision/ · decisions/policy                                    │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  GUARDIAN (avant size-up)                                        │
│  guardian/spiral · defense_circuit · risk/leverage_policy        │
│  risk/slippage · gas/micro_trade · risk/profit_lock              │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  EXECUTION PLAN (paper → live gated)                             │
│  circuit/trading_stack · risk/secure_tp · dynamic_trail          │
│  compound_engine · cross_chain_arb · bridge/latency              │
│  executor/* (PEM only si live=1)                                 │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  YIELD / DEFI (si pas d’edge trade)                              │
│  defi/hatom_* · xmex_compound · ashswap · placement_catalog      │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  PUBLISH / VELLUM                                                │
│  board/publish · oracles/publish · publish_data_for_frontend     │
│  vellum/pipeline · next_run · orchestrator                       │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Ordre d’un cycle Vellum (optimisé)

| # | Étape | Module | Skip si |
|---|--------|--------|---------|
| 0 | Bootstrap env | `pipeline` | chain ≠ 1 → abort |
| 1 | Oracles prix | `lia.oracles.publish` | — |
| 2 | Gas snapshot | `lia.gas.publish` | — |
| 3 | Feeds + board | `lia.board.publish` | — |
| 4 | Social watch (soft) | `signals/social_intel` | module absent |
| 5 | Agent decide | `agents.mvx_agent.decide` | — |
| 6 | Mode select | `circuit.trading_modes.select_mode` | — |
| 7 | **Guardian** | `vellum.guardian_hook` | — |
| 8 | TradingStack propose / on_price | `circuit.trading_stack` | DEFENSE / !guardian |
| 9 | Arb cross-chain scan | `trading_stack.scan_cross_arb` | paper only |
| 10 | Hatom / yield snapshot | `publish_hatom` | — |
| 11 | Mirror frontend | `publish_data_for_frontend` | — |
| 12 | Status + `vellum_last_run.json` | pipeline | — |
| 13 | Executor live | `executor.*` | **toujours skip si live=0** |

---

## 3. Modes (priorité)

Source : `lia/circuit/trading_modes.py`

1. **DEFENSE** — RISK_OFF / fear≤25 / DD≥12 % → pas de nouveau BUY  
2. **COMPOUND** — position ouverte → TP / trailing / profit_lock  
3. **MICRO_ARB** — spread > 2.5× fees, conf ≥ 0.62  
4. **MOMENTUM** — tendance + GSN bullish + pas de rumeur  
5. **MEAN_REVERSION** — VWAP + RSI + liquidité  
6. **YIELD** — pas d’edge → Hatom / stable  
7. **SOCIAL_WATCH** / **ADVISOR** — veille / Claude 1×/j (paper)

---

## 4. TradingStack — cœur risk

`lia/circuit/trading_stack.py` enchaîne **toujours** :

```
DEFENSE → leverage_policy → Guardian → slippage → micro_fee_skip
  → secure_tp (tp_mode=log) + dynamic_trail
  → profit_lock (70% lock / 30% compound)
  → optional cross_chain_arb (non-atomic, inventory-first)
```

| Module risk | Rôle |
|-------------|------|
| `profit_lock` | 70/30 lock/compound |
| `secure_tp` | TP log/exp/ladder + min net edge |
| `dynamic_trail` | ATR / step / break-even |
| `slippage` | impact + cap |
| `leverage_policy` | grille chain/venue |
| `spiral` | anti death-spiral levier |

---

## 5. Ce que LIA **ne** fait pas (encore / volontaire)

| Action | Condition |
|--------|-----------|
| Envoi TX PEM | `LIA_LIVE_TRADING=1` + micro-proof + signature |
| Bridge fonds user | Jamais auto |
| Mint $TRO | Owner token ≠ LIA |
| Grants Mission | Multisig / DAO, pas LIA |
| Buy agents SC | Deploy agents_marketplace |

---

## 6. Fichiers data produits

| Fichier | Producteur |
|---------|------------|
| `oracle_prices.json` | oracles.publish |
| `lia_board.json` | board.publish |
| `lia_v6_status.json` | orchestrator / pipeline |
| `lia_profit_lock.json` | TradingStack |
| `lia_trailing_state.json` | dynamic_trail |
| `vellum_last_run.json` | pipeline / next_run |
| `hatom_lia.json` | hatom publish |

---

## 7. Commandes

```bash
export LIA_LIVE_TRADING=0 CHAIN=1
python -m lia.vellum.pipeline          # cycle unifié (recommandé)
python -m lia.vellum.next_run          # legacy alias → pipeline
./scripts/vellum_board_cadence.sh      # oracles+board+mirror rapide
./scripts/run_regression.sh            # tests offline
```

---

## 8. Optimisations appliquées

| Avant | Après |
|-------|--------|
| next_run sans oracles / stack | pipeline ordonné oracles → modes → stack |
| orchestrator // TradingStack parallèles | stack appelé dans le cycle unifié |
| docs éparses | **cette architecture** + LIA_SPLIT + ORACLES + TRO |
| modes non reliés au run | `select_mode` dans pipeline |

---

## 9. Checklist ops LIA

- [ ] `LIA_LIVE_TRADING=0`  
- [ ] Oracles OK (`oracle_prices.json`)  
- [ ] Guardian `allow` lu dans `vellum_last_run`  
- [ ] Ledger profit_lock cohérent  
- [ ] SC market live avant tout fee narrative  
- [ ] Micro-trades user wallet avant live LIA  
