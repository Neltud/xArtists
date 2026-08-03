# Stockage médias xArtists — IPFS & alternatives

## Principe

Le **NFT on-chain** (MultiversX) stocke un **pointeur** (URI metadata), pas la vidéo elle-même.
Le fichier (image / vidéo / audio) vit hors chaîne : **IPFS**, **Arweave**, ou CDN artiste.

## Options recommandées

| Solution | Usage | Achat/vente NFT ? |
|----------|--------|-------------------|
| **Pinata / IPFS** | Pin fichier + metadata JSON | Oui — URI `ipfs://` ou gateway |
| **nft.storage** | Pin / migration | Oui (API évolutive) |
| **Arweave** | Stockage permanent payant | Oui — `ar://` |
| **YouTube** | Diffusion / promo | **Non** comme média exclusif NFT |

### YouTube — clarifié

- YouTube **n’est pas** un marché NFT et **ne garantit pas** la permanence du media pour un acheteur.
- Autorisé comme **lien secondaire** dans les metadata (`external_url` / `youtube_url`) pour trailer / clip.
- L’œuvre vendable doit avoir une copie **IPFS ou Arweave** (ou fichier phygital + certificat).
- **Achat/vente** reste on-chain xArtists marketplace / XOXNO, pas via YouTube.

## Flux artiste

1. Upload media → Pinata (JWT côté **Vellum / backend**, jamais clé dans le frontend public si possible)
2. Build metadata JSON (name, description, animation_url, image, attributes)
3. Pin metadata → CID
4. Mint NFT avec `uris` / metadata pointing to `ipfs://CID`
5. List / Buy / Bid on-chain

## Secrets

```bash
export PINATA_JWT=...   # Vellum only
# or PINATA_API_KEY + PINATA_API_SECRET
```

```bash
python -m lia.media.storage --help
```
