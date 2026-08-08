# Treasury Policy — Fondation décentralisée xArtists

**Version** : 0.3 · **Réseau** : MultiversX mainnet · **Statut** : policy produit (à ratifier DAO / ops)

**Principe** : collecte = performance LIA (si live) + fees market + tips + services · **pas de vente de parts de fonds**.

Source adresses machine : `data/treasury_wallets.json` · script : `scripts/set_treasury_wallets.py`

---

## 1. Wallets nommés

| Rôle | Adresse | Status |
|------|---------|--------|
| **LIA Ops / Protocol** | `erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6` | live — **jamais** session List/Buy user |
| **Treasury Mission** | `null` → **CREATE_REQUIRED** | Grants, art, drops |
| **Treasury Reserve** | `null` → **CREATE_REQUIRED** | Runway, drawdown |
| **BTC ops** | `bc1q0rvmym3mc4f5nmfuvpzvkvr236ptx5l243rt4d` | visibility |
| **SOL ops** | `FEcBEmpNGv8yuAnuyAdnZneCMiJMnNGYKaw7cgSzNYwn` | visibility |
| **Fee Collector** | SC marketplace après codeHash ≠ null | fees on-chain |
| **User Connect** | wallet utilisateur | tips / buy — hors treasury |

### Créer Mission + Reserve

```bash
mxpy wallet new --format pem --outfile mission.pem
mxpy wallet new --format pem --outfile reserve.pem
python scripts/set_treasury_wallets.py --mission erd1… --reserve erd1…
```

PEM hors git / offline / multisig dès que possible.

---

## 2. Split (indicatif)

| Source | Mission | Reserve | Ops | Autre |
|--------|---------|---------|-----|-------|
| Fees market (live) | 40 % | 30 % | 20 % | 10 % incentives |
| Tips mission | 70 % | 20 % | 10 % | — |
| PnL LIA live | 30 % | 40 % | 20 % | 10 % growth |
| PnL paper | 0 | 0 | 0 | rapport only |

---

## 3. Activation cash

| Module | Condition |
|--------|-----------|
| Fees | Deploy + `verify_marketplace_codehash` ok + Pages rebuild |
| LIA live PnL | `LIA_LIVE_TRADING=1` + micro-proof |
| Grants | ≥1 tx Mission publique |

---

## 4. Synthèse

Collecte usage + LIA disciplinée · allocation DAO · Mission art + résilience.  
Dette actuelle : Mission/Reserve absents + SC market non live.
