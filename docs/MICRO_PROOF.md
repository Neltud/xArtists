# Preuve micro — avant `LIA_LIVE_TRADING=1`

Ordre strict des priorités (ne pas sauter d’étape).

| # | Priorité | Statut cible |
|---|----------|--------------|
| 1 | Deploy SC marketplace + agents + **codeHash ≠ null** | fees réels possibles |
| 2 | Signature wallet **user** (List/Buy) | TX dApp prouvées |
| 3 | Pages + index listings | conversion |
| 4 | Defense / modes / social | fait (repo) |
| 5 | Paper journal + allocator | modèles sans risque |
| 6 | **Preuve micro** (ce doc) | puis seulement live micro |
| 7 | `LIA_LIVE_TRADING=1` | micro only + caps |

---

## A. Prérequis techniques

```
CHAIN=1
LIA_LIVE_TRADING=0          # reste 0 pendant toute la preuve
FEE_BPS=300
data/contracts.json         # marketplace + agents_marketplace erd1…
codeHash marketplace        # non-null (verify_marketplace_codehash.py)
```

- PEM LIA : secret uniquement (jamais dans le chat).
- Wallet **user** ≠ `LIA_WALLET` (`erd1p4zy…`).

---

## B. Preuve micro **user** (dApp) — obligatoire

Faire avec **Web Wallet ou extension** (pas adresse collée seule) :

| # | Action | Critère OK |
|---|--------|------------|
| U1 | Connect session réelle | adresse user visible |
| U2 | List NFT (ou list agent si SC agents live) | tx hash explorer **success** |
| U3 | Buy micro (petit prix test) | tx success ; seller reçoit ~97 % ; fee reste SC |
| U4 | (si bid déployé) placeBid / withdrawBid | tx success |
| U5 | Aucun plantage UI / mauvais contrat | codeHash vérifié |

Enregistrer dans `data/micro_proof_log.json` (tx hashes, dates).

---

## C. Preuve micro **LIA paper → dry**

| # | Action | Critère OK |
|---|--------|------------|
| L1 | `python -m lia.circuit.mode_orchestrator` | `final.action` cohérent ; defense respectée |
| L2 | `should_skip_micro_trade` sur notional $5–20 | skip si gas trop cher |
| L3 | `CircuitGuards.preflight` paper BUY | blockers listés si RISK_OFF |
| L4 | Defense : fear≤25 ou RISK_OFF → **pas de BUY** | `allow_buy=false` |
| L5 | Journal paper 24–48 h | pas d’exception non gérée |
| L6 | `trade_lock` LIA vs Claude | un seul holder |

**Pas de broadcast** tant que L1–L6 OK et U1–U3 OK.

---

## D. Première micro live LIA (après A+B+C)

```
LIA_LIVE_TRADING=1
# caps stricts
max_notional_usd <= 15
max_trades_per_day <= 3
mode autorisé: MICRO_ARB ou YIELD seulement au début
DEFENSE actif → aucun BUY
```

1. Une seule TX swap/arb ou yield **minime**.  
2. Confirmer sur explorer (success + balances).  
3. Remettre `LIA_LIVE_TRADING=0` si anomalie.  
4. Logger dans `data/micro_proof_log.json`.

---

## E. Critères « preuve micro ON » (go live micro)

Tous doivent être **true** :

- [ ] SC marketplace codeHash non-null  
- [ ] SC agents déployé (si buy agent testé)  
- [ ] ≥1 List user success  
- [ ] ≥1 Buy user success  
- [ ] Defense bloque BUY sous RISK_OFF (test paper)  
- [ ] `should_skip_micro_trade` refus notional trop petit  
- [ ] ≥1 micro TX LIA live **ou** décision documentée de rester paper  
- [ ] PEM jamais exposé  

Tant qu’une case manque → **`LIA_LIVE_TRADING=0`**.

---

## F. Commandes

```bash
python scripts/verify_marketplace_codehash.py
python -m lia.circuit.mode_orchestrator
python -m lia.circuit.defense_circuit
python -c "from lia.gas.micro_trade import should_skip_micro_trade; print(should_skip_micro_trade(notional_usd=5, expected_edge_usd=0.1))"
```
