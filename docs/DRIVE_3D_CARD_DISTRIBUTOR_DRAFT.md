# xArtists — distributeur de cartes 3D à partir de Google Drive (DRAFT / NO-GO)

## Source vérifiée le 2026-11-05
Dossier Drive **xArtists Galerie NFT collection** : `1D7_uSML8pCpXn96K3DQYxw7JFSp0Xiv1`. Inventaire de premier niveau : **291 PNG** ; l'utilisateur mentionne **281**. Ne sélectionner aucun sous-ensemble ni numéro de série sans validation du créateur. Ne pas rendre le Drive public, copier les originaux ni publier les URL de fichiers dans le frontend.

## Objectif produit
Un distributeur/minting studio sélectionne une œuvre autorisée, compose une **carte 3D** (recto : œuvre intacte en texture ; verso : provenance, titre, numéro, attributs), rend une preview, permet revue/validation, prépare métadonnées et annonce une offre marketplace. Le rendu 3D n'est pas une impression physique et ne doit pas être présenté comme telle.

## Pipeline à implémenter (aucune étape live dans cette PR)
1. **Import serveur avec OAuth minimal** : sélectionner explicitement le dossier ; lister les PNG/JPEG, paginer, capturer Drive file ID, MIME, dimensions, taille et checksum SHA-256 calculé sur les octets. Refuser SVG, archives, fichiers corrompus, dépassement de quota et doublons. L'accès Drive reste privé.
2. **Manifest stable** : `source_drive_file_id`, `source_sha256`, `edition_number`, `rights_attestation`, `render_version`, `render_sha256`, `status: draft_unminted`. En cas de mise à jour du Drive, ne pas modifier silencieusement un NFT déjà figé.
3. **Carte 3D** : conserver l'image originale en texture recto ; produire un rendu 3D séparé et un verso informatif, sans falsifier la provenance. Le modèle IA peut proposer des styles mais ne remplace pas la revue du créateur. Génération facturable interdite sans devis et approbation spécifiques.
4. **Vérification** : attestation des droits de reproduction/vente, détection de doublons, contrôle qualité et revue humaine. Enregistrer l'approbation par édition.
5. **Stockage** : pinner média et métadonnées sur IPFS avec confirmation CID et test de récupération avant de préparer un mint. Ne pas utiliser un lien Google Drive comme URI permanente de NFT.
6. **Minter** : préparation hors chaîne uniquement ; wallet connecté, collection réelle `TICKER-xxxxxx`, rôle `ESDTRoleNFTCreate` ou minter autorisé, redevances en points de base, signature explicite pour chaque transaction. Pas de PEM ou seed dans le serveur ni dans le repo.
7. **Marketplace** : prévisualisation non transactionnelle tant que le mint, la propriété, les frais, le prix, le contrat de vente et la livraison ne sont pas vérifiés. Si vente après mint, confirmer propriété et listing on-chain ; si mint-on-demand, vérifier paiement et idempotence avant création/livraison, avec réconciliation après incident.
8. **Séparation stricte** : ce catalogue d'œuvres ne crée aucun droit sur les abonnements Club + News (10 EUR/mois, off-chain) ni sur les packs Genesis Pulse/Yield/Sentinel.

## Contrôles d'acceptation
- Exactitude des 291 fichiers détectés et sélection documentée des 281 si retenus.
- 1 fichier Drive autorisé → 1 identifiant stable → 1 preview 3D traçable ; aucun doublon d'édition.
- Fichier modifié / checksum différent → nouvelle revue obligatoire.
- Échec de rendu ou de pinning → aucune annonce de mint réussi.
- Wallet non autorisé, transaction refusée, signature absente → aucun mint.
- Aucun paiement réel, déploiement, transfert blockchain, écriture Drive ou publication de collection avant GO explicite.

## Questions ouvertes
- Faut-il 291 œuvres ou seulement 281 ? Si 281, quelle règle d'exclusion exacte ?
- Quel réseau et quelle marketplace cibles, quelle collection/ticker, quels prix, quelles royalties ?
- La carte 3D est-elle uniquement numérique ou aussi imprimée physiquement ?
- Attestation de droits sur toutes les images.
