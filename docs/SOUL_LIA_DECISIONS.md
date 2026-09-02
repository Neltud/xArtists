# Soul · Processus lend/borrow · Décisions LIA · Mainnet

**Statut dApp** : pre-mainnet · **Fonds user** : interdits · **Settlement xArtists** : MultiversX

Soul ([docs.soul.io](https://docs.soul.io/)) = couche de liquidité **cross-chain** au-dessus d’Aave / Compound / Venus / Morpho — pas un money market natif MultiversX aujourd’hui.

---

## 1. Processus lending / borrowing (protocole)

| # | Opération | Effet |
|---|-----------|--------|
| 1 | **Supply** | Dépôt underlying → sToken · intérêts |
| 2 | **Add collateral** | sToken → collatéral · augmente borrow limit (CF) |
| 3 | **Borrow** | Dette contre collatéral · surveiller HF / liquidation threshold |
| 4 | **Repay** | Réduit dette · libère capacité |
| 5 | **Withdraw** | Sortie supply (si non bloqué par dette) |
| 6 | **Cross-chain lend** | Collatéral chaîne A / borrow chaîne B via Controller cluster |

Risque principal borrow : **liquidation** si HF &lt; 1 (collateral value ↓ ou debt ↑).

---

## 2. Comment LIA procède (`SoulRouter`)

```
Placement yield (YIELD mode)
  → prefer Hatom (MVX) si edge / liquidité
  → sinon paper Soul si allow_soul && !defense
       → auto_route:
            if defense → SKIP
            if amount < $5 → SKIP
            else SUPPLY (50% amount) paper only
  → BORROW / leverage / cross-chain → toujours bloqués v1
```

| Décision | Condition | Résultat |
|----------|-----------|----------|
| SKIP | Guardian DEFENSE / DD / fear | Pas de nouveau risque |
| SKIP | amount_usd &lt; 5 | Dust |
| SKIP | demande BORROW | `max_leverage_loops=0` |
| SKIP | CROSS_CHAIN_LEND | Bridge risk · audit manquant |
| SUPPLY paper | ok risk + experimental | Intent journalisé, pas de TX mainnet |
| executable=False | `mvx_agent` strategy SOUL | Pas d’envoi PEM |

**Wallet** : futurs live intents = **LIA ops** uniquement. Wallet Connect user **ne signe jamais** Soul experimental dans la dApp.

---

## 3. Front `/soul-testnet`

- Matrice des 6 ops + badges LIA paper / risk
- Simulateur de décision (supply / defense / borrow bloqué)
- HF paper pédagogique
- Checklist gates mainnet
- Liens Hatom (production MVX) + docs.soul.io

---

## 4. Anticiper mainnet

### Avant d’activer quoi que ce soit

1. Soul mainnet public + Lens/API stables  
2. Adresses Controller / sToken par chaîne dans config versionnée  
3. Audit protocole + revue intégration  
4. Paper `SoulRouter` stable (30j+)  
5. **Hatom** micro-proofs LIA déjà OK (priorité base layer)  
6. Flag ops `SOUL_ENABLED=mainnet` **de** `LIA_LIVE_TRADING`  
7. UI : `acceptUserFunds` reste false jusqu’à décision produit explicite  

### Après activation progressive

| Phase | LIA | User dApp |
|-------|-----|-----------|
| A | Paper only | Lecture |
| B | Micro supply paper→live LIA ops cap $ | Lecture |
| C | Optional addCollateral | Toujours pas de dépôt forcé |
| D | Borrow | **Non** tant que policy leverage=0 |
| E | Cross-chain | **Non** sans redesign bridge + audit |

### zk (optionnel MVX)

`contracts/soul-zk-verifier` = gate preuves off-chain → pas un money market. Déployer seulement avec VK réelle (pas placeholder).

---

## 5. Vellum

```bash
python -m lia.defi.soul_routes
python -m lia.circuit.yield_strategy
# publish data/soul_lia_status.json dans le mirror front si besoin
```

Env : `SOUL_ENABLED=testnet` · jamais de PEM user · `FORCE_MODE=paper` tant que gates ouverts.

---

*Soul enrichit le catalogue de placements LIA ; il ne remplace pas Hatom sur MultiversX.*
