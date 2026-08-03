# Pinata / IPFS — stockage permanent (ops)

## 1. Compte Pinata

1. Créer un compte sur https://pinata.cloud
2. API Keys → **JWT** (recommandé) ou Key + Secret
3. Stocker **uniquement** sur Vellum / CI secrets — jamais dans le frontend public

```bash
export PINATA_JWT="eyJ..."
export IPFS_GATEWAY="https://gateway.pinata.cloud/ipfs/"
# optionnel gateway dédié : https://your-subdomain.mypinata.cloud/ipfs/
```

## 2. Pin fichier + metadata

```bash
# Metadata dry-run
python -m lia.media.storage --name "Clip 01"

# Pin JSON (JWT requis)
python -m lia.media.storage --name "Clip 01" --pin
```

Upload fichier binaire : UI Pinata ou API `pinFileToIPFS`, puis passer `animation_url=ipfs://CID` dans metadata.

## 3. Permanence

- **Pin actif Pinata** = hot storage tant que le pin / plan est maintenu
- Pour **permanance forte** : doubler sur **Arweave** ou Filecoin via offre Pinata/nft.storage selon plan
- Ne pas s’appuyer sur YouTube pour la permanence

## 4. Gateway dApp

Metadata on-chain : préférer `ipfs://CID`  
Affichage navigateur : `https://gateway.pinata.cloud/ipfs/CID`
