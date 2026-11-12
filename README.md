# xArtists · Art, AI Agents & MultiversX

**An immersive art and AI experience, open to everyone.** xArtists connects artists, collectors and visitors through a 3D museum, creative tools, NFTs and agent intelligence dashboards on MultiversX.

[**Launch the public dApp**](https://neltud.github.io/xArtists/) · [**Official GitBook**](https://xartists.gitbook.io/xartists/) · [**Browse the museum**](https://neltud.github.io/xArtists/museum) · [**AI Agents**](https://neltud.github.io/xArtists/agents)

## xOrus, xRights et sculpture 3D

**xOrus** centralise les analyses et la qualité des signaux, tandis que **xRights** (ancien XA World Rights) prépare les licences sociales. Le [Lab sculpture](https://xartists.art/lab?view=3d) permet de faire tourner localement 4–36 vues d’une œuvre avant tout maillage certifié. La récompense envisagée de **1 TRO par NFT physique réellement minté et vérifié** reste sans versement automatique : preuve blockchain, anti-doublon, réserve et autorisation humaine sont indispensables.

## xOrus — intelligence xArtists (paper)

**xOrus** est le nouveau nom public de l'essaim d'analyse précédemment appelé Chorus. Il définit **120 signaux** ; la présence dans le catalogue ne signifie pas qu'ils sont alimentés. Sans données indépendantes et fraîches, le système s'abstient. Le veto Sentinel demeure prioritaire et l'avis externe est limité à 15 %.

`LIA_LIVE_TRADING` n'active aucune transaction xOrus : `executable=false`, ni signature, ni trade, ni mint. Les paiements et actions mainnet restent des parcours distincts, sous contrôle humain.

- [Documentation xOrus](docs/XORUS.md) · [board paper xOrus (snapshot non temps réel)](apps/frontend/public/data/xorus_board.json)
- Nouvelle commande : `PYTHONPATH=. python -m lia.xorus`. L'import historique `lia.chorus` reste temporairement pour les intégrations existantes, avec migration après la vérification de la PR de sécurité #513.

## $TRO — acquisition et interopérabilité Solana (release gated)

La nouvelle [page $TRO · achat & Solana](https://neltud.github.io/xArtists/tro/sale) propose une présentation claire de **TRO-94c925 sur MultiversX**, le contrôle de l'identifiant sur Explorer et un accès externe au DEX, **sans prix ni liquidité garantis**. Le projet de bridge Solana est **désactivé** : aucun mint SPL officiellement attesté, aucune adresse de dépôt, aucun transfert, aucune vente directe xArtists.

- [Architecture et GO/NO-GO du bridge](docs/TRO_SOLANA_BRIDGE_GO_NO_GO.md)
- [Premier mint NFT artiste mainnet — checklist de preuves](docs/FIRST_ARTIST_MAINNET_MINT.md)
- API publique de statut **en lecture seule** : https://xartists-access-api.onrender.com/v1/tro/bridge/status (disponible après fusion et déploiement)

Le **Creator Studio** accepte JPG/PNG/WebP/MP4 mais l'upload automatique Pinata reste désactivé jusqu'à la configuration sécurisée de Render et la vérification de la base de données. Le mint lui-même exige la signature de l'artiste avec son wallet et une transaction mainnet confirmée. Les anciennes intégrations marchandes externes ont été retirées du parcours xArtists. Pour le marché de l’art, les liens Artprice officiels sont consultables ; les bases de prix nécessitent une licence de données écrite. Voir [l'architecture de sources officielles Artprice](docs/ARTPRICE_OFFICIAL_LICENSING_2026-11-10.md).

## Discover xArtists

| Explore | Create | Intelligence | Your space |
| --- | --- | --- | --- |
| Immersive museum, collections and artwork references | Phygital Studio and collection preparation | LIA, Command Center, Genesis agent profiles | Wallet, owned artworks and access rights |

**No wallet is needed for public discovery.** The V3 mobile interface offers a lightweight 2D LIA overview, with an optional 3D immersive experience. Live signals in the public interface may be simulated or delayed; always read their labels.

## Genesis AI agent packs

| Pack | Tier | Catalogue price | Edition cap |
| --- | --- | ---: | ---: |
| **Pulse** | Gold | **€110** | 333 |
| **Yield** | Silver | **€75** | 500 |
| **Sentinel** | Platinum | **€50** | 777 |

Genesis packs are **planned one-time purchases**, associated with limited-edition MultiversX NFT artworks and advertised durable access rights. They **are not subscriptions**. **Sales are currently suspended.** Recorded `getPackPrice` values on 8 November were Pulse **1 EGLD**, Yield **5 EGLD** and Sentinel **2.5 EGLD**, which do not constitute executable quotes or parity with the EUR catalogue. Existing pack NFTs have empty media URIs; delivery and access entitlements have not been validated for public sales.

**Whop TCA Membership is separate:** recurring services while subscribed; no Genesis SFT automatically included. See [commercial model](docs/COMMERCIAL_MODEL.md), [public buying guide](docs/security/guide-public-packs-whop.md) and [current availability](https://xartists.gitbook.io/xartists/presentation/etat-du-produit).

## Release status — November 8, 2026 (v0.130.0)

- **Public web app:** v0.130.0 deployed on GitHub Pages, source [c00f1388](https://github.com/Neltud/xArtists/commit/c00f13888d88ccfbb05275a4fa7d9f97715ab812) independently verified in the public build manifest. The 8 November clarity/UX patch is a subsequent documentation and discovery enhancement, not a new commercial authorization.
- **LIA intelligence:** read-only/paper by default. **Autonomous LIA Ops trading is NOT authorised.**
- **MultiversX mainnet:** contracts and NFT references exist, but a deployment is not proof of safe commercial delivery.
- **Genesis pack payments:** **closed on both crypto and fiat rails** in the web checkout. The UI displays €110 / €75 / €50 as a catalogue only; the last recorded smart-contract prices are **1 / 5 / 2.5 EGLD** (8 November snapshot), not a real-time quote. Existing NFTs have empty media URIs. PayBox payment → authenticated IPN → NFT entitlement → refund proof remains **unconfirmed**.
- **Public financial launch:** **NO-GO until capability-specific human approval and evidence**. No claim of yield, investment performance or guaranteed gains.

For the latest source-backed status, see [Release 0.130.0 — 8 November](docs/RELEASE_2026-11-08_PUBLIC.md), [Design/UX review](docs/presentation/revue-design-2026-11-08.md), [8 November chain-readiness evidence](docs/ops/AGENTS_PACK_STEP2_FRONTEND_NO_GO_2026-11-08.md), and [launch audit (2 November)](docs/LAUNCH_AUDIT_2026-11-02.md). Historical operations are not current launch authorisations.


## Design & accessibility — 8 November review

The public desktop flow was checked without a wallet (home → museum → agents → marketplace). Strengths include wallet-optional discovery, clear breadcrumbs, a theme switch and prominent preview markers. Outstanding priorities: **remove legacy EGLD estimates from every discovery route**, increase small labels to readable sizes, review artwork image alternatives and secondary-text contrast, and verify **mobile 375–414 px**, keyboard focus and reduced-motion behavior in a browser. Read the [design review and release checklist](docs/audits/DESIGN_REVIEW_2026-11-08.md). This is a targeted desktop review, **not** a full WCAG or mobile certification.

## Developer quick start

The public site is a React 18 + Vite + TypeScript dApp, using Three.js, the MultiversX SDK and a separate Access API. GitHub Pages deployment is defined by [static.yml](.github/workflows/static.yml).

```bash
cd apps/frontend
npm ci --legacy-peer-deps
npm run test:release
npm run check:routes
npm run verify:site
npm run typecheck
npm run build
```

Optional APIs or credentials must be configured out of band. **Never commit private keys, wallet PEMs, JWTs, PSP merchant secrets or production session tokens.** A green CI build does not authorise new financial side effects.

## Project and documentation

- [Official public GitBook](https://xartists.gitbook.io/xartists/) — visitors, collectors, creators, mobile guide, product scope
- [Commercial launch preparation (10 Nov 2026)](docs/ops/COMMERCIAL_LAUNCH_PREP_2026-11-10.md) — per-rail GO/NO-GO evidence, owner approvals and rollback; **no financial activation**
- [Safety and launch gates](docs/security/launch-gates.md) — evidence before merchant/mainnet operations
- [Commercial model](docs/COMMERCIAL_MODEL.md) — Genesis vs Whop, pricing, delivery distinctions
- [GitHub Actions](https://github.com/Neltud/xArtists/actions) — reproducible tests and Pages deployments
- [Marketing and media pack](docs/marketing/VIDEO_LAUNCH_2026-11-02.md) — genuine browser recordings and publish-ready copy

## Security and contribution

Report reproducible issues through [GitHub Issues](https://github.com/Neltud/xArtists/issues). Checkout, mint, trading and permissions changes require isolated tests and human review. Read [launch gates](docs/security/launch-gates.md) before changing any live rail.

Created by **Nelson Tuduri / Neltud**. xArtists is an artistic and technical project, **not a guaranteed-return investment vehicle**.
