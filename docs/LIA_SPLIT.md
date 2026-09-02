# Analyse — mécanismes de split LIA / xArtists

Il n’y a **pas un seul split**, mais **quatre couches distinctes**. Les confondre crée des bugs de trésorerie et de communication.

```
┌─────────────────────────────────────────────────────────────┐
│  A. Split $TRO récupéré par LIA     (lia_tro_policy.json)   │
│  B. Split PnL trading LIA (live)    (TREASURY_POLICY + lock)│
│  C. Split fees marketplace          (SC + TREASURY_POLICY)  │
│  D. Split tips / services           (TREASURY_POLICY)       │
└─────────────────────────────────────────────────────────────┘
```

---

## A. Split $TRO — redistribuer, ne pas thésauriser

**Source :** `data/lia_tro_policy.json` · doc [`TRO.md`](TRO.md)

**Règle :** LIA **accumule** EGLD / WEGLD / USDC / WBTC-type.  
**Tout TRO** qui arrive sur le wallet ops est **redistribué** (pas de cash TRO en treasury).

| Bucket | bps | % | Destination |
|--------|-----|---|-------------|
| **pool** | 4000 | 40 % | Pair / pool TRO (adresse pool config) |
| **stake** | 3000 | 30 % | SC gouvernance / stake `tro_governance` |
| **rewards** | 2000 | 20 % | Incentives créateurs (adresse encore **vide** dans policy) |
| **burn** | 1000 | 10 % | Sink `erd1dead…` |
| **Total** | 10000 | 100 % | |

### Flux logique

```
TRO balance on LIA ops  ≥  min_atomic
        │
        ▼
  Vellum node: tro_redistributor
        │
        ├── 40 % → pool_address
        ├── 30 % → stake_address
        ├── 20 % → rewards_address  ⚠️ vide aujourd’hui
        └── 10 % → burn_address
```

### État d’implémentation

| Élément | État |
|---------|------|
| Policy JSON | ✅ définie |
| Adresse pool + stake | ✅ renseignées |
| `rewards_address` | ❌ **vide** — gap |
| Exécution on-chain auto | ⚠️ nœud Vellum déclaré, pas prouvé live dans ce audit |
| `min_atomic` | `1e15` — **incohérent** si TRO a **6 decimals** (1e15 atomic = 1e9 TRO humains). À recalibrer (ex. `1_000_000` = 1 TRO) |

### Exemple numérique

Si LIA reçoit **100 TRO** à redistribuer :

| Destination | Montant |
|-------------|---------|
| Pool | 40 TRO |
| Stake | 30 TRO |
| Rewards | 20 TRO |
| Burn | 10 TRO |

---

## B. Split PnL trading LIA (cash, si live)

**Sources :** `docs/TREASURY_POLICY.md` · `lia/risk/profit_lock.py`

### B1. Profit lock (interne trading) — avant treasury

Sur **PnL net réalisé positif** :

| Part | Ratio défaut | Usage |
|------|--------------|--------|
| **Locked** | **70 %** | Ne repasse pas en risque compound (anti death-spiral) |
| **Compoundable** | **30 %** | Seule manche autorisée pour re-trader |

```text
net_usd > 0
  locked       += net * 0.70
  compoundable += net * 0.30
debit_compound() ne puise QUE dans compoundable
force_lockdown() → tout compoundable → locked
```

**Paper (`LIA_LIVE_TRADING=0`) :** 0 cash treasury — rapport only.

### B2. Split treasury du PnL live (après lock)

Indicatif policy (DAO peut modifier) :

| Destination | % |
|-------------|---|
| Mission (art) | 30 % |
| Reserve (risque) | 40 % |
| Ops (gas/dev) | 20 % |
| Growth / MM | 10 % |

**Activation :** `LIA_LIVE_TRADING=1` + micro-proof + wallets Mission/Reserve créés.

Aujourd’hui Mission/Reserve = **CREATE_REQUIRED** → tout reste concentré sur **LIA Ops** (dette de transparence).

---

## C. Split fees marketplace (SC)

**Indépendant du split TRO.**  
Condition : SC nft-marketplace / agents **LIVE** (`codeHash` ≠ null).

### C1. Au moment du buy (on-chain)

`agents-marketplace` (spec repo) :

```text
fee = price * fee_bps / 10000     # FEE_BPS=300 → 3 %
to_seller = price - fee          # 97 % au seller
fee reste SUR le contrat         # claimFees owner only
```

Exemple **10 EGLD**, `fee_bps=300` :

| Flux | EGLD |
|------|------|
| Seller | 9.70 |
| SC treasury (fees) | 0.30 |

### C2. Après claimFees → split fondation

| Destination | % |
|-------------|---|
| Mission | 40 % |
| Reserve | 30 % |
| Ops | 20 % |
| Incentives listings | 10 % |

**Gap :** `claimFees` + adresses Mission/Reserve + script de split post-claim pas encore pipeline production.

---

## D. Tips & services

| Source | Mission | Reserve | Ops |
|--------|---------|---------|-----|
| Tips « mission » | 70 % | 20 % | 10 % |
| Services (packs agents 5–25 €, Editions…) | 30 % | 20 % | 50 % |

Hors moteur trading LIA ; dépend de memos / facturation claire.

---

## Cohérence & risques

| Risque | Détail |
|--------|--------|
| **Couches mélangées** | Split TRO ≠ split PnL ≠ split fees |
| **rewards_address vide** | 20 % du TRO redistrib n’a pas de cible |
| **min_atomic** | Probable erreur d’échelle (6 decimals TRO) |
| **Mission/Reserve absents** | Splits B/C/D non matérialisables en multi-bucket |
| **SC market non live** | Split fees = 0 on-chain |
| **Profit lock vs treasury** | Lock 70 % est **interne** ; le split 30/40/20/10 s’applique au cash **après** décision de sortir du ledger trading |
| **Double spend narrative** | Afficher un split fees sans `codeHash` = trompeur |

---

## Ordre d’activation recommandé

1. Fix `min_atomic` + renseigner `rewards_address`  
2. Créer wallets **Mission** + **Reserve**  
3. Deploy SC + `claimFees` + procédure split ≤ 7 j  
4. Micro-trades → seulement alors envisager split PnL live  
5. Garder paper PnL **séparé** dans les rapports  

---

## Synthèse

- **TRO :** 40 / 30 / 20 / 10 (pool / stake / rewards / burn) — redistrib only.  
- **Trading :** d’abord **70 % lock / 30 % compound** ; puis split fondation si live.  
- **Fees market :** 3 % on SC → claim → 40 / 30 / 20 / 10 fondation.  
- **État réel :** policies riches, **exécution cash multi-bucket encore partielle** (SC + Mission/Reserve + rewards addr).
