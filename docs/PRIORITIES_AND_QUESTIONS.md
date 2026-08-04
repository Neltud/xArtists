# Priorités confirmées (2026-08-04)

## Décisions produit

- **Branding galerie** : titre + bios = **xArtists uniquement**. Aucun « Nelson Tuduri » en titre ni en bio collection.
- **Studio ≠ DAO** : deux modules ; BottomNav mobile expose **Studio** et **DAO** (+ Market, $TRO).
- **KPI rétention n°1** : Studio mint → sell art → buy NFT → buy $TRO.

## P0

1. Deploy SC **nft-marketplace** + **agents-marketplace** + `verify_marketplace_codehash`
2. Rebuild **GH Pages**
3. Signature wallet réelle (extension / Web Wallet)

## P1

- Index listings post-deploy
- Bios collections (génériques / multi-artistes plus tard)
- Studio pin proxy Pinata

## Ops deploy (quand EGLD + PEM)

```bash
export CHAIN=1 FEE_BPS=300 LIA_LIVE_TRADING=0 PEM=/secure/mainnet.pem
./scripts/deploy_mainnet.sh nft-marketplace
./scripts/deploy_mainnet.sh agents-marketplace
python scripts/post_deploy_contracts.py --marketplace erd1... --agents erd1...
python scripts/verify_marketplace_codehash.py
```

Envoyer seulement les adresses `erd1…` (jamais le PEM).
