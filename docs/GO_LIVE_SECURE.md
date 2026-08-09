# Go-live secure — chemin rapide et fermé

## Objectif

Activer fees market + buy agents **sans** exposer les fonds utilisateurs prématurément.

## Une commande

```bash
export LIA_LIVE_TRADING=0
export PYTHONPATH=.
./scripts/go_live_secure.sh
```

Avec PEM prêt :

```bash
export PEM=/path/mainnet.pem   # hors repo
export FEE_BPS=300
./scripts/go_live_secure.sh
# puis deploy_mainnet.sh agents-marketplace + nft-marketplace
python scripts/post_deploy_contracts.py --agents erd1... --marketplace erd1...
python scripts/post_deploy_verify.py --strict
python scripts/generate_vite_env.py
# rebuild GH Pages → retirer bandeaux
```

## Gates (`python -m lia.security.go_live_gates`)

| Gate | Critique | Condition |
|------|----------|-----------|
| chain_mainnet | oui | CHAIN=1 |
| marketplace_codehash | oui | codeHash ≠ null |
| agents_marketplace_codehash | oui | codeHash ≠ null |
| no_pem_in_repo | oui | zéro `.pem` tracké |
| micro_proofs | si LIVE | ≥1 tx proof OK |

`allow_product_claims_live` = les deux SC live.  
`allow_live_trading` = flag 1 **et** gates + micro-proof.

## SC déjà sécurisés dans le code

- pause · CEI (`active=false` avant transfers) · fee cap · claimFees owner  
- upgrade owner · transferOwnership 2-step · agent_id length cap  

## Ne pas faire

- Fonds vers adresse marketplace **empty** actuelle  
- `LIA_LIVE_TRADING=1` sans micro-proof  
- PEM dans git / Pages  
- Afficher Buy live tant que codeHash null  

## Après deploy

1. Blackbox `docs/MAINNET_DEPLOY_BLACKBOX.md` (wallet **user**)  
2. Fee split UI 3 %  
3. Journal micro-proofs  
4. Seulement alors envisager trading live micro  
