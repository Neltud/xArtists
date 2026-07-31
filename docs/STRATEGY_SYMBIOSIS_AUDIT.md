# Audit — Symbiose multi-stratégies DeFi LIA

**Date :** 31 juillet 2026  
**Module :** `lia/orchestration/symbiosis.py`

---

## 1. Cartographie des stratégies parallèles

| Stratégie | Rôle | TP / SL | Budget défaut (nouveau) | Horizon |
|-----------|------|---------|-------------------------|---------|
| **TP1** | Scalp | +1% / −1% | 20% (max 25%) | ST |
| **TP3** | Swing court | +3% / −1.5% | 20% (max 25%) | ST |
| **TP5** | Swing moyen | +5% / −2.5% | 15% (max 20%) | MT |
| **LIABrain** | Core macro WBTC/EGLD/USDC | +15% / −8% | 25% (max 35%) | LT |
| **Contrarian** | Hedge | +0.5% / −1% | 4% (max 6%) | ST |
| **CIRCUIT_1PCT** | Compound loop | +1% net / −1% | 10% (max 15%, **1 pos**) | ST |
| **YieldAgent** | Idle → Hatom | — | jusqu’à 40% idle | LT |
| **RiskAgent** | Veto HF / breaker | — | 0% | ALL |

**GreenSmoke** (Liia / Lia / Macro) : biais régime, pas d’exécution directe.

---

## 2. Problèmes détectés (avant fix)

### P0 — Sur-allocation budget
Docs historiques : TP1+TP3+TP5 à **32% chacun** + LIABrain **100%** + Contrarian **4%**  
→ somme théorique **≫ 100%** du capital si tous BUY en même temps.

**Fix :** budgets défaut recalibrés + **cap global 85%** dans `fuse_votes` ; ranking par confidence ; rejet si cap épuisé.

### P0 — Conflits BUY/SELL même token
Ex. TP1 BUY WEGLD + Contrarian SELL WEGLD → double ordre incohérent.

**Fix :** **SELL prioritaire** ; BUY même token rejeté (`conflict_sell_priority`).

### P1 — RiskAgent non centralisé dans la fusion
`swarm_risk.py` existe mais n’était pas un gate unique avant exécuteurs multiples.

**Fix :** tout `BLOCK` Risk → mode `BLOCKED`, suppression de tous les entries.

### P1 — RISK_OFF vs entries
OrchestratorRouter doc : YIELD_ONLY en risk-off, mais pas codifié côté Python multi-brains.

**Fix :** `gs_regime=RISK_OFF` supprime les BUY ; Yield conservé.

### P2 — CIRCUIT_1PCT vs multi-TP
Circuit compound exige **1 position** ; les TP pouvaient ouvrir en parallèle sans coordination.

**Fix :** registre `max_positions=1` pour CIRCUIT ; orchestrateur refuse un 2e BUY circuit.

### P2 — SL TP1 doc (−0.5%) vs circuit (−1%)
Incohérence de risk hard.

**Fix :** registre aligne TP1 SL à **−1%** (garde-fou circuit).

### P3 — OrchestratorRouter absent du repo Python
Logique surtout Vellum UI / docs — risque de drift.

**Fix :** `symbiosis.fuse_votes` = source de vérité testable pour la fusion.

---

## 3. Ordre de priorité (symbiose)

```
1. Risk BLOCK / DELEVERAGE
2. SELL / exits (SL, TP, Contrarian hedge)
3. RISK_OFF → no new BUY
4. BUY rankés par confidence, budgets sous cap 85%
5. YIELD idle USDC (Hatom)
```

---

## 4. Tests

```bash
python tests/test_symbiosis.py
```

Couverture :
- audit registre (ancien vs nouveau budget)
- risk block
- conflit SELL vs BUY
- cap budget multi-TP
- RISK_OFF
- adapter outputs brains Vellum
- max 1 position circuit

---

## 5. Intégration Vellum recommandée

```
[Brains parallel] → votes_from_brain_outputs → fuse_votes
        → approved_actions → UniversalExecutor (série, nonce)
        → rejected log → Telegram / GitHubReporter
```

Ne **jamais** lancer les 5 exécuteurs en parallèle sans passer par `fuse_votes`.

---

## 6. Verdict

| Critère | Statut |
|---------|--------|
| Symbiose budget | ✅ Cap + registry |
| Conflits token | ✅ SELL > BUY |
| Risk gate | ✅ BLOCK global |
| Régime GS | ✅ RISK_OFF |
| Circuit 1 pos | ✅ |
| Tests automatisés | ✅ `tests/test_symbiosis.py` |
| Wire Vellum graph | 🟡 à brancher sur le routeur existant |

*Neltud / Grok — audit symbiose 31 juil 2026*
