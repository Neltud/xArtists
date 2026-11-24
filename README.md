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

## État confirmé au 24 novembre 2026

Sonde `2026-11-24T05:33Z`. Pages **0.139.0** / **`5271cefe`** / `lia_live_trading=false`, construit après le cockpit V2. API Render toujours `8b6fae84` (un push git ne la redéploie pas). Studio store **503** (`table_ready=false`) alors que la page Studio sert le shell. Hub xOrus sandbox `e580388b`, exécution **fermée**, budget live **0**, stance **ABSTAIN**, valorisation paper encore manuelle. `api.xartists.art` non résolu. Détail : [sonde du 24 nov](docs/ops/PROBE_PUBLIC_2026-11-24.md). Aucun gate commerce n'est levé.

## État confirmé au 22 novembre 2026

Sonde `2026-11-22T05:33Z`. Pages **0.139.0** / `d5f1140e` / `lia_live_trading=false` au moment de la lecture. Le correctif de titre xOrus (outils avancés repliés) est sur `main` et suit le prochain build Pages. API Render toujours `8b6fae84`. Studio **503**. xOrus **ABSTAIN** (`thin_tape`). Hub Neon en lecture sandbox, pas une autorisation d'exécution. Détail : [sonde du 22 nov](docs/ops/PROBE_PUBLIC_2026-11-22.md). Aucun gate commerce n'est levé.

## État confirmé au 20 novembre 2026

Sonde `2026-11-20T18:58Z`. GitHub Pages servait le SHA **`9610b56`**. Détail : [sonde du 20 nov](docs/ops/PROBE_PUBLIC_2026-11-20.md). Aucun gate commerce n'avait été levé.

## État confirmé au 19 novembre 2026

Sonde `2026-11-19T12:25Z`. La lecture fraîche de [build-info.json](https://xartists.art/build-info.json) et de [health](https://xartists-access-api.onrender.com/health) prime sur les versions imprimées plus bas. Détail : [sonde du 19 nov](docs/ops/PROBE_PUBLIC_2026-11-19.md).

- **API Render** : `ok=true`, SHA **`8b6fae84e15084883d94e2121a7ab8f6219b7845`** (runtime du 14 novembre, toujours en retard au 22 nov). Un push git ne redéploie pas Render. `api.xartists.art` est **NXDOMAIN**.
- **Marketplace** : préparation du listing. Cycle signé non prouvé ([issue #428](https://github.com/Neltud/xArtists/issues/428)). Enchères fermées.
- **Creator Studio** : HTTP **503**, schéma absent. Upload off. Mint dry-run. `mint_oidc_pull_enabled=true` est une lecture, pas un mint public.
- **Paiements** : Stripe et MoonPay off. PayBox configuré (`paybox_mode=prod`) et checkout **désactivé**.
- **Comptes / wallet** : exploration sans wallet ≠ compte email ≠ signataire. Preuve QR xPortal ouverte ([issue #506](https://github.com/Neltud/xArtists/issues/506)).
- **xOrus** : paper, **ABSTAIN** (`thin_tape`). Analyse privée off ([issue #548](https://github.com/Neltud/xArtists/issues/548)).

Le site public est **live**. Le commerce ne l'est pas. Les deux phrases sont vraies en même temps.

## Google Drive et originaux de collection

Inventaire privé du **11 novembre 2026** : **291 PNG** et **4 MP4**. Ce n'est pas un catalogue de 295 NFT. Pas d'URL de partage publique. Parcours : droits, empreinte, IPFS consenti, CID relu, signature artiste, Explorer.

Voir [staging Drive privé](docs/ops/DRIVE_NFT_PRIVATE_STAGING_2026-11-11.md).

## Plugins et services

- [**xRights**](https://xartists.art/create/world-rights/) : licences locales. ZIP premium non publié.
- [**NFT Factory**](https://xartists.art/create/nft-factory/) : plans paper. Aucune génération ni vente automatique.
- **xOrus Agent** : connecteur en préparation, pas un plugin de trading.
- [**GitBook**](https://xartists.gitbook.io/xartists/) lié à `docs/`.

## Développement

```bash
cd apps/frontend
npm ci --legacy-peer-deps
npm run test:release
npm run check:routes
npm run verify:site
npm run typecheck
npm run build
```

Frontend React/Vite. API : `services/access-api`. Pages : [`.github/workflows/static.yml`](.github/workflows/static.yml). Statut : [ACTIVE_CONTEXT.md](ACTIVE_CONTEXT.md). Un build vert ne prouve ni déploiement ni paiement.

**Sécurité :** jamais de seed, PEM, JWT ou secret PSP dans un commit. Toute vente ou mint exige une signature personnelle. [Issues](https://github.com/Neltud/xArtists/issues) · [Gates](docs/security/launch-gates.md).
