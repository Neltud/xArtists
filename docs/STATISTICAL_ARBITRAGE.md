# Statistical Arbitrage (StatArb) — LIA v6+ (paramètres optimisés)

> Objectif: rendre LIA aussi compétente que possible — plus d’edges valides, winrate élevé, risk serré.

## Calibrage actuel (compétence max)

### StatArbConfig

| Paramètre | Valeur | Raison |
|-----------|--------|--------|
| `entry_z` | **1.85** | Plus d’opportunités qu’à 2.0, toujours sélectif |
| `soft_entry_z` | **1.50** | Zone soft contrôlée |
| `exit_z` | **0.25** | Sortie plus proche de la mean |
| `max_half_life_h` | **24 h** | Préférer mean-reversion rapide |
| `min_liquidity_usd` | **60 000** | Moins de slippage |
| `min_cointegration` | **0.62** | Filtre qualité |
| `min_samples` | **8** | Évite z bruités au boot |
| `ewma_alpha` | **0.06** | Mean/std plus stables |

Confiance boostée si half-life ≤ 8–14 h et coint ≥ 0.70–0.80.

### CircuitConfig (Compound)

| Paramètre | Valeur | Raison |
|-----------|--------|--------|
| `target_net_pct` | 1.0 % | Inchangé |
| `stop_loss_pct` | **0.9 %** | Légèrement plus serré |
| `be_trigger_pct` | **0.4 %** | BE plus tôt |
| `trail_after_pct` | **0.6 %** | Trailing plus tôt |
| `trail_pct` | **0.35 %** | Trailing plus serré |
| `risk_per_trade_pct` | **1.5 %** | Conservateur |
| `max_deployable_pct` | **22 %** | Cap de taille |
| `base_compound_fraction` | **75 %** | Plus de capital compoundé |
| `surplus_fraction` | 25 % | Yield sleeve |
| `max_consecutive_losses` | **2** | Halt plus strict |
| `cooldown_after_win` | **45 s** | Multi-cycles / jour |
| `cooldown_after_loss` | **20 min** | Pause après drawdown |

### Fusion des signaux

```
STATARB > ARB > MR > MOM > YIELD
```

- SELL dès confiance ≥ **0.55** (protection capital)
- BUY STATARB dès **0.55**, ARB dès **0.57**, autres dès **0.62**

### StatArbBrain

- Budget allocation **30 %**
- Scale ×1.15 si confiance ≥ 0.80
- HF Hatom minimum **1.8**
- Pause totale en `RISK_OFF`

## Philosophie

1. **Sélectivité** sur la qualité de la paire (liq, half-life, coint)
2. **Réactivité** sur la gestion de position (BE / trailing)
3. **Discipline** sur le risk (1.5 %, halt 2 pertes, cooldown)
4. **Fréquence** contrôlée (cooldown win 45 s → plusieurs cycles/jour si edge)
5. **Compounding** prioritaire (75 % des gains restent dans la boucle)

## Tests

```bash
python tests/test_statarb.py
python tests/test_lia_circuit.py
```

---
*LIA v6+ — calibrated for competence — xArtists / MultiversX*
