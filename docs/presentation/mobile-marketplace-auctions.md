---
description: Accès mobile direct au Musée, à la Marketplace, aux enchères et au Studio xArtists, avec état réel des fonctions de paiement, upload et mint.
---

# Explorer la Marketplace et les enchères sur mobile

Sur **xArtists**, les visiteurs peuvent parcourir directement les espaces
artistiques sans chercher dans les modules techniques.

## Navigation mobile — cinq accès permanents

Sur téléphone, le bandeau inférieur contient **une seule ligne** :

**Accueil · Musée · Studio · Marketplace · DAO**

Les cinq destinations restent visibles côte à côte, avec des icônes
distinctes, une zone tactile de **44 px minimum** et une prise en compte
de la zone de sécurité du téléphone. La page réserve de l'espace pour
éviter que le bandeau masque les derniers champs et actions.

Les mêmes destinations sont accessibles dans le menu et, pour la
Marketplace et les enchères, depuis l'accueil ou le menu. La DAO reste en découverte et ne signifie pas vote payant.

## Liens publics

- [Marketplace — explorer les œuvres et les packs](https://xartists.art/marketplace/)
- [Salle des enchères — œuvres et lots présentés](https://xartists.art/auction/)
- [Studio — préparer et prévisualiser un média](https://xartists.art/studio/)
- [Musée immersif](https://xartists.art/museum/)
- [Offres — demander une présentation](https://xartists.art/offres/)

Une entrée affichée dans la navigation **ne signifie pas** que son
backend transactionnel est prêt.

## Statut fonctionnel — parcours mis à jour le 11 novembre 2026

| Fonction | Visite / aperçu | Action transactionnelle |
| --- | --- | --- |
| Marketplace | Oui, trois univers (art, œuvres physiques, packs IA) | Listing vendeur prêt à signature après contrôle on-chain, premier listing post-release non prouvé ; achats et enchères distincts |
| Enchères | Oui, salle et aperçu éditorial | `auction_enabled=false`, `demo_writes_enabled=false`, aucun règlement ni transfert |
| Studio | Oui, aperçu local JPG/PNG/WebP/MP4/GLB, Lab sculpture 3D | `studio_media_upload=off` ; un fichier local n'est ni publié sur IPFS ni minté |
| Packs et offres | Oui, tarifs catalogue et demandes d'introduction | `paybox_checkout_enabled=false` et `mint_live_enabled=false` |
| xOrus | Mode paper | `lia_live_trading=0` |

Un NFT ne constitue pas en soi un titre de propriété d'une œuvre
physique ni une garantie d'authenticité.

## Pourquoi le Studio affiche « upload indisponible »

Le parcours de sélection de fichier conserve une **prévisualisation locale** :
aucune copie ne part sur IPFS quand le serveur n'est pas activé.
Il faut une intégration d'upload signée, un stockage Pinata valide,
une base de données vérifiée et un reçu de publication pour pouvoir
présenter un upload comme réussi. La signature et le mint d'un NFT
doivent rester indépendamment vérifiés.

Le bandeau d'avertissement et le bouton **Retester la connexion IPFS** apparaissent **avant le choix du
fichier** pour rendre cette limite immédiatement visible.

## Conditions de lancement des transactions

La vente, l'enchère payable, la livraison NFT et l'upload réel ont des
gates distinctes. Les issues
[#281](https://github.com/Neltud/xArtists/issues/281),
[#328](https://github.com/Neltud/xArtists/issues/328) et
[#341](https://github.com/Neltud/xArtists/issues/341)
restent les principales références de préparation.

La présente évolution concerne **l'accès mobile, la découverte et la
clarté des statuts**, sans activation de PayBox, des enchères,
du mint, d'un bridge ou du trading.
