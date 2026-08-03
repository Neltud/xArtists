# YouTube ↔ NFT — ce qui est possible / impossible

## Transfert d’une vidéo YouTube d’un compte à un autre

YouTube **ne propose pas** un transfert de propriété de vidéo entre comptes comme un asset blockchain.

Options réalistes côté YouTube uniquement :

1. **Réupload** sur le compte cible (nouvelle URL, stats à zéro)
2. **Gestion multi-utilisateurs** de la chaîne (rôle Brand Account) — la vidéo reste sur **la même** chaîne
3. **Content ID / droits** — séparé de la possession d’un fichier NFT

**Ce n’est pas** un `transfer` NFT MultiversX.

## Vidéo **vendable** (xArtists)

| Élément | Requis |
|---------|--------|
| Fichier vidéo | **Pin IPFS (Pinata) ou Arweave** |
| Metadata | JSON piné avec `animation_url` + `image` (cover) |
| YouTube | Optionnel : `external_url` trailer |
| Achat/vente | SC marketplace / XOXNO — **pas YouTube** |
| Transfert acheteur | Transfert NFT on-chain = nouveau owner du **certificat + URI IPFS** |

L’acheteur possède le **NFT** et l’accès au media via CID piné, **pas** la chaîne YouTube de l’artiste.
