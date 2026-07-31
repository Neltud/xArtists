# Circuit Financier Professionnel LIA / Vellum

**Objectif** : enchaîner jusqu’à **1000 trades à +1 % NET** en compounding, avec stop-loss obligatoire, surplus → rendement stable, vérification blockchain.

---

## 1. Réalité mathématique

| Métrique | Valeur |
|----------|--------|
| Cible nette / trade gagnant | **+1 %** |
|(1.01)^1000 | ≈ **20 959×** |
| Frais round-trip DEX (xExchange) | ~0,6 % |
| Gas + slippage buffer | ~0,3–0,7 % |
| **Gross minimum pour +1 % net** | **≈ 1,9–2,5 %** selon notional |

Le compounding pur suppose un **winrate élevé** et une **sérialisation** (1 position à la fois). Un winrate 55 % avec payoff 1:1 **ne** double pas le capital — d’où SL strict, filtre d’edge, et surplus hors boucle.

---

## 2. Architecture du circuit (phases)

```
IDLE → SIGNAL → DECIDE → PRE_VERIFY → EXECUTE → POST_VERIFY → SETTLE → SURPLUS → COOLDOWN → …
                 ↘ WAIT / YIELD
                 ↘ HALTED (3 losses d’affilée)
```

| Phase | Rôle |
|-------|------|
| **SIGNAL** | Stratégies MR / Momentum / Micro-arb + GreenSmoke |
| **DECIDE** | Brain + `CompoundCircuit.can_open` |
| **PRE_VERIFY** | Balance EGLD, nonce, liquidité pair (API MVX) |
| **EXECUTE** | UniversalExecutor (paper / live PEM) |
| **POST_VERIFY** | Status tx `success` + snapshot balances |
| **SETTLE** | TP (+1 % net) ou SL (−1 %) → update streak |
| **SURPLUS** | 30 % du profit → yield sleeve (USDC stake/LP/Hatom) |
| **COOLDOWN** | 60 s après win, 900 s après loss |

**Streak persisté** : `data/lia_compound_streak.json`  
**Tickets** : `data/lia_compound_tickets.json`

---

## 3. Risk management (non négociable)

| Règle | Paramètre |
|-------|-----------|
| Stop-loss | **−1 %** dès l’entrée |
| Break-even | après **+0,5 %** → SL à entry |
| Trailing | après **+0,8 %** → trail **0,4 %** sous HWM |
| Take-profit | gross ≥ fees + **1 % net** |
| Risk / trade | **2 %** du capital déployable (notional = risk / 1 %) |
| Max notional | 25 % déployable, cap USD configurable |
| Max losses consécutives | **3** → HALT automatique |
| Positions | **1** à la fois (compounding propre) |

---

## 4. Stratégies (pas « imbattables » — robustes)

1. **Mean-reversion liquide** (EGLD/USDC, WBTC/USDC) : prix ≤ VWAP −1,2 % et RSI ≤ 35, liquidité ≥ 50 k$.
2. **Momentum + régime** : +1h et +24h positifs, volume spike, GreenSmoke RISK_ON / BULLISH.
3. **Micro-arb DEX** : spread > 2,5 × frais round-trip.
4. **Yield-first** : si confiance trade < 0,65 → park USDC (stake/LP/Hatom) au lieu de forcer un trade.

Fusion : SELL prioritaire si conf ≥ 0,6 ; sinon meilleur BUY ≥ 0,62 ; sinon YIELD.

---

## 5. Compounding + surplus

Sur un **WIN** de PnL `$P` :

- **70 %** → `compound_equity` (reste dans la boucle de trade)
- **30 %** → `yield_sleeve` (rendement stable : Hatom USDC, LP majeurs, staking EGLD)

**TRO** : jamais accumulé par LIA — dès détection → `lia/policy/asset_policy.py` (pool 40 / stake 30 / rewards 20 / burn 10).

---

## 6. Signaux → décision → exécuteur → vérif

```
GreenSmoke + scanners ESDT + RSI/VWAP
        ↓
strategies.fuse_signals
        ↓
CompoundCircuit.can_open + UniversalBrain (profit_validated)
        ↓
verify_onchain.pre_trade_checks
        ↓
UniversalExecutor (swap)  [LIA_LIVE_TRADING=1 + PEM]
        ↓
verify_onchain.post_trade_checks (tx hash)
        ↓
on_tick chaque cycle → TP / SL
        ↓
close_trade → streak.save → surplus YIELD / TRO redistribute
```

Code :
- `lia/circuit/compound_engine.py` — streak, sizing, TP/SL, surplus
- `lia/circuit/strategies.py` — signaux
- `lia/circuit/verify_onchain.py` — API MultiversX
- `lia/circuit/vellum_cycle.py` — une itération Vellum
- `lia/risk/trailing_stop.py` — trailing avancé (complément)
- `lia/policy/asset_policy.py` — règle EGLD/WBTC/USDC vs TRO

---

## 7. Scénarios types

| Scénario | Flux |
|----------|------|
| **Win clean** | BUY → prix +2,2 % gross → TP → +1 % net → 70 % compound / 30 % yield → cooldown 60 s |
| **SL** | BUY → −1 % → fermeture forcée → consecutive_losses++ → cooldown 15 min |
| **BE puis trail** | +0,5 % → SL=entry ; +0,8 % → trail ; sortie trail encore verte |
| **3 losses** | HALT — intervention humaine / reset manuel streak |
| **RISK_OFF** | aucun BUY ; YIELD only |
| **TRO reçu** | redistribute immédiat, hors boucle compound |
| **Budget trop faible** | WAIT (min notional) |

---

## 8. Intégration Vellum (construction finale)

1. Cron existant (ex. toutes les 30 min) appelle `vellum_cycle.run_cycle`.
2. Inputs : market snapshot, portfolio, GreenSmoke regime.
3. Outputs : `event`, `ticket`, `surplus_action`, `health`.
4. Branche Executor live seulement si `mode=live` + pre_verify OK.
5. Node séparé `tro_redistributor` sur balance TRO.
6. Reporter : GitHub + Telegram sur HALT / chaque 50 wins.

---

## 9. Checklist « circuit pro »

- [x] Cible +1 % net + fees model
- [x] SL −1 % obligatoire + BE + trailing
- [x] Streak persisté + halt 3 losses
- [x] Surplus → yield sleeve
- [x] TRO non accumulé
- [x] Pre/post verify API
- [x] Stratégies filtrées liquidité / régime
- [ ] Wire Vellum node graph (import `vellum_cycle`)
- [ ] Live micro-tx validée (PEM)
- [ ] Dashboard lit `lia_compound_streak.json`

*Neltud / Grok — 31 juillet 2026*
