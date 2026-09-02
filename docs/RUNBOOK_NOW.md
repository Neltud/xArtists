# Runbook immédiat — ordre d’exécution

**Guide détaillé deploy** → [`DEPLOYMENT_STEPS.md`](./DEPLOYMENT_STEPS.md)

## 0. Déjà fait

- [x] Pinata `pinata_connect → ok: true` (JWT Vellum only)
- [x] Compteurs NFT live dans le code (wallet vs catalogue)
- [x] DAO read-only, LIA ≠ GSN, marketplace address = empty (known)
- [x] Wallet ≠ Portfolio · multi-chain BTC/SOL · TREASURY_POLICY v0.2

## 1. Rebuild Pages

Push sur `main` → **GitHub Pages** (workflow deploy).

Vérifier après 2–5 min :

- https://neltud.github.io/xArtists/
- Dashboard : NFTs wallet LIA · collections catalogue
- Nav : Studio · Market · Agents · Portfolio LIA · Wallet user · Editions · Ads

Si Pages stale : Actions → workflow Pages → **Re-run**.

## 2. Pin media (ops / Vellum)

```bash
export PINATA_JWT=...   # secret only
python -m lia.media.pinata_connect --file ./oeuvre.jpg
python -m lia.media.storage --name "Œuvre 01" --pin
```

## 3. Deploy SC (étapes complètes)

Voir **`docs/DEPLOYMENT_STEPS.md`**.

Résumé :

```bash
export CHAIN=1 FEE_BPS=300 LIA_LIVE_TRADING=0 PEM=/secure/mainnet.pem

./scripts/build_scs_isolated.sh all
./scripts/simulate_deploy_mainnet.sh nft-marketplace
./scripts/simulate_deploy_mainnet.sh agents-marketplace

./scripts/deploy_mainnet.sh nft-marketplace    # noter erd1
./scripts/deploy_mainnet.sh agents-marketplace # noter erd1

python scripts/post_deploy_contracts.py \
  --marketplace erd1... \
  --agents erd1...

python scripts/verify_marketplace_codehash.py   # codeHash ≠ null
```

Solde LIA : viser **≥ 2–5 EGLD** (pas seulement 0,66).

## 4. Frontend env + rebuild

```text
VITE_MARKETPLACE_ADDRESS=erd1...
VITE_AGENTS_MARKETPLACE_ADDRESS=erd1...
VITE_AGENTS_FEE_BPS=300
VITE_CHAIN_ID=1
```

Commit `data/contracts.json` → rebuild Pages → retirer bannières P0.

## 5. Signature + blackbox

- Connect Web Wallet / extension (pas LIA protocole)
- Micro List / Buy (`MAINNET_DEPLOY_BLACKBOX.md`)
- `LIA_LIVE_TRADING=0` jusqu’à micro-trades trading OK

## 6. Ne pas toucher

- PEM dans le repo  
- Deploy bridge  
- Fonds vers anciennes adresses empty  
- Vote DAO factice  
