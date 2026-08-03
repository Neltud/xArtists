# Connecter Pinata (IPFS) — compte Gmail → Vellum → xArtists

> **Important :** ni Grok ni le repo ne peuvent se connecter à ton Gmail.  
> Tu crées le compte **Pinata avec Google/Gmail**, tu copies le **JWT**, tu le mets dans **secrets Vellum** uniquement.

---

## 1. Créer le compte avec Gmail

1. Ouvre **https://app.pinata.cloud** (ou https://pinata.cloud)
2. **Sign up** → **Continue with Google** (choisis le Gmail du projet)
3. Valide l’email si demandé
4. Menu **API Keys** → **New Key**
   - Permissions : **pinFileToIPFS** + **pinJSONToIPFS** (+ pinList en lecture si possible)
   - Copie le **JWT** (long token `eyJ...`) **une seule fois**
5. Optionnel : Key + Secret si tu préfères l’ancien mode

## 2. Brancher sur Vellum (secrets)

Dans Vellum → Environment / Secrets du workflow LIA :

| Secret | Valeur |
|--------|--------|
| `PINATA_JWT` | `eyJ...` (recommandé) |
| `IPFS_GATEWAY` | `https://gateway.pinata.cloud/ipfs/` |

**Ne jamais** committer le JWT dans GitHub / frontend / Pages.

```bash
export PINATA_JWT="eyJ..."
export IPFS_GATEWAY="https://gateway.pinata.cloud/ipfs/"
python -m lia.media.pinata_connect   # test auth
```

## 3. Commandes xArtists

```bash
# Statut + test API
python -m lia.media.pinata_connect

# Pin metadata JSON
python -m lia.media.storage --name "Œuvre 01" --pin

# Pin fichier image/vidéo/audio
python -m lia.media.pinata_connect --file ./path/to/art.jpg
```

## 4. Flux artiste (Studio)

```text
Fichier local (image/vidéo/audio)
  → Vellum / ops : pinFileToIPFS → CID
  → metadata JSON (image + animation_url ipfs://…)
  → pinJSONToIPFS → meta CID
  → mxpy mint avec URI = ipfs://metaCID
  → YouTube optionnel = external_url seulement
```

Le navigateur **ne** possède **pas** le JWT : upload via backend Vellum ou outil ops.

## 5. Gateway dédié (optionnel)

Pinata → Gateways → Dedicated → ex. `https://xartists.mypinata.cloud/ipfs/`  
Puis `IPFS_GATEWAY=https://xartists.mypinata.cloud/ipfs/`

## 6. Dépannage

| Erreur | Cause |
|--------|--------|
| `PINATA_JWT not set` | Secret absent dans le shell/Vellum |
| HTTP 401 | JWT révoqué ou mauvais compte |
| HTTP 403 | Permissions API key insuffisantes |
| Timeout | Fichier trop lourd — compresser ou plan Pinata |
