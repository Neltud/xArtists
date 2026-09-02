# Séquence ops production (ordre strict)

## 1. Rebuild GH Pages (Board + DAO + galerie)

- Push `main` déjà contient seeds `public/data/lia_board.json`, nav DAO, branding xArtists.
- GitHub → **Actions** → workflow `deploy-pages.yml` ou `deploy-frontend.yml` → **Run workflow**.
- Vérifier : https://neltud.github.io/xArtists/  
  - `/trading` Board plus en 404  
  - Nav **DAO**  
  - Galerie titre **xArtists**

```bash
# local
cd apps/frontend && npm ci && npm run build
# artifact = dist/ servi par Pages
```

## 2. Vellum data refresh

```bash
export LIA_LIVE_TRADING=0
python -m lia.vellum.next_run
# commit + push data/*.json si générés hors CI
```

## 3. Phase A deploy (EGLD requis)

Lire `docs/VELLUM_PRODUCTION_PROMPT.md`.

```bash
export PEM=/secure/path/mainnet.pem   # NEVER commit
export CHAIN=1
export FEE_BPS=300
./scripts/simulate_deploy_mainnet.sh
./scripts/deploy_mainnet.sh agents-marketplace
./scripts/deploy_mainnet.sh nft-marketplace
```

## 4. Blackbox

`docs/MAINNET_DEPLOY_BLACKBOX.md` — cocher list/buy/claim/bid.

## 5. contracts.json + VITE_* + rebuild

```bash
python scripts/post_deploy_contracts.py \
  --agents erd1... \
  --marketplace erd1...

# apps/frontend/.env.production (local/CI secrets)
# VITE_AGENTS_MARKETPLACE_ADDRESS=erd1...
# VITE_MARKETPLACE_ADDRESS=erd1...
# VITE_AGENTS_FEE_BPS=300

cd apps/frontend && npm run build
# re-run Pages workflow
```

## 6. Live trading

**Garder `LIA_LIVE_TRADING=0`** jusqu’à :

- [ ] Signature wallet user OK (`__xartistsSendTx`)
- [ ] Micro Buy NFT OK
- [ ] Micro Buy agent OK (si SC live)
- [ ] Executor health paper OK

Puis seulement : `export LIA_LIVE_TRADING=1` sur l’hôte Vellum sécurisé.
