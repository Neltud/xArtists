# xArtists — staging privé d'œuvres depuis Google Drive (11 novembre 2026)

## État de la connexion et découverte

Le connecteur Google Drive a permis d'identifier plusieurs dossiers xArtists (archives originales privées, collections historiques, galerie NFT) et une recherche d'**au moins 50 images** à noms xArtists / PNG. Les dossiers inspectés individuellement peuvent être vides ; un résultat de recherche global n'établit **ni la relation collection→média, ni les droits, ni une présence sur IPFS**.

**Aucun ID de fichier Drive privé, URL de partage, email, secret, fichier source ou média n'est inclus dans ce dépôt. Aucun fichier n'a été téléchargé, diffusé, épinglé ou minté par ce travail.**

## Export local sécurisé, jamais depuis le navigateur public

Après sélection explicite des œuvres par l'artiste, créer localement un export de métadonnées Google Drive (format `files` avec seulement `name`, `mimeType`, `size`) ; éviter les IDs si inutiles. Le script traite aussi les champs `title`, `mime_type`, `size` provenant d'un export compatible.

Exemple **fictif** et non issu des médias réels :

```json
{
  "files": [
    {"name": "example-art.png", "mimeType": "image/png", "size": "150000"}
  ]
}
```

Exécuter en environnement privé, sans committer l'entrée ou la sortie :

```sh
node --test scripts/ops/prepare-drive-nft-staging.test.mjs
node scripts/ops/prepare-drive-nft-staging.mjs /private/drive-metadata.json /private/xartists-nft-review.json
```

Le fichier de sortie est créé en permissions utilisateur `0600`, avec rejet du remplacement d'un fichier existant. L'export **supprime** les IDs Drive, les URL privées, les informations de propriétaires et toute fausse preuve. Il rejette les médias hors périmètre, fichiers trop volumineux, chemins, URLs et formats incohérents. Les collisions de titres exigent une revue.

## Invariants du distributeur

Pour chaque candidat : `status=PAPER_METADATA_DRAFT`, `rightsDeclared=false`, `rightsVerified=false`, `contentSha256=null`, `mediaCid=null`, `metadataCid=null`, `mintAllowed=false`, `minted=false`. La liste n'est **pas** une collection NFT existante.

Le workflow réel demeure séparé : (1) déclaration de droits par œuvre ; (2) possession et intégrité des **octets originaux**, SHA-256 vérifié localement ; (3) création d'un catalogue revu et de métadonnées par token ; (4) upload authentifié via `creatorMedia` après contrôle du serveur, quotas, consentement et Pinata correctement configuré ; (5) vérification des CIDs et des images sur deux passerelles ; (6) signature manuelle explicite du minter autorisé sur MultiversX ; (7) preuve de réception on-chain et lien de livraison.

Le script n'est pas un connecteur OAuth Google Drive intégré au navigateur. Il ne modifie ni `CREATOR_MEDIA_UPLOAD_ENABLED`, ni `STUDIO_GLB_UPLOAD_ENABLED`, ni les règles de mint/distributeur. **Aucun achat ou mint automatique** n'est permis.
