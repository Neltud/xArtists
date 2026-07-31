# Déployer les SC — Vellum + GitHub Actions

Le PEM **ne doit jamais** être dans le repo. Deux runners supportés :

| Runner | Secret | Workflow / node |
|--------|--------|-----------------|
| **GitHub Actions** | `LIA_WALLET_PEM` (repo secret) | `.github/workflows/deploy-scs.yml` |
| **Vellum** | `LIA_WALLET_PEM` (Vellum secret) | `lia/vellum/deploy_scs_node.py` |

Guide complet : **[SECRETS_AND_DEPLOY.md](./SECRETS_AND_DEPLOY.md)**

---

## A. GitHub Actions (recommandé pour un deploy manuel contrôlé)

1. Settings → Secrets → Actions → `LIA_WALLET_PEM` = contenu PEM
2. Actions → **Deploy Smart Contracts** → Run workflow
3. Commencer par **chain = D** (devnet)
4. Puis **chain = 1** (mainnet) quand le test est OK

Le job :
- installe Python + mxpy + Rust wasm
- appelle `python lia/vellum/deploy_scs_node.py`
- met à jour `data/contracts.json`
- optionnellement commit/push les adresses

---

## B. Vellum

### Secrets

| Secret | Valeur |
|--------|--------|
| `LIA_WALLET_PEM` | Texte complet `.pem` |
| `LIA_CHAIN_ID` | `1` ou `D` |
| `LIA_MVX_PROXY` | gateway correspondant |
| `FEE_BPS` | `300` |
| `DEPLOY_CONTRACT` | `all` |

### Node Python

```python
from lia.vellum.deploy_scs_node import run
print(run())
```

Le runner doit avoir le repo + `mxpy` + toolchain wasm (ou wasm prébuild).

---

## Sécurité

- Ne pas `print` le PEM
- Fichier temp PEM supprimé après deploy (node Python)
- Wallet deployer avec peu d’EGLD
