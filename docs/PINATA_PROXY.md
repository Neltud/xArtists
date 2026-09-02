# Pinata proxy — JWT hors front (P1)

## Règle sécurité

Le JWT Pinata **ne doit jamais** être dans `VITE_*`, le bundle GH Pages, ni le repo public.

## Architecture cible

```
Studio (browser) → POST /api/pin (backend ops / Cloudflare Worker / Vellum node)
                      → Pinata API (Authorization: Bearer JWT secret)
                      → { cid, uri: ipfs://… }
Studio affiche URI → mint metadata
```

## Vellum / ops immédiat

```bash
# secrets env only
export PINATA_JWT=...
python -m lia.media.pinata_connect --file ./oeuvre.jpg
python -m lia.media.storage --name "Œuvre 01" --pin
```

## Studio UX (actuel)

- Champ URI IPFS manuel + fichier local « préparation »
- Message : pin via Vellum / JWT serveur
- Pas d’upload direct Pinata depuis le navigateur public

## Endpoint minimal (à déployer ops)

`POST /pin` multipart · auth session artiste · rate-limit · max 50 MB · types image/video/audio

Réponse : `{ "IpfsHash": "Qm…", "uri": "ipfs://Qm…" }`
