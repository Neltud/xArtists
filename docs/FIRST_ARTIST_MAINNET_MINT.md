# Premier mint d'artiste xArtists · MultiversX mainnet

**État actuel (2 novembre 2026) :** dApp Studio accessible, transactions proposées par wallet personnel, **upload Pinata côté Render désactivé**. Aucune preuve d'un premier mint artiste validé dans ce chantier. Ne pas confondre installation logicielle, upload IPFS et mint on-chain.

## Inventaire de l'infrastructure vérifiée

- dApp : https://neltud.github.io/xArtists/studio
- API : https://xartists-access-api.onrender.com/health
- Configuration upload : https://xartists-access-api.onrender.com/v1/studio/media/config
- Render : service **xartists-access-api**, autoDeploy sur la branche main, plan free.
- API santé : Postgres est configuré pour les commandes ; ceci **ne confirme pas** que la table des médias a été initialisée.
- Neon : projet **xartists-access-sandbox** dans eu-central-1, branche sandbox. Le connecteur Neon n'expose pour l'instant que paybox_orders en table publique (hors tables neon_auth). Attention, il faut vérifier que l'URL de base Render cible réellement ce projet avant toute migration.
- Aucun connecteur Pinata lié à ChatGPT ; la clé PINATA_JWT doit être créée sur le compte Pinata autorisé, puis saisie **uniquement dans les secrets Render**, jamais dans un chat, fichier public ou VITE_... .

## Préflight opérationnel : NO-GO jusqu'à preuves vérifiées

1. **Choisir une base durable et sécurisée.** Vérifier la cible PostgreSQL Render et ses accès. Appliquer la migration autorisée pour la table xartists_studio_media et les index de quota, avec les droits SQL minimaux nécessaires.
2. **Préparer Pinata.** Compte/plan validé, JWT dédié aux opérations de pin file + JSON, plafonds et coûts de stockage surveillés. Vérifier le secret sans l'exposer et configurer les notifications de saturation.
3. **Configurer Render.** Variables : DATABASE_URL, ACCESS_JWT_SECRET (existant), PINATA_JWT (secret serveur), CORS_ORIGIN pointant sur l'origine GitHub Pages ; activer CREATOR_MEDIA_UPLOAD_ENABLED=1 **uniquement** après revue de sécurité, migration et tests de bout en bout.
4. **Contrôler l'API** avec GET /v1/studio/media/config : enabled doit passer à true. Il faut ensuite réussir un upload réel depuis un wallet xPortal, inspecter une URI IPFS publique avec l'extension .jpg/.png/.webp/.mp4 et son JSON de métadonnées.
5. **Autoriser seulement l'artiste à minter.** Dans /studio, connecter son wallet personnel, sélectionner une collection déjà détenue ou émettre une nouvelle collection sous contrôle du wallet, et contrôler le rôle ESDTRoleNFTCreate sur la collection.
6. **Créer le NFT à l'aide d'une URI réellement publiée.** Titre, droits, royalties, URI public IPFS, métadonnées. Le wallet xPortal/Web Wallet indique les détails et frais avant signature : l'artiste doit les lire puis signer lui-même.
7. **Prouver le résultat** : hash transaction mainnet avec statut success, sender et receiver corrects, endpoint ESDTNFTCreate, token NFT identifiable par nonce dans la collection, créateur/wallet et médias/attributs concordants, indexation observable sur Explorer et dans l'API. Capturer hash, token ID, CID, horodatage et témoignage de l'artiste (sans secret).
8. **Vérifier le rendu utilisateur** : aperçu image ou MP4, miniature, latence, état mobile, refresh et erreurs. Aucune annonce « premier NFT live » sans ces preuves.
9. **Marketplace** : le mint ne met pas automatiquement un NFT en vente. Contrôle indépendant du SC marketplace (adresse + codehash frais), approbation du listing et signature utilisateur. Aucune offre live sans index confirmé.

## Étapes interdites sans validation

- Signer ou diffuser un mint au nom d'un artiste, utiliser un secret de wallet, envoyer des fonds, utiliser Paybox pour une transaction NFT Studio, changer les rôles sans accord du wallet.
- Simuler un CID, un prix, une vente ou un token Solana et les afficher comme réels.
- Activer le service sans maîtrise des coûts Pinata et du risque de contenu interdit sur IPFS.

## Tableau de recette

| Preuve | Statut |
| --- | --- |
| Studio visible avec JPG/PNG/WebP/MP4 | Vérifié |
| Render API et PostgreSQL présent | API vérifiée ; identité de la base à confirmer |
| Compte et secret Pinata affectés à la production | Non démontré |
| Migration médias appliquée à la bonne base | Non démontrée |
| Upload signé et CID publiquement disponible | Non démontré |
| Signature artiste de ESDTNFTCreate | Opération humaine requise |
| Tx mainnet success et NFT indexé | Non démontré |
| Listing marketplace/vente contrôlée | Gated, indépendant du mint |

## Documentation de référence

- [NFTs MultiversX / rôle ESDTRoleNFTCreate](https://docs.multiversx.com/tokens/nft-tokens/)
- [API Pinata / pinFileToIPFS et pinJSONToIPFS](https://github.com/PinataCloud/docs/blob/main/pinata-api-ipfs.yaml)
- [Guide opérationnel média du projet](CREATOR_MEDIA_UPLOAD_IPFS.md)
