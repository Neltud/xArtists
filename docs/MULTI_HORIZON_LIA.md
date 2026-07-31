# LIA — Décision multi-horizon + mémoire on-chain + boucle ouverte

## Objectif
Rendre la décision **aussi robuste que possible** (pas de promesse d’infaillibilité absolue) en forçant l’**alignement court / moyen / long terme**, une **cadence** d’achat-vente-accumulation, un **réinvestissement autonome**, et une **mémoire de toutes les txs** wallet LIA (API / explorer MultiversX).

---

## 1. Trois horizons

| Horizon | Échelle | Rôle | Intentions typiques |
|---------|---------|------|---------------------|
| **CT (short)** | min → heures | Circuit +1 % net / SL −1 % | BUY, SELL, WAIT, YIELD |
| **MT (medium)** | jours → semaines | Accumulation DCA | ACCUMULATE, HOLD, YIELD |
| **LT (long)** | mois | Allocation cible | REBALANCE, ACCUMULATE, HOLD |

### Fusion (veto de sécurité)
1. **SELL CT** prioritaire (protéger le capital).
2. **BUY CT** bloqué si MT/LT sont en **YIELD** fort (macro hostile).
3. Si CT = WAIT → **ACCUMULATE** MT/LT possible (DCA).
4. **≥ 2 horizons YIELD** → park stables.
5. **REBALANCE LT** hebdo si drift d’allocation > 8 %.

---

## 2. Allocation long terme (cibles)

| Asset | Poids cible |
|-------|-------------|
| USDC | 45 % |
| EGLD | 30 % |
| WBTC | 20 % |
| Buffer yield | 5 % |

**Jamais de hold TRO opérationnel** — redistribution policy.

---

## 3. Cadence achat / vente / accumulation

| Règle | Valeur |
|-------|--------|
| Min entre 2 trades CT | **30 min** |
| Max trades CT / jour | **8** |
| Intervalle DCA MT | **24 h** |
| Slice DCA | **5 %** du déployable |
| Rebalance LT | **7 jours** |
| Cooldown post-loss (circuit) | **15 min** |
| Cooldown post-win | **60 s** |

La cadence CT est aussi dérivée de la **mémoire on-chain** (`avg_gap_sec_swaps`, `last_swap_ts`).

---

## 4. Mémoire on-chain (explorer)

```
GET https://api.multiversx.com/accounts/{LIA}/transactions?size=100&withOperations=true
Explorer: https://explorer.multiversx.com/accounts/erd1p4zyy...
```

Module `lia/memory/onchain_memory.py` :
- classifie chaque tx : `swap | stake | claim | unstake | transfer | unknown`
- calcule success rate, gap moyen entre swaps, counterparties
- persiste `data/lia_onchain_memory.json`
- alimente le **pace guard** (pas de trade si dernier swap trop récent)

LIA « se souvient » de son historique réel blockchain, pas seulement des logs locaux.

---

## 5. Réinvestissement — boucle ouverte autonome

```
run_autonomous_cycle()
  → memory refresh
  → multi_horizon.decide()
  → reinvest.actions[]
       ST_TRADE | DCA_BUY | PARK_STABLE | REBALANCE | EXIT | SURPLUS_SPLIT
  → UniversalExecutor (paper/live)
  → compound streak + yield sleeve + TRO policy
```

**Ouverte** = pas de dépendance à un opérateur humain à chaque cycle ; les sorties sont des actions exécutables + état persisté (`data/lia_autonomous_state.json`).

Surplus d’un win CT : **70 % compound / 30 % yield** (déjà dans `compound_engine`).

---

## 6. Fichiers

| Path | Rôle |
|------|------|
| `lia/decision/multi_horizon.py` | Votes CT/MT/LT + fusion + plan réinvest |
| `lia/memory/onchain_memory.py` | Mémoire txs explorer |
| `lia/circuit/autonomous_loop.py` | Cycle autonome complet |
| `lia/circuit/compound_engine.py` | Streak +1 % / SL |
| `lia/policy/asset_policy.py` | EGLD/WBTC/USDC vs TRO |

---

## 7. Pourquoi ce n’est pas « infaillible » absolu

Les marchés restent adversariaux. Ce design maximise la **robustesse** :
- veto multi-horizon
- SL obligatoire
- cadence anti-overtrading
- mémoire on-chain (pas d’amnésie)
- halt après 3 losses
- yield par défaut si pas d’edge

L’edge reste dans la qualité des signaux + liquidité + discipline d’exécution.

*Neltud / Grok — 31 juillet 2026*
