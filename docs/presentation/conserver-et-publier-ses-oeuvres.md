# Conserver et publier une œuvre avec xArtists

Une image téléchargée n'est pas encore un NFT. Une publication NFT n'est pas non plus une garantie de conservation éternelle.

## Les étapes de l'artiste

1. **Préparer le fichier** original (JPG, PNG, WebP ou MP4), sa description, son titre et ses droits de publication. Garder une copie privée.
2. **Signer la connexion à votre wallet** quand le service d'upload xArtists est activé. L'upload n'est pas actif tant que ses contrôles ne sont pas validés.
3. **Publier le média sur IPFS** depuis le Studio, obtenir son CID, puis vérifier que la photo ou la vidéo est accessible sans perdre de données.
4. **Préparer les métadonnées NFT**, avec la même référence vers le média et les informations de propriété intellectuelle exactes.
5. **Archiver une deuxième copie indépendante** : autre hébergeur IPFS et, sur décision du créateur et après validation du prix, Arweave pour un archivage de longue durée.
6. **Minter le NFT seulement après validation**, en signant la transaction dans le portefeuille de l'artiste. Vérifier le NFT sur l'explorateur avant d'en annoncer la propriété ou la mise en vente.
7. **Proposer la collection sur une place compatible** uniquement après vérification de la blockchain, du contrat et des conditions de vente.

## Où se trouvent les fichiers ?

| Emplacement | Rôle | Peut remplacer les autres ? |
| --- | --- | --- |
| IPFS + épinglage | Référence de l'œuvre par identifiant de contenu (CID) | Non : le contenu doit rester hébergé |
| Arweave (option) | Archivage payé pour une conservation durable | Non : disponibilité et compatibilité doivent rester contrôlées |
| Sauvegarde Drive privée | Restauration de l'original et des sources de travail | Non : ce n'est pas la source du NFT |
| Google Drive public | Diffusion volontaire d'aperçus dont les droits sont validés | Non : l'accès public ne prouve ni propriété ni immutabilité |
| xArtists / GitBook | Présentation, droits, notices, documents et liens vers les preuves | Non : ce sont des vitrines, pas des registres de NFT |
| Blockchain d'émission | NFT, transactions et preuve de propriété | Non : le média complet est généralement hors chaîne |

Deux liens qui affichent la même image IPFS ne prouvent pas qu'il existe deux copies indépendantes. L'archive est vérifiée par **retéléchargement et comparaison SHA-256**, à plusieurs dates. Aucune technique ne promet littéralement « pour toujours ».

## Où vendre ?

- **xArtists** : découverte et Studio. Les fonctions financières restent fermées tant qu'elles n'ont pas passé leurs contrôles.
- **OpenSea / Polygon** : pour des collections EVM compatibles, via les procédures signées et vérifiées du fournisseur.
- **OpenSea / Solana** : certaines collections Solana déjà existantes peuvent être vendues ; la création de NFT Solana n'est **pas** disponible dans OpenSea Studio.
- **Marchés MultiversX compatibles** : uniquement pour les collections NFT effectivement détenues et reconnues sur cette chaîne.
- **Galeries / boutique physique** : les œuvres physiques peuvent disposer de leur propre processus commercial. Ne pas confondre cet achat avec le transfert d'un NFT.
- **Etsy** : la vente de NFT n'y est pas autorisée.

## Ce qui reste à valider

L'upload Pinata signé existe dans le code, mais son activation publique dépend de la configuration serveur, des secrets, du stockage et des tests réels. Les uploads, coûts d'archivage, mints, ventes et transferts **ne sont jamais déclenchés par la lecture de cette page**.

[Découvrir le Studio](https://neltud.github.io/xArtists/studio/) · [Feuille de route](https://neltud.github.io/xArtists/roadmap/) · [Code public](https://github.com/Neltud/xArtists)

## Sources utiles

- [IPFS — persistance et épinglage](https://docs.ipfs.tech/concepts/persistence/)
- [Arweave / ar.io — fonctionnement de l'archivage](https://docs.ar.io/learn/what-is-arweave)
- [OpenSea — création NFT Solana](https://support.opensea.io/en/articles/16779830-can-i-create-a-solana-nft-on-opensea)
- [Etsy — politique NFT](https://www.etsy.com/legal/policy/non-fungible-tokens-nfts-policy/1114711452112)
