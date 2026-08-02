# Statistical Arbitrage (StatArb) — LIA v6+

> Intégration de l'arbitrage statistique (pairs trading / z-score) dans le cerveau LIA et le circuit de compounding +1 % net.

## Objectif

Améliorer le **winrate** et la fréquence des edges exploitables tout en restant compatible avec le `CompoundCircuit` (cible +1 % **net** après frais).

## Principe

1. Suivre des **paires liquides** (ex. WEGLD/USDC, WBTC/USDC).
2. Calculer le spread logarithmique :  
   `spread = log(P_a) − hedge_ratio × log(P_b)`
3. Maintenir mean / std en ligne (EWMA) → **z-score**.
4. Estimer la **half-life** (vitesse de mean-reversion).
5. Signaler **BUY** (leg A undervalued) si `z ≤ −2`, **SELL** si `z ≥ +2`.
6. Ne trader que si :
   - liquidité suffisante
   - half-life < seuil (défaut 36 h)
   - score de coïntégration proxy ≥ 0.55
   - le trade peut encore viser +1 % net après fees (validation CompoundCircuit)

## Fichiers

| Fichier | Rôle |
|---------|------|
| `lia/circuit/statistical_arbitrage.py` | Module complet (signal + PairBook) |
| `lia/circuit/strategies.py` | `fuse_signals` priorise STATARB |
| `lia/circuit/compound_engine.py` | Accepte les tickets STATARB |
| `nodes/statarb_brain.py` | Nœud Vellum dédié |
| `nodes/universal_brain_unified.py` | Enrichi (inputs pairs) |
| `data/lia_statarb_pairs.json` | Persistance z-score / half-life |
| `tests/test_statarb.py` | Tests unitaires |

## Priorité des stratégies (fuse)

```
STATARB > Micro-ARB > Mean-Reversion > Momentum > Yield
```

Les SELL à confiance ≥ 0.6 restent prioritaires (protection capital).

## Paramètres clés (`StatArbConfig`)

| Paramètre | Défaut | Commentaire |
|-----------|--------|-------------|
| `entry_z` | 2.0 | Seuil fort |
| `soft_entry_z` | 1.7 | Zone soft (confiance plus basse) |
| `exit_z` | 0.35 | Cible de sortie (vers mean) |
| `max_half_life_h` | 36 | Au-delà → trop lent pour +1 % court |
| `min_liquidity_usd` | 40 000 | Par jambe |
| `min_cointegration` | 0.55 | Proxy 0–1 |

## Intégration Compounding

- Le `CompoundCircuit` reste le maître : sizing, SL −1 %, trailing, surplus 30 %.
- Les tickets issus de STATARB portent `meta.strategy = "STATARB"`.
- TP peut être légèrement assoupli (0.8 %–1.5 % net) si le z-score est très fort et la half-life courte, tout en gardant le required_gross validé.

## Flux Vellum typique

```
GreenSmoke / Price feeds
        ↓
PairBook.update(...)          # data/lia_statarb_pairs.json
        ↓
StatArbBrain (ou UniversalBrain)
        ↓
fuse_signals([...])
        ↓
CompoundCircuit.open_trade / on_tick / close_trade
        ↓
Guards + on-chain verify
```

## Risques spécifiques StatArb

- Divergence prolongée (le spread ne revient pas)
- Changement de régime / rupture de coïntégration
- Half-life qui s’allonge
- Frais + slippage qui mangent l’edge sur petites notional

Les guards existants (max consecutive losses, RISK_OFF, HF Hatom, drawdown) restent actifs.

## Prochaines améliorations possibles

- Test de coïntégration formel (Engle-Granger / Johansen) offline
- Hedge ratio dynamique (Kalman)
- Multi-asset basket (plus de 2 jambes)
- Bucket parallèle limité pour plusieurs pairs simultanés

---
*LIA v6+ — Statistical Arbitrage module — xArtists / MultiversX*
