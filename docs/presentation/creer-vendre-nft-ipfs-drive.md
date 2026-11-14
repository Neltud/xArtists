---
description: >-
  Vendre son NFT, créer un NFT de sculpture et utiliser des œuvres Drive sans
  divulguer les originaux.
icon: palette
---

# Vendre son NFT, sculpture et Drive

**Guide d'utilisation, mis à jour le 14 novembre 2026 · version publique 0.139.0 (SHA `7b280ccf…`).** [DApp xArtists](https://xartists.art/) · [Statut des fonctions](etat-du-produit.md).

## Vendre un NFT que je possède

1. Ouvrir [**Vendre mon NFT**](https://xartists.art/marketplace/#xa-market-sell). Connecter un wallet capable de signer sur **MultiversX mainnet**.
2. Rechercher une œuvre par nom, collection ou identifiant dans **Mes NFT**. La recherche porte sur les 100 NFT chargés, même lorsque la grille n'en montre que 48. Un actif Genesis, une image privée non mintée ou un NFT sans preuve de propriété ne peut pas être listé à partir de cette action.
3. Renseigner le prix exact en **EGLD**, lire les frais et **royalties du créateur récupérés on-chain**. Vérifier les adresses et le contrat affichés.
4. Confirmer la préparation puis **signer soi-même** le transfert vers le contrat d'escrow. Le bouton et le retour xPortal ne valent pas preuve de listing.
5. Vérifier la transaction `success` et le listing actif dans [Explorer MultiversX](https://explorer.multiversx.com/). En cas de réseau ou de vérification indisponible, l'action reste bloquée, pas simulée.

Une adresse en lecture seule permet de consulter la préparation ; elle ne permet pas de signer. Changer d'œuvre remet le prix et les frais confirmés à zéro. Fermer la fiche, modifier le prix ou changer de wallet pendant une vérification annule cette tentative. Une réponse réseau tardive ne doit pas ouvrir le signataire. Une transaction déjà présentée au wallet ou diffusée ne peut pas être annulée en fermant cette fiche : vérifier son état dans le wallet et Explorer.

**Important :** le frontend vendeur est déployé, mais le nouveau cycle listing → escrow → achat par un autre wallet → réception n'a pas été certifié pour ouvrir la marketplace au grand public ([#428](https://github.com/Neltud/xArtists/issues/428)). La preuve de connexion xPortal/Reown sur le domaine public est encore bloquante ([#506](https://github.com/Neltud/xArtists/issues/506)). Le checkout acheteur et les enchères exigent des autorisations indépendantes.

## Créer le NFT de ma sculpture

1. Dans le [**Lab sculpture 3D**](https://xartists.art/lab/?view=3d), charger entre **4 et 36 photos**, une vidéo MP4 ou un modèle **GLB** existant. L'aperçu et la rotation sont locaux.
2. Pour une **reconstruction 3D fidèle**, préparer de nombreux angles calibrés et une mire d'échelle puis suivre le [laboratoire de jumeau numérique](https://xartists.art/create/digital-twin/). Le navigateur ne fabrique pas automatiquement un maillage certifié à partir de quatre photos.
3. Ouvrir [**Studio sculpture**](https://xartists.art/studio/?mode=sculpture), connecter son wallet et sélectionner sa collection. Si nécessaire, émettre une collection NFT et demander le rôle `ESDTRoleNFTCreate` avec les transactions officielles signées.
4. Préparer un média JPG/PNG/WebP (16 Mio), MP4 (48 Mio), ou GLB (32 Mio) avec image de couverture. Attester ses **droits sur l'œuvre et sa reproduction**. L'upload IPFS nécessite le backend et une session artiste signée ; si OFF, utiliser une URI IPFS/HTTPS hébergée par le créateur.
5. Lire l'URI média et le CID des métadonnées vérifiables, puis signer **le mint NFT** personnellement. Attendre Explorer `success`, la présence du NFT dans son wallet et un contrôle des médias.

Le modèle 3D, la propriété de la sculpture physique et la licence de droits d'auteur sont des faits distincts. Aucun certificat métrique, livraison physique ni récompense en TRO ne découle automatiquement d'une photo ou d'un mint.

## Mes images sont déjà dans Google Drive

Une collection xArtists contient **291 PNG** et un sous-dossier historique **4 MP4** (inventaire de métadonnées uniquement). **Il ne s'agit pas de NFT mintés et aucune permission de redistribution n'en découle.**

Depuis votre compte Drive, choisir l'œuvre autorisée, télécharger une **copie locale** puis la préparer dans le [Studio](https://xartists.art/studio/#xa-studio-mint). Depuis la [PR #592](https://github.com/Neltud/xArtists/pull/592), ces originaux ne figurent **plus** dans le catalogue NFT public : seules les données de NFT réels consultées sur MultiversX, ou des entrées d'index externe explicitement non vérifiées, doivent y apparaître. Les visuels d'atelier du musée restent de simples aperçus artistiques. Ne pas régler le partage Drive sur « public » pour contourner le backend, ne pas insérer de lien Drive privé dans un NFT, et ne pas diffuser les IDs et les dossiers d'autres artistes.

Pour une importation par lots avec distributeur, il faut l'attestation des droits de **chaque œuvre**, un manifeste SHA-256 basé sur les octets, des CIDs persistants, la conservation des originaux sur un **serveur privé** et sa sauvegarde vérifiée, une validation antidupliquée, puis les signatures du minter. L'outil d'archivage privé de #592 est disponible dans le dépôt mais **aucun original réel n'a été archivé**, et aucune copie Kubo ni Pinata n'a été épinglée par cette PR. Le token NFT demeure sur MultiversX ; le serveur conserve les médias et les preuves. La [NFT Factory](https://xartists.art/create/nft-factory/) ne fait actuellement que des brouillons paper : pas de mint automatique.

## Publication IPFS : pourquoi le bouton peut être bloqué

**État constaté le 14 novembre 2026 : upload OFF, Studio HTTP 503, `migration_004_missing`**. Le PostgreSQL de l'API Render est **externe** ; il faut identifier sa destination et valider une sauvegarde avant d'exécuter la migration 004, puis 005, et seulement ensuite 006 si le GLB est prévu. Ne pas appliquer ces migrations à une sandbox Neon sans preuve de liaison au runtime. L'upload signé dépend aussi de `CREATOR_MEDIA_UPLOAD_ENABLED`, d'une clé Pinata côté serveur, de la signature xPortal/SIWX, des quotas et des sessions de 15 minutes. Le GLB nécessite en plus `STUDIO_GLB_UPLOAD_ENABLED`. L'option Kubo auto-hébergée a un fichier Docker Compose inactif et **n'est pas raccordée** à l'upload Studio. [Runbook opérateur](https://github.com/Neltud/xArtists/blob/main/docs/ops/BACKEND_IPFS_ACTIVATION_2026-11-11.md).

Ne transmettez **aucune clé privée, seed, PEM, clé API ou mot de passe** à un support. Un CID seul ne prouve pas un mint ; un mint ne prouve pas le transfert de l'œuvre physique.
