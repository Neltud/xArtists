# Multi-agent capital — LIA décide une fois, plusieurs packs / agents stakés

## Verdict en une ligne

**Oui, c’est possible** : un cerveau LIA (Vellum) produit une décision, puis un **routeur multi-capital** la projette sur N agents stakés (packs Pulse / Yield / Sentinel) avec des tailles proportionnelles aux fonds déposés.  
**Non, ce n’est pas en production aujourd’hui** : le repo alloue encore par **stratégies / sleeves** sur le **wallet protocole LIA**, pas par `agent_id` user fundé.

---

## 1. Ce qui existe déjà (cerveau)

| Composant | Rôle |
|-----------|------|
| Modes DEFENSE / COMPOUND / MICRO_ARB / … | Une politique globale |
| `portfolio_allocator` / `compound_pyramids` | Poids **MOM / YIELD / …** sur un book |
| `mvx_agent` + executor | Exécution (paper ou live) **un flux** |
| GSN | Signal plafonné, pas un capital |

Aujourd’hui : **1 décision → 1 book LIA ops**.  
Les packs sont des **SKU / droits**, pas encore des **sous-comptes de trading**.

---

## 2. Ce que tu décris (cible)

```
User Buy pack → Stake NFT → Deposit fonds dans escrow *agent/pack*
                                    ↓
LIA (Vellum) : signaux → UNE décision (ou une par mode autorisé)
                                    ↓
Routeur multi-capital :
  pour chaque agent staké avec balance > min
    si pack autorise l’action (Pulse≠Sentinel)
      ticket = size(decision, capital_agent, limites pack)
                                    ↓
(Option) Netting : agréger tickets même sens / même venue
                                    ↓
Executor : TX signées selon modèle custody (voir §4)
                                    ↓
Ledger : PnL attribué par agent_id → claim user
```

LIA ne “pense” pas N fois de zéro : elle **répartit** la même intelligence sur plusieurs capitaux, filtrés par **type de pack**.

---

## 3. Répartition par pack (logique)

| Décision LIA | Pulse | Yield | Sentinel |
|--------------|-------|-------|----------|
| MICRO_ARB / MOMENTUM | ✅ taille max | ❌ ou micro | ❌ |
| YIELD / COMPOUND | optionnel | ✅ | ❌ ou skip |
| DEFENSE / reduce | ✅ | ✅ | ✅ (prioritaire) |
| RISK_OFF global | force reduce / flat tous les agents |

Exemple : décision `BUY MICRO_ARB conf=0.7`  
- Agent A (Pulse, 100 EGLD escrow) → ticket 100 × risk_pct(0.7)  
- Agent B (Pulse, 40 EGLD) → ticket 40 × même risk_pct  
- Agent C (Sentinel, 50 EGLD) → **0** (pack n’autorise pas)  
- Agent D (Yield, 80 EGLD) → **0** pour cet edge  

Une seule lecture de marché ; **N tailles** ; **filtres pack** = ce qui différencie les produits à 18 / 12 / 8 €.

---

## 4. Qui détient les fonds ? (point dur)

Sans ça, “l’agent trade avec mon argent” est du vaporware ou de la custody cachée.

| Modèle | Flux | Autonomie LIA | Risque |
|--------|------|---------------|--------|
| **C (v1 actuel)** | User paie le pack seulement | LIA trade **son** book ; user claim share de pool | Pas de capital user en trading |
| **B-pool** | Deposit → escrow **par pack** ; LIA trade un book pack ; pro-rata stakers | Oui, 1 PEM / book pack | Ressemble à un pool ; règles SC strictes |
| **B-ledger** | Deposit → escrow global ; **sous-comptes virtuels** `agent_id` | Oui, 1 wallet d’exécution + ledger interne | Comptable + audit lourd |
| **N wallets** | 1 key/agent gérée par LIA | Oui | Custody maximale — à éviter |
| **User signe chaque trade** | Non-custodial | Non autonome | Contredit “agent qui trade” |

**Recommandation technique pour “fonds → agent → trade via LIA” :**  
**B-pool par pack** (3 escrows Pulse/Yield/Sentinel) ou **B-ledger** avec SC qui n’autorise LIA qu’à des *intents* bornés (max notional, venues whitelist, kill-switch).

Interdit produit : envoyer des tokens vers le **wallet LIA ops** affiché sur le Dashboard en croyant “alimenter mon agent”.

---

## 5. Est-ce que Vellum peut le faire ?

| Étape | Vellum | Statut repo |
|-------|--------|-------------|
| Décision unique (modes, GSN cap, defense) | Oui | Existe |
| Lire registry agents stakés + balances | Oui si oracle/API/SC view | **À construire** |
| Filtrer par pack | Oui (table pack → strategies) | Spec packs OK |
| Calculer N tickets | Oui (`multi_capital_router`) | **Module paper ajouté** |
| Exécuter N ou 1 TX netted | Oui si PEM + live flag | **Un book seulement** |
| Attribuer PnL / claim | Oui si ledger | **Absent** |

Donc : **cerveau prêt à être étendu** ; **couche capital multi-tenant absente** ; **custody SC absente**.

---

## 6. Contraintes d’intégrité (réflexion “dure”)

1. **Une décision, N risques** — un agent sous-capitalisé ne doit pas absorber la taille d’un gros ; plafonds **par agent** et **par pack**.  
2. **DEFENSE global** bat tous les packs — pas de Pulse qui continue d’acheter en RISK_OFF.  
3. **Comptabilité** — sans ledger `agent_id`, tout dépôt user devient un pool opaque (= fonds).  
4. **Compliance perçue** — dès que l’user envoie des fonds qui tradent, le narratif “droit produit” (modèle C) ne suffit plus : il faut **escrow + règles + claim**, ou rester en C.  
5. **Netting** — 50 agents Pulse BUY 0.01 EGLD → une TX agrégée + split ledger, sinon gas et latence explosent.  
6. **LIA_LIVE_TRADING** — rester à 0 jusqu’à micro-proofs **par book** (protocole d’abord, puis pack pool).

---

## 7. Feuille de route réaliste

| Phase | Livrable |
|-------|----------|
| **v1** | Packs 18/12/8 € · stake · claim share **sans** deposit trading (modèle C) |
| **v1.5 paper** | `multi_capital_router` + faux balances → tickets journalisés |
| **v1.5 SC** | Escrow pack + deposit/withdraw + views balances |
| **v2 live** | Executor consomme tickets · ledger PnL · claim |
| **Jamais** | User → adresse LIA ops libre sans escrow |

---

## 8. Synthèse

- **Possible** : LIA = un cerveau ; packs = filtres ; agents stakés = **capitaux adressables** ; Vellum enchaîne décision → routeur → (netting) → exécution → ledger.  
- **Pas encore vrai** dans le code d’exécution.  
- **Condition** : escrow + ledger + filtres pack — pas seulement “stake NFT + envoyer des tokens à l’agent”.

Module paper : `lia/agents/multi_capital_router.py`.
