# xArtists — Réparation des médias Pulse et préflight des annonces EGLD

**Date :** 6 novembre 2026. **Mode :** lecture seule / préparation. **Opérateur déclaré :** Grok (administrateur opérationnel du wallet de déploiement xArtists, selon le propriétaire). Cela **ne constitue pas** une attestation de possession de clé, de rôle ESDT ou de pouvoir de signer. Aucune transaction n'a été soumise par ChatGPT.

## Constat vérifié sur la chaîne

- Collection mainnet `XAIPLS-2cf72b` : NFTs `-01`, `-02`, `-03`, `-04` visibles. `XAIPLS-2cf72b-05` retourne HTTP 404 au 06/11/2026.
- Les quatre NFTs possèdent des URIs vides et une image par défaut `https://media.multiversx.com/nfts/thumbnail/default.png`. Donc le mint n'a pas associé les médias personnalisés ; il ne s'agit pas d'un simple problème de cache wallet.
- Le wallet public documenté propriétaire de la collection `erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g` détient les NFT `XAIPLS-2cf72b-03` et `-04` (API de consultation publique), **pas preuve** qu'il détient chaque collection xArtists ou qu'il est le wallet du demandeur.
- L'API `/v1/studio/media/config` sous `api.xartists.art` ne répond pas de façon exploitable depuis le navigateur d'audit ; la disponibilité IPFS n'a **pas été prouvée**. Les fichiers Drive existent, mais **un fichier Drive n'est pas un CID IPFS**.
- Une URI on-chain n'est pas suffisante sans vérification des octets depuis au moins deux gateways et stockage répliqué.

Sources : https://explorer.multiversx.com/collections/XAIPLS-2cf72b et https://api.multiversx.com/nfts?collection=XAIPLS-2cf72b. Guide officiel des rôles : https://docs.multiversx.com/tokens/nft-tokens/.

## Mandat opérationnel à Grok (aucune signature automatique)

### Réparer Pulse #001–004
1. **Inventaire signé et rôle ESDT :** identifier on-chain le propriétaire gestionnaire de la collection, l'adresse du minter autorisé et les rôles de mise à jour `ESDTRoleNFTAddURI`, `ESDTRoleNFTUpdate`, `ESDTRoleNFTSetNewURI` / `ESDTRoleNFTRecreate` effectivement présents. Le seul rôle `ESDTRoleNFTCreate` ne répare pas les URIs anciennes.
2. **IPFS :** activer une ingestion réelle avec clé serveur (jamais dans frontend/GitHub public), déposer recto, verso, MP4 et metadata validées et épinglées sur 2 infrastructures indépendantes ; documenter CID, SHA-256, HTTP 200, MIME et lecture intégrale des octets par gateway 1 et 2.
3. **Métadonnées :** conserver le format MultiversX et les attributs historiques (series/tier/product), valider propriété intellectuelle et l'association de chaque image au bon nonce. **Ne pas assigner #005 à un NFT inexistant.**
4. **Réparation :** simuler l'opération de mutation de métadonnées avec le contrat/gestionnaire habilité et preuve de rôle ; vérifier compatibilité de type et coût de gaz. Obtenir approbation wallet spécifique du détenteur légitime (adresse, nonce, URI, frais) avant diffusion de chaque transaction. Si le SC ne peut pas ajouter/remplacer les URI, **ne pas inventer de correctif on-chain** : présenter un catalogue off-chain véridique distinct et proposer migration signée par propriétaire.
5. **Preuve finale :** tx hash, statut success, nonce, URIs réellement visibles sur `api.multiversx.com/nfts/{identifier}`, réponses des deux gateways et affichage réel xPortal / marketplace après purge de cache.

### Lister un NFT existant par collection (EGLD)
- **Oui, en principe**, si le wallet sélectionné détient effectivement le NFT avec balance >0, possède le droit de transfert, les métadonnées médias sont valides et le contrat Marketplace prend en charge ce jeton.
- Ne pas confondre *collection owner*, *NFT holder*, *creator* et *Grok opérateur*. Le NFT est listé par son **détenteur on-chain**, via une action signée. Le propriétaire de la collection n'est pas automatiquement propriétaire de tous ses NFT.
- Le frontend est complété par un **inventaire en lecture seule** sur `/marketplace` : interrogation publique de `/accounts/{wallet}/nfts?size=100`, regroupement par collection, choix d'un nonce, prix EGLD en 18 décimales, export JSON `status: NOT_LISTED`. Il **n'envoie aucun listing ni approbation**, et ne revendique pas un inventaire complet au-delà de 100 items.
- Pour ouvrir réellement la vente : contrat Marketplace/codehash actuel vérifiés, comportement de dépôt/escrow et frais audités, listing réel on-chain, correspondance NFT+nonce, prix exact en wei, gestion de paiement/refund et livraison du NFT à l'acheteur, indices de réception dans le wallet.
- **Enchères** : exigent un contrat et des règles de clôture, dépôts, retrait et remboursement vérifiés ; aucun activation par `VITE_*` seule.
- **Distributeur aléatoire** : contrat distinct et audité, garde d'inventaire, hasard non manipulable, traitement légal, pas de vente via tirage JavaScript local. En attendant : démonstration et export papier uniquement.
- **Séparer les packs IA des NFT artistiques** : les entitlements Pulse/Yield/Sentinel ne sont pas transférés automatiquement par la vente d'une image, et réciproquement.

## Images xArtists issues du Drive du créateur

La branche `feat/drive-art-egld-readiness-20261106` publie quatre PNG originaux choisis dans `xArtists Galerie NFT collection` pour la vitrine artistique, sans invention de logos ni de sources. Le master HD Genesis Pulse #005 n'est **pas** dans les assets publics : il reste hors publication tant que son usage n'est pas validé. Ce sont des **assets statiques de présentation** et non des fichiers épinglés IPFS ou des NFT nouvellement mintés.

### Critères de clôture / GO
- [ ] Endpoint upload IPFS auth disponible et pin confirmé ; backup et 2 readbacks SHA identiques.
- [ ] Rôles ESDT de mutation validés et transaction de réparation Pulse autorisée et réussie (ou impossibilité confirmée).
- [ ] Média et métadonnées reflétés par Explorer et xPortal.
- [ ] Une vente testnet par collection candidate : listing, signature, EGLD exact, achat, transfert, royalty, frais et éventuel remboursement.
- [ ] Aucun flag commerce mainnet réarmé avant revue P0 #281 / #328 / #402 / #403 et résolution #416 si services payants concernés.

**Ne jamais coller clé privée, phrase de récupération, clef Pinata ou API OVH dans la discussion, un JSON de vente ou un issue GitHub.**
