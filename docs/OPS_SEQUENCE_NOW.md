# Ops sequence — maintenant

Ordre strict. **Mainnet only.** `LIA_LIVE_TRADING=0` jusqu’aux micro-trades OK.

## 0. État vérifié (2026-08-11)

Marketplace placeholder `erd1…8354t` = **compte vide** (balance 0, pas de codeHash).  
→ Micro List/Buy **impossible** tant que SC non redéployé.

## 1. Deploy SC (goulet cash)

```bash
PEM=/path/mainnet.pem ./scripts/deploy_mainnet.sh   # nft-marketplace + agents FEE_BPS=300
python scripts/verify_marketplace_codehash.py
python scripts/post_deploy_contracts.py --agents erd1... --marketplace erd1...
python scripts/generate_vite_env.py
# Commit VITE_* / contracts.json → rebuild Pages
```

## 2. Micro List/Buy — wallet **user** + extension

Voir `docs/MICRO_LIST_BUY_USER.md`.

Checklist UI live après Pages :

1. `/marketplace` → TxShell charge → badge **Signature prête** (vert)
2. Connect **DeFi Wallet extension** (pas paste, pas LIA ops)
3. List 0.01 EGLD → Buy avec 2e wallet ou même si autorisé
4. Explorer ownership + fees SC

## 3. Indexer → `listings_index.json`

```bash
python scripts/index_marketplace_listings.py
# commit data/listings_index.json
# Vellum cadence peut relancer ce script après chaque run market
```

Avant deploy : script écrit index vide + `codehash_ok: false` (safe).

## 4. Mission + Reserve · publier

```bash
# Offline / machine ops — PEM jamais dans le repo
mxpy wallet new --format pem --outfile mission.pem
mxpy wallet new --format pem --outfile reserve.pem
mxpy wallet pem-address mission.pem
mxpy wallet pem-address reserve.pem

python scripts/set_treasury_wallets.py --mission erd1... --reserve erd1...
# Mettre à jour data/contracts.json wallets + docs/TREASURY_POLICY.md
```

Adresses actuelles : `data/treasury_wallets.json` → mission/reserve **null** (`CREATE_REQUIRED`).

## 5. Proxy Pinata (quand ops prêt)

```bash
export PINATA_JWT=...   # secret only
python scripts/pinata_proxy_local.py --file ./oeuvre.jpg
# → ipfs://Qm… coller dans Studio
```

Doc : `docs/PINATA_PROXY.md`. **Aucun JWT dans VITE_***.

## 6. Offer V2

**Différé** — `docs/OFFER_V2_DEFERRED.md`. Bid on-chain suffit post-deploy.

## 7. Rebuild Pages (gates signature)

Push sur `main` déclenche `deploy-pages.yml` / exclusive.  
Sinon : GitHub → Actions → **Deploy** → **Run workflow**.

Après 2–5 min vérifier sur https://neltud.github.io/xArtists/ :

- Guardian bar
- Connect → paste = read-only (badge 👁)
- Market → bandeau SC + TxCapabilityBanner

## Vellum

```bash
python -m lia.board.publish
python scripts/index_marketplace_listings.py   # no-op utile si SC empty
# production_run : kill_state + data mirror — LIA_LIVE_TRADING=0
```
