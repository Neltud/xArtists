---
description: Vendre son NFT, créer un NFT de sculpture et utiliser des œuvres Drive sans divulguer les originaux.
icon: palette
---

# Vendre un NFT et créer une sculpture NFT

**Guide d'utilisation, mis à jour le 11 novembre 2026.** [DApp xArtists](https://xartists.art/) · [Statut des fonctions](etat-du-produit.md).

## Vendre un NFT que je possède

1. Ouvrir [**Vendre mon NFT**](https://xartists.art/marketplace/#xa-market-sell). Connecter un wallet capable de signer sur **MultiversX mainnet**.
2. Choisir une œuvre NFT détenue et éligible dans la grille **Mes NFT**. Un actif Genesis, une image privée non mintée ou un NFT sans preuve de propriété ne peut pas être listé à partir de cette action.
3. Renseigner le prix exact en **EGLD**, lire les frais et **royalties du créateur récupérés on-chain**. Vérifier les adresses et le contrat affichés.
4. Confirmer la préparation puis **signer soi-même** le transfert vers le contrat d'escrow. Le bouton et le retour xPortal ne valent pas preuve de listing.
5. Vérifier la transaction `success` et le listing actif dans [Explorer MultiversX](https://explorer.multiversx.com/). En cas de réseau ou de vérification indisponible, l'action reste bloquée, pas simulée.

**Important :** à la date du guide, la version frontend vendeurs est déployée, mais le premier nouveau listing utilisateur et son escrow n'ont pas encore été attestés. Le checkout acheteur et les enchères restent des autorisations indépendantes.

## Créer le NFT de ma sculpture

1. Dans le [**Lab sculpture 3D**](https://xartists.art/lab/?view=3d), charger entre **4 et 36 photos**, une vidéo MP4 ou un modèle **GLB** existant. L'aperçu et la rotation sont locaux.
2. Pour une **reconstruction 3D fidèle**, préparer de nombreux angles calibrés et une mire d'échelle puis suivre le [laboratoire de jumeau numérique](https://xartists.art/create/digital-twin/). Le navigateur ne fabrique pas automatiquement un maillage certifié à partir de quatre photos.
3. Ouvrir [**Studio sculpture**](https://xartists.art/studio/?mode=sculpture), connecter son wallet et sélectionner sa collection. Si nécessaire, émettre une collection NFT et demander le rôle `ESDTRoleNFTCreate` avec les transactions officielles signées.
4. Préparer un média JPG/PNG/WebP (16 Mio), MP4 (48 Mio), ou GLB (32 Mio) avec image de couverture. Attester ses **droits sur l'œuvre et sa reproduction**. L'upload IPFS nécessite le backend et une session artiste signée ; si OFF, utiliser une URI IPFS/HTTPS hébergée par le créateur.
5. Lire l'URI média et le CID des métadonnées vérifiables, puis signer **le mint NFT** personnellement. Attendre Explorer `success`, la présence du NFT dans son wallet et un contrôle des médias.

Le modèle 3D, la propriété de la sculpture physique et la licence de droits d'auteur sont des faits distincts. Aucun certificat métrique, livraison physique ni récompense en TRO ne découle automatiquement d'une photo ou d'un mint.

## Mes images sont déjà dans Google Drive

Une collection xArtists contient **291 PNG** et un sous-dossier historique **4 MP4** (inventaire de métadonnées uniquement). **Il ne s'agit pas de NFT mintés et aucune permission de redistribution n'en découle.**

Depuis votre compte Drive, choisir l'œuvre autorisée, télécharger une **copie locale** et utiliser le sélecteur de fichier du Studio. Ne pas régler le partage Drive sur « public » pour contourner le backend, ne pas insérer de lien Drive privé dans un NFT, et ne pas diffuser les IDs et les dossiers d'autres artistes.

Pour une importation par lots avec distributeur, il faut l'attestation des droits de **chaque œuvre**, un manifeste SHA-256 basé sur les octets, des CIDs persistants, la conservation des originaux, une validation antidupliquée, puis les signatures du minter. La [NFT Factory](https://xartists.art/create/nft-factory/) ne fait actuellement que des brouillons paper : pas de mint automatique.

## Publication IPFS : pourquoi le bouton peut être bloqué

L'upload signé dépend de `CREATOR_MEDIA_UPLOAD_ENABLED`, d'une clé Pinata côté serveur, du PostgreSQL avec **migrations 004 et 005**, des quotas, des sessions de 15 minutes et de l'état du backend. Les GLB demandent aussi `STUDIO_GLB_UPLOAD_ENABLED`. [Runbook opérateur](https://github.com/Neltud/xArtists/blob/main/docs/ops/BACKEND_IPFS_ACTIVATION_2026-11-11.md).

Ne transmettez **aucune clé privée, seed, PEM, clé API ou mot de passe** à un support. Un CID seul ne prouve pas un mint ; un mint ne prouve pas le transfert de l'œuvre physique.
