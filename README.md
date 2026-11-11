# xArtists · Art, NFTs, xOrus & MultiversX

**Site officiel : [xartists.art](https://xartists.art/)** · [Musée](https://xartists.art/museum/) · [Marketplace](https://xartists.art/marketplace/) · [Studio](https://xartists.art/studio/) · [GitBook](https://xartists.gitbook.io/xartists/) · [GitHub Actions](https://github.com/Neltud/xArtists/actions)

xArtists est une dApp d'art et de création : découverte sans wallet, œuvres physiques et numériques, NFT signés par leur propriétaire, outils 3D et intelligence **xOrus** (paper). Les contrats et services ont des autorisations séparées ; une interface visible ne garantit pas qu'une opération commerciale est activée.

## Les quatre parcours

| Votre objectif | Lien | Ce qui est réellement fait |
| --- | --- | --- |
| **Vendre un NFT que je possède** | [Vendre mon NFT](https://xartists.art/marketplace/#xa-market-sell) | Choisir dans le wallet, fixer un prix EGLD, vérifier les royalties et l'escrow, puis **signer personnellement** le listing ; preuve finale sur Explorer nécessaire |
| **Créer le NFT de ma sculpture** | [Studio sculpture](https://xartists.art/studio/?mode=sculpture) | Photo/vidéo ou GLB + droits + collection et rôle NFTCreate + URI IPFS/HTTPS valide + signature du minter |
| **Tourner / examiner ma sculpture** | [Lab 3D](https://xartists.art/lab/?view=3d) | Rotation locale de 4–36 photos/MP4 ; import d'un GLB existant jusqu'à 32 Mio et aperçu 3D ; pas de maillage inventé ni de certificat métrique |
| **Explorer l'intelligence paper** | [xOrus](https://xartists.art/intelligence/xorus/) | 120 **définitions** de signaux, sources datées, abstention si données insuffisantes, aucune transaction autonome |

Les identifiants historiques `/lia` et `lia/` restent en compatibilité pendant la migration vers **xOrus**. L'archive Vellum/Chorus n'est plus un moteur autorisé à lancer des transactions. Le vote externe ChatGPT est au plus de 15 % ; Sentinel garde son veto.

## État confirmé au 11 novembre 2026

- **GitHub Pages** : déploiement de `969b3a96c38aba5a1ab596535490f097079e3c8e` sur `xartists.art` vérifié par [l'Action Pages](https://github.com/Neltud/xArtists/actions/runs/43093538589), y compris lecture publique du `source_sha`. Les commits ultérieurs demandent une nouvelle vérification.
- **Marketplace vendeurs** : PR [#518](https://github.com/Neltud/xArtists/pull/518) et [#514](https://github.com/Neltud/xArtists/pull/514) intégrées ; préparation du listing de **ses propres NFT**, contrôle frais/royalties depuis la chaîne, codeHash/payable et signature wallet. **Un listing utilisateur signé sur cette version et son dépôt confirmé en escrow restent à prouver** ([issue #428](https://github.com/Neltud/xArtists/issues/428)). Les gates achat/enchères/packs sont distincts.
- **Creator Studio** : collection NFT mainnet, rôle `ESDTRoleNFTCreate`, création d'un NFT par signature personnelle. Le premier mint d'une sculpture depuis le parcours complet n'est **pas** documenté comme confirmé.
- **IPFS / GLB** : le frontend et l'API existent, mais le service sécurisé d'upload peut être **OFF** en production. Pour l'activer, vérifier les migrations PostgreSQL `004` puis `005`, le compte Pinata, le JWT serveur, les quotas et les tests de publication. Le switch GLB est supplémentaire. **Aucune clé n'est placée dans Vite, GitHub ou le navigateur.**
- **Comptes sans wallet et abonnement EUR** : parcours de préparation/sandbox, pas de lien production ou droit NFT présumé. Les offres Genesis/PayBox, RWA, enchères payables et trading autonome restent soumis à des GO/NO-GO séparés ; pas de promesse de rendement ni de livraison implicite.

## Google Drive et originaux de collection

Le dossier de galerie xArtists a été inventorié le **11 novembre 2026** : **291 PNG**, ainsi que **4 MP4** dans son dossier vidéo historique. Il s'agit d'un **inventaire privé de fichiers, pas de 295 NFT**. Les fichiers, IDs Drive, droits de chaque artiste, empreintes SHA-256 et CIDs ne sont **pas publiés** dans le repo. Ne jamais rendre une archive privée publique par simple changement d'URL de partage.

Parcours autorisé : choisir les œuvres et attester les droits → contrôler les octets originaux et les empreintes → publier sur IPFS via un compte artiste authentifié → vérifier les CIDs → signer le mint → confirmer sur Explorer. L'import manuel fonctionne dès qu'un artiste télécharge une copie depuis Drive puis la sélectionne dans Studio ; **aucune synchronisation OAuth Drive→IPFS sans consentement n'est revendiquée**.

Voir [staging Drive privé](docs/ops/DRIVE_NFT_PRIVATE_STAGING_2026-11-11.md), [guide créateur/vente/Drive](docs/presentation/creer-vendre-nft-ipfs-drive.md) et [runbook backend IPFS](docs/ops/BACKEND_IPFS_ACTIVATION_2026-11-11.md).

## Plugins et services

- [**xRights**](https://xartists.art/create/world-rights/) : atelier de licences de contenus sociaux, édition/export de dossiers locaux. Le **ZIP premium n'est pas publié** : téléchargement payant / exemption propriétaire exigent une licence et un entitlement vérifiés sur le serveur. Connexion YouTube en lecture seule soumise à OAuth et disponibilité backend ; autres plateformes en préparation manuelle. [Code](packages/xa-world-rights/README.md).
- [**NFT Factory / Distributeurs**](https://xartists.art/create/nft-factory/) : plans de collection et distributeur **paper** ; aucune génération, distribution, vente ou mint automatique autorisé. [Spécification](docs/NFT_FACTORY_DISTRIBUTORS_PAPER_TO_LIVE.md).
- **xOrus Agent** : [connecteur de données en préparation](packages/xorus-agent/README.md), pas un endpoint MCP public actif, ni un plugin de trading.
- [**GitBook officiel**](https://xartists.gitbook.io/xartists/) : édition liée au dossier `docs/` par Git Sync GitHub. [Guides plugins](docs/presentation/plugins-xartists.md).

## Développement et vérification

```bash
cd apps/frontend
npm ci --legacy-peer-deps
npm run test:release
npm run check:routes
npm run verify:site
npm run typecheck
npm run build
```

Le frontend est React/Vite/TypeScript ; l'API séparée vit dans `services/access-api`. Le déploiement du site est géré par [`.github/workflows/static.yml`](.github/workflows/static.yml). Un build vert **ne prouve pas** un déploiement ni un paiement. Aucun script de documentation ne doit activer `LIA_LIVE_TRADING`, PayBox, Stripe ou l'upload IPFS.

**Sécurité :** jamais de seed, PEM, JWT Pinata, jetons Google, secrets PSP ou clé de portefeuille dans les issues, commits ou captures d'écran. Toute action NFT, mint, vente ou dépense exige une vérification et une signature personnelle. [Issues](https://github.com/Neltud/xArtists/issues) · [Licence et conditions](LICENSE) · [Gates de lancement](docs/security/launch-gates.md).
