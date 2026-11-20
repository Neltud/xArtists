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

## État confirmé au 20 novembre 2026

Sonde `2026-11-20T18:58Z`. GitHub Pages sert le SHA **`9610b56`** (workflow [44797583538](https://github.com/Neltud/xArtists/actions/runs/44797583538)), version manifeste encore **0.139.0**, `lia_live_trading=false`. Le déploiement du 19 nov était rouge : six tests exigeaient encore le bootstrap LIA live. Ils suivent maintenant le retrait paper-only. Détail : [sonde du 20 nov](docs/ops/PROBE_PUBLIC_2026-11-20.md). Aucun gate commerce n'est levé.

## État confirmé au 19 novembre 2026

Sonde `2026-11-19T12:25Z`. Cette section ne lève aucun gate. La lecture fraîche de [build-info.json](https://xartists.art/build-info.json) et de [health](https://xartists-access-api.onrender.com/health) prime sur les versions imprimées plus bas. Détail : [sonde du 19 nov](docs/ops/PROBE_PUBLIC_2026-11-19.md).

- **GitHub Pages** : version **0.139.0**, SHA `fdd072190d0af7e7dbb7386b301b14ac218c9373`, construit le 17 novembre 2026 à 13:54 UTC, `lia_live_trading=false`, **140** routes. Le bundle appelle Render, pas `api.xartists.art`.
- **API Render** : `ok=true`, SHA **`8b6fae84e15084883d94e2121a7ab8f6219b7845`** (toujours le runtime du 14 novembre). L'API est **en retard** sur les Pages. L'aligner ne doit changer aucun drapeau. Un push git ne redéploie pas Render. `api.xartists.art` est **NXDOMAIN** : ce n'est pas l'API publique.
- **Marketplace** : préparation du listing de ses propres NFT. **Un listing utilisateur signé sur cette version et son dépôt confirmé en escrow restent à prouver** ([issue #428](https://github.com/Neltud/xArtists/issues/428)). Achat, enchères et packs ont des gates distincts, tous fermés côté API (`auction_enabled=false`).
- **Creator Studio** : parcours de préparation. Le diagnostic public retourne **HTTP 503** (`backend=postgres`, `table_ready=false`, `schema_ready=false`, `model_schema_ready=false`). Le corps public ne nomme pas la migration manquante. Le premier mint d'une sculpture sur le parcours complet n'est pas confirmé.
- **IPFS / GLB** : upload **OFF** (`studio_media_upload=off`). `mint_live_enabled=false`, `mint_dry_run=true`. `mint_oidc_pull_enabled=true` est un bras de lecture, pas un mint public. Migrations 004–006 non certifiées sur la base réelle.
- **Paiements** : Stripe et MoonPay off. PayBox est **configuré** (`paybox_mode=prod`) et le **checkout est désactivé**. Le mode prod n'est pas un encaissement.
- **Comptes** : exploration sans wallet ≠ compte email (`walletless_account_session_enabled=false`) ≠ wallet signataire. xPortal / Reown : preuve QR toujours ouverte ([issue #506](https://github.com/Neltud/xArtists/issues/506)).
- **xOrus** : paper, décision **ABSTAIN** (`thin_tape`) au 16 nov 05:33 UTC. Analyse privée `xorus_private_analysis_enabled=false` ([issue #548](https://github.com/Neltud/xArtists/issues/548)).

Le site public est donc **live**. Le commerce ne l'est pas. Les deux phrases sont vraies en même temps.

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

Le frontend est React/Vite/TypeScript ; l'API séparée vit dans `services/access-api`. Le déploiement public est géré par [`.github/workflows/static.yml`](.github/workflows/static.yml). Le futur backend parallèle **OVH** (image API autonome et Caddy HTTPS) est préparé dans [deploy/ovh](deploy/ovh/README.md) ; **aucun serveur OVH n'a encore été migré ou basculé**. Le statut technique et les priorités courantes sont dans [ACTIVE_CONTEXT.md](ACTIVE_CONTEXT.md). Un build vert ne prouve ni déploiement ni paiement. Aucun script de documentation ne doit activer trading, PayBox, Stripe ou upload IPFS.

**Sécurité :** jamais de seed, PEM, JWT Pinata, jetons Google, secrets PSP ou clé de portefeuille dans les issues, commits ou captures d'écran. Toute action NFT, mint, vente ou dépense exige une vérification et une signature personnelle. [Issues](https://github.com/Neltud/xArtists/issues) · [Licence et conditions](LICENSE) · [Gates de lancement](docs/security/launch-gates.md).
