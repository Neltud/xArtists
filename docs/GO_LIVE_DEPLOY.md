# GO LIVE — Deploy SC + Pages + Signature

**Ne jamais coller le PEM dans le chat, Git, ou Vellum logs.**

## 1. Machine locale (ou Vellum secret path)

```bash
cd /path/to/xArtists
git pull origin main

export CHAIN=1
export FEE_BPS=300
export LIA_LIVE_TRADING=0
export GAS_LIMIT=200000000   # monter si out of gas (max 600000000)
export PEM=/chemin/absolu/mainnet.pem   # fichier local UNIQUEMENT

# optionnel: simuler d’abord
RUN_SIMULATE=1 ./scripts/sprint_a_mainnet.sh
# ou:
./scripts/simulate_deploy_mainnet.sh nft-marketplace
./scripts/simulate_deploy_mainnet.sh agents-marketplace

# DEPLOY RÉEL
./scripts/deploy_mainnet.sh nft-marketplace
./scripts/deploy_mainnet.sh agents-marketplace
# ou en une fois:
# ./scripts/deploy_mainnet.sh all
```

Prérequis : `mxpy` + `sc-meta` (ou mxpy contract build), solde EGLD suffisant (~0.5+ pour 2 deploys).

## 2. Après succès — noter les 2 adresses `erd1…`

```bash
python scripts/post_deploy_contracts.py \
  --marketplace erd1qqqq... \
  --agents erd1qqqq...

python scripts/verify_marketplace_codehash.py
# codeHash DOIT être non-null
```

Commit `data/contracts.json` + `.env.mainnet.example` (sans secrets) → push main.

## 3. Frontend env (CI / local build)

```
VITE_MARKETPLACE_ADDRESS=erd1...
VITE_AGENTS_MARKETPLACE_ADDRESS=erd1...
VITE_AGENTS_FEE_BPS=300
```

## 4. Pages

Workflows : `deploy-pages.yml` · `deploy-frontend.yml` (dispatch depuis Actions).

## 5. Signature wallet réelle

1. https://neltud.github.io/xArtists/ → **Connect**
2. Préférer **Web Wallet** ou **DeFi extension** (pas adresse collée seule pour TX)
3. Market → List test / Buy micro après SC live
4. Ne pas activer `LIA_LIVE_TRADING=1` avant micro-trades OK

## 6. Réponse safe à renvoyer ici

- Adresse marketplace `erd1…`
- Adresse agents `erd1…`
- `codeHash` présent oui/non
- tx hash(es) optionnels
