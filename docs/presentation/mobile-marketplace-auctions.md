---
description: Accès mobile direct au Musée, à la Marketplace, aux enchères et au Studio xArtists, avec état réel des fonctions de paiement, upload et mint.
---

# Explorer la Marketplace et les enchères sur mobile

Sur **xArtists**, les visiteurs peuvent parcourir directement les espaces
artistiques sans chercher dans les modules techniques.

## Navigation mobile — cinq accès permanents

Sur téléphone, le bandeau inférieur contient **une seule ligne** :

**Accueil · Musée · Marketplace · Enchères · Studio**

Les cinq destinations restent visibles côte à côte, avec des icônes
distinctes, une zone tactile de **44 px minimum** et une prise en compte
de la zone de sécurité du téléphone. La page réserve de l'espace pour
éviter que le bandeau masque les derniers champs et actions.

Les mêmes destinations sont accessibles dans le menu et, pour la
Marketplace et les enchères, depuis l'accueil.

## Liens publics

- [Marketplace — explorer les œuvres et les packs](https://neltud.github.io/xArtists/marketplace/)
- [Salle des enchères — œuvres et lots présentés](https://neltud.github.io/xArtists/auction/)
- [Studio — préparer et prévisualiser un média](https://neltud.github.io/xArtists/studio/)
- [Musée immersif](https://neltud.github.io/xArtists/museum/)
- [Offres — demander une présentation](https://neltud.github.io/xArtists/offres/)

Une entrée affichée dans la navigation **ne signifie pas** que son
backend transactionnel est prêt.

## Statut fonctionnel — relevé API du 3 novembre 2026

| Fonction | Visite / aperçu | Action transactionnelle |
| --- | --- | --- |
| Marketplace | Oui, trois univers (art, œuvres physiques, packs IA) | Index de ventes et achats réels non validés |
| Enchères | Oui, salle et aperçu éditorial | `auction_enabled=false`, `demo_writes_enabled=false`, aucun règlement ni transfert |
| Studio | Oui, aperçu local JPG/PNG/WebP/MP4 | `studio_media_upload=off` ; un fichier local n'est ni publié sur IPFS ni minté |
| Packs et offres | Oui, tarifs catalogue et demandes d'introduction | `paybox_checkout_enabled=false` et `mint_live_enabled=false` |
| LIA | Mode paper | `lia_live_trading=0` |

Un NFT ne constitue pas en soi un titre de propriété d'une œuvre
physique ni une garantie d'authenticité.

## Pourquoi le Studio affiche « upload indisponible »

Le parcours de sélection de fichier est une **prévisualisation locale** :
aucune copie ne part sur IPFS quand le serveur n'est pas activé.
Il faut une intégration d'upload signée, un stockage Pinata valide,
une base de données vérifiée et un reçu de publication pour pouvoir
présenter un upload comme réussi. La signature et le mint d'un NFT
doivent rester indépendamment vérifiés.

Le bandeau d'avertissement apparaît maintenant **avant le choix du
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
