# Tâches

- [x] **Pinata JWT** — `pinata_connect → ok: true` (secret Vellum only, never git)
- [ ] Deploy **nft-marketplace** (adresse actuelle = compte vide, codeHash null)
- [ ] Deploy **agents-marketplace** FEE_BPS=300
- [ ] `post_deploy_contracts.py` + VITE_* + rebuild Pages
- [ ] Vérifier codeHash non-null
- [ ] Micro-trades + signature avant `LIA_LIVE_TRADING=1`
- [ ] Index listings complet (P1)

## Pinata usage

```bash
export PINATA_JWT=...   # Vellum secret
python -m lia.media.pinata_connect
python -m lia.media.pinata_connect --file ./art.jpg
python -m lia.media.storage --name "Work" --pin
```
