---
description: Comprendre la conservation des images et vidéos NFT xArtists : IPFS, copies de secours et vérifications.
icon: images
---

# Préserver vos œuvres : images, vidéos et NFT

**Guide public — 5 novembre 2026.** La publication d'un NFT et la conservation de son média sont deux opérations différentes. Le Studio peut préparer des fichiers et des métadonnées, mais l'upload et le mint ne sont pas annoncés comme ouverts sans validation indépendante.

## La bonne séquence

1. **Préparez un original** : JPG, PNG, WebP ou MP4, dont vous détenez les droits de publication. Conservez une copie sur votre propre appareil.
2. **Vérifiez le média** : format, taille, empreinte SHA-256. Un hash identifie le contenu exact et révèle une modification.
3. **Publiez sur IPFS lorsque le service Studio est activé** : le backend xArtists utilise Pinata avec une clé gardée côté serveur. Il retourne une adresse `ipfs://...` fondée sur un identifiant de contenu appelé **CID**.
4. **Récupérez et contrôlez le fichier publié** : un accusé réception d'upload ne suffit pas. Les octets téléchargés doivent produire la même empreinte SHA-256 que l'original. Pour un fichier emballé dans un répertoire IPFS, vérifiez bien le chemin complet de l'œuvre.
5. **Prévoyez des copies indépendantes** : un second hébergeur IPFS et, lorsqu'il sera configuré et financé, une archive longue durée Arweave. Gardez également une sauvegarde privée et vérifiez périodiquement que les copies sont lisibles.
6. **Publiez les métadonnées** : titre, description, attributs, URI de l'image ou de la vidéo. Un changement nécessite un nouvel historique de version ; ne pas prétendre qu'un fichier modifié conserve son CID d'origine.
7. **Signez le mint dans votre propre wallet** : seules une transaction blockchain confirmée et la vérification de sa propriété prouvent que le NFT existe.

## Ce que chaque service peut et ne peut pas faire

| Service | Usage adapté | Ce qu'il ne garantit pas |
| --- | --- | --- |
| IPFS + Pinata | Adresses stables par contenu, stockage public, métadonnées et images NFT | Qu'un opérateur conservera les octets indéfiniment |
| Arweave | Archivage à très long terme des originaux et des preuves publics, après paiement initial | Une garantie physique absolue d'accès éternel |
| Google Drive privé | Copie de secours chiffrée ou organisée, récupération en cas d'incident | Une base NFT décentralisée, un CID ou une archive immuable |
| GitBook | Guides, provenance publique lisible et liens vers les preuves | Le stockage primaire des originaux vidéo |
| PostgreSQL / Neon | Recherche, références, index et suivi d'états | Un journal immuable sans politique explicite d'intégrité |

## Votre fiche de conservation

Quand une publication Studio reçoit un retour valide du backend, xArtists peut proposer une **fiche JSON téléchargeable** avec l'URI du média, l'empreinte SHA-256, la taille, le MIME, l'URI des métadonnées et les lieux de stockage complémentaires **encore à confirmer**.

Cette fiche n'est **pas** une preuve que le fichier existe sur plusieurs hébergeurs. Une copie ne sera considérée comme contrôlée qu'après une vérification de récupération et d'intégrité correspondante.

**N'envoyez jamais** des pièces d'identité, coordonnées personnelles, clés privées, images confidentielles ou œuvres publiées sans autorisation vers une archive publique difficile à retirer.

## Vendre une œuvre : ne pas confondre les réseaux

- **MultiversX :** NFT effectivement créé et signé par son artiste avant tout listing, éventuellement sur une marketplace compatible.
- **Polygon et Solana :** chaque réseau nécessite un vrai mint et un listing propres ; afficher une œuvre sur OpenSea ne crée pas automatiquement son NFT.
- **Œuvres physiques :** provenance, possession, transport et conditions de vente doivent être établis séparément. Un NFT ne transfère pas automatiquement la propriété matérielle.

Les ventes NFT ne sont pas proposées sur Etsy, dont la politique les interdit.

## État public du service

**Navigation et préparation : accessibles. Upload IPFS via le Studio : conditionnel. Sauvegarde Arweave automatique, deuxième pin indépendant et mint garanti : non attestés.** Les paiements et la livraison NFT restent sujets à des preuves de sécurité distinctes, sans date de lancement promise.

[Découvrir le Studio](https://neltud.github.io/xArtists/studio/) · [Feuille de route publique](https://neltud.github.io/xArtists/roadmap/) · [Documents techniques sur GitHub](https://github.com/Neltud/xArtists/blob/main/docs/CREATOR_MEDIA_UPLOAD_IPFS.md)

**Références :** [IPFS — Persistance et pinning](https://docs.ipfs.tech/concepts/persistence/) · [Arweave — Archivage long terme](https://docs.ar.io/learn/what-is-arweave) · [Etsy — Politique NFT](https://www.etsy.com/legal/policy/non-fungible-tokens-nfts-policy/1114711452112)
