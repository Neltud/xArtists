# Runbook immédiat — ordre d’exécution

## 0. Déjà fait

- [x] Pinata `pinata_connect → ok: true` (JWT Vellum only)
- [x] Compteurs NFT live dans le code (wallet vs catalogue)
- [x] DAO read-only, LIA ≠ GSN, marketplace address = empty (known)

## 1. Rebuild Pages

Push sur `main` déclenche en principe **GitHub Pages** (workflow deploy).

Vérifier après 2–5 min :

- https://neltud.github.io/xArtists/
- Dashboard : **NFTs wallet LIA** ≈ 8, **collections** ≈ 275+
- Pas de « 0 » fantôme

Si Pages stale : Actions → workflow Pages → **Re-run**.

## 2. Pin media (ops / Vellum)

```bash
export PINATA_JWT=...   # secret only
python -m lia.media.pinata_connect --file ./oeuvre.jpg
python -m lia.media.storage --name "Œuvre 01" --pin
# → cid + ipfs:// pour mint
```

## 3. Deploy SC (PEM + EGLD sur wallet LIA)

```bash
export CHAIN=1
export FEE_BPS=300
export LIA_LIVE_TRADING=0
export PEM=/secure/mainnet.pem

# simulate first if available
./scripts/simulate_deploy_mainnet.sh   # si présent

./scripts/deploy_mainnet.sh nft-marketplace
./scripts/deploy_mainnet.sh agents-marketplace
# noter les deux adresses erd1… affichées

python scripts/post_deploy_contracts.py \
  --marketplace erd1... \
  --agents erd1...

python scripts/verify_marketplace_codehash.py
# codeHash DOIT être non-null
```

## 4. Frontend env + rebuild

```bash
# VITE_MARKETPLACE_ADDRESS=erd1...
# VITE_AGENTS_MARKETPLACE_ADDRESS=erd1...
# rebuild Pages
```

## 5. Ne pas toucher

`LIA_LIVE_TRADING=0` jusqu’à micro-trades + signature OK.
