# Utiliser Vellum pour les déploiements SC

Vellum = **cerveau + exécuteur ops**. Les secrets restent dans le **vault Vellum**.  
Le repo public ne contient que le code (`lia/vellum/deploy_scs_node.py`, scripts).

---

## Architecture

```
Vellum Workflow (secret)
  │  secrets: LIA_WALLET_PEM, optional PINATA_…
  │  env: CHAIN=1 LIA_LIVE_TRADING=0 VELLUM_DEPLOY_SCS=1
  ▼
git pull origin main
  ▼
python -m lia.vellum.production_run
  │  … paper phases …
  └─ phase deploy_scs → lia.vellum.deploy_scs_node
         │
         ├─ mxpy contract build (nft / agents)
         ├─ mxpy contract deploy --send (si pas DRY)
         └─ data/contracts.json (adresses) + data/vellum_deploy_scs.json
  ▼
Ops: verify codeHash → VITE flags → Pages rebuild
```

**Paper quotidien :** `VELLUM_DEPLOY_SCS` absent ou `0` → phase deploy **skipped**.

---

## Secrets Vellum (vault)

| Secret | Usage |
|--------|--------|
| `LIA_WALLET_PEM` | Texte PEM **ou** chemin monté |
| `LIA_WALLET_PEM_PATH` | Chemin fichier PEM alternatif |
| *(optionnel)* `PINATA_JWT` | IPFS — pas requis pour deploy SC |

Ne jamais echo / commit le PEM. Le node redacte les blocs PEM dans les logs.

---

## Variables d’environnement (node Vellum)

| Variable | Valeur | Rôle |
|----------|--------|------|
| `CHAIN` / `LIA_CHAIN_ID` | `1` | Mainnet only — refus sinon |
| `LIA_LIVE_TRADING` | `0` | Pendant deploy |
| `VELLUM_DEPLOY_SCS` | `1` | Active la phase dans `production_run` |
| `VELLUM_DEPLOY_DRY` | `0` / `1` | `1` = build only, pas de `--send` |
| `DEPLOY_CONTRACT` | `all` · `nft-marketplace` · `agents-marketplace` | Cible |
| `FEE_BPS` | `300` | Argument constructeur |
| `LIA_MVX_PROXY` / `PROXY` | gateway mainnet | API |
| `PYTHONPATH` | `.` | Racine repo |

Réf. globale : [`ENVIRONMENT_VARIABLES.md`](ENVIRONMENT_VARIABLES.md).

---

## Workflow Vellum A — Paper only (cadence 3–5 min)

```bash
git pull origin main
export PYTHONPATH=. CHAIN=1 LIA_LIVE_TRADING=0
# VELLUM_DEPLOY_SCS unset
python -m lia.vellum.production_run
```

## Workflow Vellum B — Dry deploy (recommandé avant vrai send)

```bash
git pull origin main
export PYTHONPATH=. CHAIN=1 LIA_LIVE_TRADING=0
export VELLUM_DEPLOY_SCS=1
export VELLUM_DEPLOY_DRY=1
export DEPLOY_CONTRACT=all
# Secret: LIA_WALLET_PEM
python -m lia.vellum.production_run
# ou direct :
python -m lia.vellum.deploy_scs_node
```

## Workflow Vellum C — Deploy réel mainnet

Prérequis : balance EGLD déployeur, code audité, dry OK.

```bash
git pull origin main
export PYTHONPATH=. CHAIN=1 LIA_LIVE_TRADING=0
export VELLUM_DEPLOY_SCS=1
export VELLUM_DEPLOY_DRY=0
export FEE_BPS=300
export DEPLOY_CONTRACT=all
python -m lia.vellum.production_run
```

Puis **hors Vellum ou step suivant** :

```bash
python scripts/verify_marketplace_codehash.py   # exit 0 obligatoire
python scripts/post_deploy_contracts.py --marketplace erd1... --agents erd1...
# Commit data/contracts.json (adresses publiques uniquement)
# CI : VITE_MARKETPLACE_CODEHASH_OK=1 VITE_AGENTS_CODEHASH_OK=1 → rebuild Pages
```

Alternative scripts (même PEM, hors Python node) :

```bash
export PEM=$LIA_WALLET_PEM_PATH   # si fichier
./scripts/runbook_deploy.sh dry
./scripts/runbook_deploy.sh deploy
./scripts/runbook_deploy.sh verify
```

---

## Prompt type pour l’assistant Vellum

```
Tu es LIA ops sur MultiversX mainnet.
1. git pull origin main
2. Paper: CHAIN=1 LIA_LIVE_TRADING=0 python -m lia.vellum.production_run
3. Deploy SC seulement si instruction explicite + VELLUM_DEPLOY_SCS=1
4. Toujours VELLUM_DEPLOY_DRY=1 d’abord
5. Après deploy réel: verify_marketplace_codehash.py exit 0
6. Ne jamais logger ni committer le PEM
7. Ne jamais LIA_LIVE_TRADING=1 sans micro-preuves
Code source: repo Neltud/xArtists (modules lia/vellum/*)
```

---

## Interdits

| Interdit | Pourquoi |
|----------|----------|
| `CHAIN≠1` | Projet mainnet-only |
| PEM dans git / logs | Compromission LIA ops |
| `VITE_*_CODEHASH_OK=1` sans verify | UX ment sur le live SC |
| Deploy sur wallet user Connect | Séparer user / LIA ops |
| LIVE trading auto après deploy | Gates + micro-proofs d’abord |

---

Module : `lia/vellum/deploy_scs_node.py` · Entrée : `lia.vellum.production_run` phase `deploy_scs` · Commandes shell : [`SC_DEPLOY_COMMANDS.md`](SC_DEPLOY_COMMANDS.md)
