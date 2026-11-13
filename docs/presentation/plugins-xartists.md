---
description: Les plugins xArtists et leurs conditions réelles de disponibilité et de licence.
icon: puzzle-piece
---

# Plugins xArtists : xRights, NFT Factory et xOrus

**Mise à jour du 11 novembre 2026.** Les interfaces de préparation et les plugins commercialisables sont deux produits distincts.

## xRights — licences et royalties sociales

[Ouvrir l'atelier xRights](https://xartists.art/create/world-rights/) pour créer localement un dossier de droits, renseigner les œuvres sociales, préparer les conditions de licence et exporter un brouillon JSON. Certaines vues offrent un contrôle YouTube en lecture seule **uniquement si** le backend OAuth est configuré.

Le ZIP commercial, l'installation sur tous les navigateurs et la connexion OAuth à chaque réseau ne sont **pas** des services activés. La licence payante et l'exception pour le wallet propriétaire nécessitent des **entitlements vérifiés côté serveur** ; aucun lien public ZIP non authentifié ni fichier payant gratuit n'est exposé.

## NFT Factory et distributeurs

[Ouvrir NFT Factory](https://xartists.art/create/nft-factory/) pour préparer les noms, variantes, traits, exemplaires et règles de distribution d'une collection. Les esquisses n'exécutent ni génération payante, ni `buyPack`, ni mint, ni dépôt d'inventaire.

**Distribution réelle :** pièces d'identité du créateur et preuves des droits si nécessaire, métadonnées IPFS réellement publiées, contrat vérifié, anti-doublon, royalties, preuve d'escrow / remboursement, audit des frais, puis une action wallet humaine autorisée.

## xOrus — plugin d'intelligence en préparation

[xOrus](https://xartists.art/intelligence/xorus/) prépare **nos analyses** : synthèses, scénarios conditionnels et évaluations de risque. Les données collectées servent d'entrées internes et ne sont pas revendues. Le générateur local produit un rapport dérivé en mode **paper** ; l'aperçu public contient zéro entrée. Le paquet `packages/xorus-agent` définit une future interface de lecture de rapports d'analyse, **pas** une connexion MCP commerciale déjà disponible. La livraison privée, les sources actives et les droits d'accès restent à connecter.

## Limites communes

Aucune page n'accepte de seed, PEM, JWT Pinata ou secret OAuth. Les droits d'auteur d'un créateur ne sont pas prouvés par une case cochée. L'abonnement fiat, la possession NFT et la licence logicielle restent des droits séparés. Un bouton visible ne vaut pas disponibilité d'un service payant.

[Guide créateurs](creer-vendre-nft-ipfs-drive.md) · [Statut du produit](etat-du-produit.md) · [Dépôt GitHub](https://github.com/Neltud/xArtists)
