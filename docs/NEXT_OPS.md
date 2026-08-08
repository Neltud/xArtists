# Next ops — xArtists

## Immédiat

1. **Pages rebuild** (ce push) — seeds `lia_board` + index + critical data copy  
2. Vérifier :
   - https://neltud.github.io/xArtists/data/lia_board.json  
   - https://neltud.github.io/xArtists/data/xartists_collections.index.json  
3. **Deploy SC** quand PEM prêt : `docs/SC_DEPLOY_OPTIMIZED.md`

## P0 produit

```bash
export PEM=/path/mainnet.pem FEE_BPS=300 CHAIN=1
./scripts/preflight_deploy_mainnet.sh
RUN_DEPLOY=1 ./scripts/deploy_optimized_mainnet.sh
python scripts/verify_marketplace_codehash.py
# VITE_*_ADDRESS + CODEHASH_OK → rebuild Pages
```

## Vellum

```bash
export LIA_LIVE_TRADING=0 CHAIN=1
python -m lia.board.publish
python -m lia.vellum.publish_data_for_frontend
# git commit data/ si besoin
```

## P1

- Index listings on-chain  
- Studio pin auto  
- Treasury Mission + Reserve  
