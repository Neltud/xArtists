# Stocker et préserver vos œuvres : images, vidéos et NFT

Une œuvre xArtists ne devrait pas disparaître parce qu'un site web ferme ou qu'un abonnement de stockage expire.

## Ce que vous pouvez faire maintenant

Dans le **Studio xArtists**, l'artiste peut préparer une œuvre JPG, PNG ou WebP (jusqu'à 16 Mo) ou MP4 (jusqu'à 48 Mo). Le fichier reste sur votre appareil tant que la publication IPFS n'est pas activée et confirmée côté serveur. Un aperçu local ou une image générée dans un brouillon **n'est pas un NFT**.

Le service de publication a été développé pour utiliser Pinata avec une signature du créateur ; il doit encore être vérifié en production. Aucune date de lancement n'est promise.

## Trois mots à comprendre

- **IPFS** donne à un fichier une adresse liée à son contenu, appelée CID. Si le fichier change, cette adresse change. Mais il faut qu'au moins un opérateur conserve les octets : l'IPFS seul n'assure pas leur disponibilité.
- **Arweave** propose un modèle d'archivage de très longue durée avec financement initial. C'est une option recommandée pour conserver des originaux et des métadonnées, après validation du coût et du téléchargement. Aucune technologie ne peut promettre l'éternité.
- **Sauvegarde indépendante** signifie garder au moins une copie récupérable chez un autre fournisseur, ainsi qu'une copie privée chiffrée sous le contrôle de l'artiste.

## Le parcours de préservation recommandé

1. Conservez l'original sur votre appareil ou dans un coffre chiffré.
2. Attestez que vous avez les droits de le publier ; ne diffusez pas de données personnelles, de documents privés ou de contenu sans autorisation.
3. Lorsque l'upload IPFS du Studio est opérationnel, publiez le média et obtenez son CID.
4. Téléchargez votre fiche de conservation avec le SHA-256, les URIs et les copies à constituer. **Cette fiche est un inventaire, pas une sauvegarde.**
5. Vérifiez que le média téléchargé depuis IPFS a bien la même empreinte SHA-256 et la même taille.
6. Faites conserver une autre copie par un opérateur indépendant. Envisagez l'archivage Arweave et une sauvegarde chiffrée distincte.
7. Préparez ensuite les métadonnées et vérifiez le rôle du wallet artiste avant de **signer personnellement le mint**. Un fichier publié n'est pas automatiquement une vente, ni un NFT confirmé.

## Où les œuvres peuvent-elles être présentées ou vendues ?

| Plateforme | Usage |
|---|---|
| **xArtists** | Galerie, documentation et préparation des œuvres ; fonctions commerciales selon leur statut vérifié |
| **XOXNO** | Marketplace externe de NFT MultiversX existants et éligibles |
| **OpenSea / Polygon** | NFT Polygon mintés selon le standard natif et vérifiés |
| **OpenSea / Solana** | Certains NFT Solana déjà mintés et pris en charge ; OpenSea Studio ne réalise pas de mint Solana |
| **Etsy** | Œuvres physiques admissibles uniquement : les NFT sont interdits à la vente |
| **GitBook** | Guides, provenance documentaire, explications et feuille de route, **pas stockage exclusif des fichiers originaux** |
| **Google Drive** | Copie privée complémentaire si vous disposez d'un compte configuré, pas preuve de permanence |

Les œuvres physiques (peintures, sculptures, objets) exigent toujours une procédure distincte d'authentification, de garde et de livraison. Un NFT ne transfère pas automatiquement la propriété de l'objet.

## Statut public

**Lecture et préparation** : accessibles selon les modules.

**Upload IPFS, distribution, vente fiat, mint réel et gouvernance on-chain** : ne sont pas affirmés actifs sans preuve de connexion, de signature, de livraison et d'enregistrement sur le réseau concerné.

Consultez [la dApp](https://neltud.github.io/xArtists/) et sa [feuille de route](https://neltud.github.io/xArtists/roadmap/).

Pour vérifier la conservation, les développeurs peuvent utiliser `node scripts/ops/media-integrity-check.mjs --manifest <fichier.json> --file <original>` dans le dépôt. La variante `--network` télécharge uniquement depuis des gateways IPFS ou Arweave autorisés et compare les octets, **sans certifier une conservation perpétuelle**.

Sources et définitions : [IPFS — Persistance](https://docs.ipfs.tech/concepts/persistence/) · [Arweave — Upload](https://docs.ar.io/build/upload/) · [Etsy — politique NFT](https://www.etsy.com/legal/policy/non-fungible-tokens-nfts-policy/1114711452112) · [OpenSea — NFT Solana](https://support.opensea.io/en/articles/16779830-can-i-create-a-solana-nft-on-opensea).
