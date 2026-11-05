# Marketplace NFT xArtists — OpenSea Solana / Polygon (phase 1)

**Édition : 5 novembre 2026.** Intégration de découverte **read-only**, sans aucun mint, listing, offre, paiement, relayer, transaction ou signature xArtists.

## Surfaces livrées dans la PR

- Marketplace existante `/marketplace?tab=opensea` et `/explore/market?tab=opensea` : nouvel onglet pour choisir `solana` ou `polygon`, saisir un **slug de collection OpenSea**, consulter des métadonnées réellement retournées et ouvrir les liens externes du fournisseur.
- API xArtists : `GET /v1/marketplace/opensea/collection?chain=solana|polygon&slug=...` (clé API uniquement côté serveur). Réponses explicites `read_only`, `on_site_order_enabled=false`, `listing_verified=false`, `price=null`.
- Avant les NFT, le backend interroge `GET https://api.opensea.io/api/v2/collections/{slug}` et vérifie que les `contracts[].chain` incluent **exactement** la chaîne demandée ; sinon HTTP 409. Il interroge ensuite `GET /api/v2/collection/{slug}/nfts?limit=20`.
- Pas de listing « achetable » déduit d'une simple image, collection ou activité on-chain. Liens sortants obligatoirement en `https://opensea.io`, affichage des médias HTTPS, sans clés, données PII ni approval demandés dans le navigateur. Requêtes limitées par slug, taille de réponse, délai de 8 s et cache serveur 60 s. Les erreurs fournisseur sont expurgées.

## Préparation serveur (séparée de la fusion)

1. Dans **Render — xartists-access-api**, définir `OPEN_SEA_API_KEY` via l'interface de secrets et les permissions minimales du workspace. **Ne jamais écrire la clé dans GitHub, un `VITE_*`, une issue, une URL, un log ou cette documentation.**
2. Après déploiement automatique de la branche principale **et uniquement après CI verte + revue**, contrôler `GET /health` : `opensea_preview_configured=true` et `opensea_order_execution_enabled=false`.
3. Tester par navigateur le GET pour **une collection Polygon connue du fournisseur** et **une collection Solana effectivement couverte**. Le slug doit être déterminé par la vraie page de la collection, non inféré d'un mint address ou du wallet du créateur.
4. Confirmer CORS depuis la véritable URL Pages et le frontend Render, le comportement en HTTP 401/429/502, la réactivité mobile (360–430px), les images invalides et la conformité légale, puis enregistrer SHA, date, réponses expurgées et tests.
5. Si OpenSea API n'est pas configurée, l'onglet affiche explicitement l'indisponibilité, avec un lien de consultation vers OpenSea. Il n'utilise **aucune** donnée fictive et ne bascule pas vers un endpoint non authentifié.

## Support OpenSea : limites importantes

- **Solana** : OpenSea a ouvert la découverte, la vente et les offres sur *certaines* collections seulement. OpenSea **Studio ne crée ni mint ni drop Solana**. Création Solana à spécifier séparément avec un standard compatible (Metaplex Core / legacy / compressed, etc.), stockage/IPFS, validation des droits et signature wallet native. Ne jamais diriger un wallet EVM vers Solana ou supposer qu'un SPL mint apparaît automatiquement dans OpenSea.
- **Polygon** : réseau EVM et outils de création OpenSea Studio disponibles pour des standards pris en charge. Toute nouvelle collection requiert néanmoins un deploy signé par son propriétaire, revue ERC-721/1155, vérification du contrat, royalty/fees et gas.
- **MultiversX** : catalogue et règlement xArtists indépendants ; ne pas annoncer un bridge ou une cotation OpenSea des SFT MultiversX par simple intégration API.
- L'intégration lira uniquement des **métadonnées**, pas des prix ni un carnet de commandes exécutable. Une proposition « liste mon NFT sur OpenSea » doit être effectuée dans OpenSea par l'artiste et son wallet. Pour l'intégration des signatures dans xArtists, un projet distinct doit vérifier la prise en charge *exacte* des actions de vente Solana vs EVM, permissions, replays, frais et règlement.

## Critères de passage phase 2 : mint / listings xArtists Solana & Polygon

- [ ] Modèle de droits/consentement (artiste humain ou agent avec mandat explicite), media IPFS durable, métadonnées versionnées, C2PA/provenance et signalement.
- [ ] Collection deployer wallet contrôlé, chain ID exact Polygon (137) / cluster Solana mainnet, tests devnet/testnet et preuve ownership du NFT sur explorateur.
- [ ] Parcours de transaction découpé : **prévisualisation → frais/gas et contrat → approbation wallet humain → confirmation finalisée → indexation → listing/vente**.
- [ ] Un vendeur ne peut pas proposer un NFT d'un autre portefeuille ; signature, expiration, annulation et révocation obligatoires. Aucun wallet secret côté xArtists.
- [ ] Validation de l'ordre, maker, chain, nft identifier, payee, currency, prix atomique, droits d'auteur, reorg/finality avant tout état « vendu ».
- [ ] Reconciliation multi-indexer et preuves de vente, gestion annulation/expiration, litiges, fiscalité et remboursements selon rail.
- [ ] Audit de sécurité indépendant, revue humaine de la release, nouveaux flags distincts par chain, aucun lien implicite avec `paybox_checkout_enabled`, `mint_live_enabled`, `LIA_LIVE_TRADING` ou le bridge TRO.

## Références

- https://docs.opensea.io/reference/api-overview
- https://docs.opensea.io/reference/get_collection
- https://docs.opensea.io/reference/get_nfts_by_collection
- https://support.opensea.io/en/articles/16779867-does-the-opensea-api-return-solana-nfts
- https://support.opensea.io/en/articles/16779830-can-i-create-a-solana-nft-on-opensea
- https://support.opensea.io/en/articles/16779826-which-solana-collections-are-on-opensea

**NO-GO mainnet financial unchanged** : issue #281 S1/S2 mint/delivery, #328 domain isolation et #353 wallet control restent séparées du catalogue OpenSea.
