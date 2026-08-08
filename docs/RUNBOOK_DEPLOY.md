# RUNBOOK DEPLOY — xArtists mainnet (canonical)

**Une seule entrée.** Docs satellites renvoient ici.

| Param | Valeur |
|-------|--------|
| Réseau | **Mainnet only** `CHAIN=1` |
| SC | `agents-marketplace` + `nft-marketplace` |
| Fee | `FEE_BPS=300` |
| Owner | LIA Ops (PEM) |
| Live trading | `LIA_LIVE_TRADING=0` jusqu'à micro OK |

---

## Commande unique

```bash
export PEM=/secure/mainnet.pem FEE_BPS=300 CHAIN=1 LIA_LIVE_TRADING=0

./scripts/runbook_deploy.sh dry
./scripts/runbook_deploy.sh deploy
./scripts/runbook_deploy.sh verify   # = post_deploy_verify automatisé
# ou: ./scripts/runbook_deploy.sh all
```

---

## Phases

| Phase | Action | Coût |
|-------|--------|------|
| `dry` | build + gas + balance | 0 |
| `deploy` | 2 SC + confirm adaptive | ~0.10–0.25 EGLD |
| `verify` | **suite auto** codeHash, cohérence, VITE, retries API | 0 |

### Verify automatisé (`post_deploy_verify`)

- codeHash LIVE sur market + agents  
- retries si API lag post-deploy  
- cohérence `contracts.deployed.json`  
- `LIA_LIVE_TRADING` reste 0  
- écrit `data/post_deploy_report.json`  
- génère `.env.mainnet.example` si PASS  

Détail: [`POST_DEPLOY_VERIFY.md`](POST_DEPLOY_VERIFY.md)

---

## Succès → frontend

1. VITE depuis `.env.mainnet.example` → `deploy-pages.yml`  
2. Commit `data/contracts.json` + `post_deploy_report.json`  
3. Push → Pages  
4. Micro List/Buy **wallet user**  

---

## Erreurs rapides

| Symptôme | Action |
|----------|--------|
| insufficient funds | top-up >= 0.25 EGLD |
| out of gas | `GAS_LIMIT_OVERRIDE=500000000` |
| codeHash null | `post_deploy_verify.sh` (retries) ou attendre |
| verify exit 2 | ne pas activer Buy UI |

---

## Vellum

```text
PEM secret only · CHAIN=1 · LIA_LIVE_TRADING=0
dry → (human gate) → deploy → verify
verify exit 0 only → commit contracts + Pages
no fake addresses on fail
```
