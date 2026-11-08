# Changelog — xArtists

## [0.130.0](https://github.com/Neltud/xArtists/compare/v0.129.1...v0.130.0) (2026-11-08)

> **Release scope:** source and UI preview milestone only. A version tag does not activate live minting, checkout, RWA escrow transfers, LIA real trading or an authenticated paid plugin download; those functions require separate verified release gates.


### Features

* **art-first:** Maison xArtists and curated navigation ([#315](https://github.com/Neltud/xArtists/issues/315)) ([e55e21b](https://github.com/Neltud/xArtists/commit/e55e21bbe13ed19c361556103408bd73a9bec3c0))
* **art-id:** artwork evidence and read-only NFT reassessment primitives ([#322](https://github.com/Neltud/xArtists/issues/322)) ([b3f3871](https://github.com/Neltud/xArtists/commit/b3f3871a9e4b1d624e88753ee0f80663c896d47a))
* **art-id:** bounded PNG decoder, CRC and calibration lab ([#329](https://github.com/Neltud/xArtists/issues/329)) ([5513394](https://github.com/Neltud/xArtists/commit/5513394503bdd70edc15d8a65d2ef2393aabc4cc))
* **art-id:** deterministic DCT pHash candidate recognition from decoded pixels ([#326](https://github.com/Neltud/xArtists/issues/326)) ([07cc5df](https://github.com/Neltud/xArtists/commit/07cc5dfe5f81dcbffffdac9f62a4064404847e87))
* **art:** publish xArtists originals and safe EGLD NFT preflight ([c3b56e5](https://github.com/Neltud/xArtists/commit/c3b56e51039154431eadebe94dad5434d4fb73ca))
* **auction:** mount P1 sandbox-only auction API and UI ([#314](https://github.com/Neltud/xArtists/issues/314)) ([ae66fbd](https://github.com/Neltud/xArtists/commit/ae66fbdb359ce8397d2ebb300e8caaf712663d17))
* **claim:** canonical voucher V1 offline codec and post-IPN guard (phase 0) ([#312](https://github.com/Neltud/xArtists/issues/312)) ([15487b3](https://github.com/Neltud/xArtists/commit/15487b36618b2d9c9c159acd647c0b5473b6a2e2))
* **claim:** isolated offline MultiversX SC with 12 mocked VM tests (NO DEPLOY) ([#325](https://github.com/Neltud/xArtists/issues/325)) ([468bd26](https://github.com/Neltud/xArtists/commit/468bd2681614a2998feca523a01117fa5af37850))
* **claim:** offline revoke and compose gates, unified voucher codec, mint_jobs runbook ([#318](https://github.com/Neltud/xArtists/issues/318)) ([750e115](https://github.com/Neltud/xArtists/commit/750e1157e4d96256564125c00615a5259035a4d2))
* **club:** offre Club + News 10 €/mois hors chaîne (préparation sécurisée) ([#405](https://github.com/Neltud/xArtists/issues/405)) ([6c0aca5](https://github.com/Neltud/xArtists/commit/6c0aca59f1b44ee47e9626e66ebbf1eebb873671))
* **commercial:** publish discovery-only offers and lead enquiries (NO CHECKOUT) ([#337](https://github.com/Neltud/xArtists/issues/337)) ([465b121](https://github.com/Neltud/xArtists/commit/465b121718faaae6f1071bebb7635de3b0c60a39))
* **genesis:** isolated paper quote, credit reservation and guarded provider adapter ([#374](https://github.com/Neltud/xArtists/issues/374)) ([58ef7b9](https://github.com/Neltud/xArtists/commit/58ef7b9c15feaeee3a7540a26714a22100455cc6))
* **lia:** P0 structured BUY_PACK Rule1 paper flow, minimal API + Packs button ([#378](https://github.com/Neltud/xArtists/issues/378)) ([de0ec71](https://github.com/Neltud/xArtists/commit/de0ec71559a6bdea86bb09771b61c89060d1fdad))
* **lia:** public-first Control Room and truthful telemetry ([#345](https://github.com/Neltud/xArtists/issues/345)) ([dd3a1a2](https://github.com/Neltud/xArtists/commit/dd3a1a2a13374ea723679a7853c0d060772aabee))
* **marketplace:** OpenSea Solana + Polygon read-only discovery ([#391](https://github.com/Neltud/xArtists/issues/391)) ([#392](https://github.com/Neltud/xArtists/issues/392)) ([473bb14](https://github.com/Neltud/xArtists/commit/473bb149ba3aa670b71f2e4b1f09b4017915e0a6))
* **market:** show LIA wallet and escrow-held NFTs from MultiversX ([#437](https://github.com/Neltud/xArtists/issues/437)) ([53852de](https://github.com/Neltud/xArtists/commit/53852deba4f86474bde03dbe17b4fa3dddf9d1c2))
* **memory:** Merkle proofs and unanchored commitment candidates ([#420](https://github.com/Neltud/xArtists/issues/420)) ([f882da9](https://github.com/Neltud/xArtists/commit/f882da9931130d1df51967a95f8353aed19dd288))
* **mvx:** prepare read-only S2 NFT receipt verification ([#297](https://github.com/Neltud/xArtists/issues/297)) ([f618e1f](https://github.com/Neltud/xArtists/commit/f618e1fc69322cdafb877d0fc4c169b36d5aa456))
* **nav:** visible Control Room LIA on Home and mobile menu ([#349](https://github.com/Neltud/xArtists/issues/349)) ([fbd54bc](https://github.com/Neltud/xArtists/commit/fbd54bc150c97871eb249d567f51591e181ea777))
* **nft:** paper-only human/agent Art Factory, per-NFT metadata and fixed-price distributor drafts ([#390](https://github.com/Neltud/xArtists/issues/390)) ([c35d000](https://github.com/Neltud/xArtists/commit/c35d0007e898188bf0fedee78dabbd6d308e9e57))
* **ops:** PAT-free GitHub OIDC dry-run mint pull ([#304](https://github.com/Neltud/xArtists/issues/304)) ([87b49dc](https://github.com/Neltud/xArtists/commit/87b49dc39733dc03eb9433c098bfafdfb2997cd2))
* **ops:** prove read-only Postgres order-store readiness ([#290](https://github.com/Neltud/xArtists/issues/290)) ([da591e9](https://github.com/Neltud/xArtists/commit/da591e9349c86854eee605333c7df3d42a512c1c))
* **ops:** read-only Render-bound mint_jobs readiness proof ([#335](https://github.com/Neltud/xArtists/issues/335)) ([57560e7](https://github.com/Neltud/xArtists/commit/57560e7be99d3e11e99b90eafc27fce3a56ebbad))
* **ops:** ship read-only mint store diagnostic and ephemeral PG tests ([#381](https://github.com/Neltud/xArtists/issues/381)) ([29e833d](https://github.com/Neltud/xArtists/commit/29e833de6b03e4fb9e03379e6d7f526c0ccac542))
* **P0:** IPFS byte-for-byte readback without treating gateways as replicas ([03b6f03](https://github.com/Neltud/xArtists/commit/03b6f0385a578ce760f5a0347a0d2d466cd9bd89))
* **plugins:** add fail-closed paid entitlement verifier ([#419](https://github.com/Neltud/xArtists/issues/419)) ([4368471](https://github.com/Neltud/xArtists/commit/4368471514ad5ecc955edcc123b06fb5bb3d291f))
* **public:** all modules navigable, DAO and beginner multichain UX ([#397](https://github.com/Neltud/xArtists/issues/397)) ([980eaaa](https://github.com/Neltud/xArtists/commit/980eaaad61270d5ecedc00d1bc3955351f721cb8))
* **security:** fail-closed paper-only plugin entitlement primitives ([e81a9b5](https://github.com/Neltud/xArtists/commit/e81a9b54ff4b5ae6519345495f011539c388049f))
* **stripe:** integrate isolated test-only Checkout and signed sandbox ledger ([#383](https://github.com/Neltud/xArtists/issues/383)) ([3836cb3](https://github.com/Neltud/xArtists/commit/3836cb3954d271dfe0632324d0eb167a391603c8))
* **studio:** diagnostic Pinata + SQL en lecture seule avant activation IPFS ([#411](https://github.com/Neltud/xArtists/issues/411)) ([ec6d6b5](https://github.com/Neltud/xArtists/commit/ec6d6b585691f90b0cb9bc13063af9dd8ba32003))
* **ux:** 4-step beginner guide and unified 8-locale module discovery ([#424](https://github.com/Neltud/xArtists/issues/424)) ([e147207](https://github.com/Neltud/xArtists/commit/e147207166a68b74006dc004bf16bb6342742487))
* **ux:** beginner-first navigation and light-readable guide ([#422](https://github.com/Neltud/xArtists/issues/422)) ([9ad82b7](https://github.com/Neltud/xArtists/commit/9ad82b77590d7b3d81c427b178cf337fc8274f95))
* **ux:** compact public TRO/RWA and harden 110-route coverage ([#358](https://github.com/Neltud/xArtists/issues/358)) ([a2d5fa1](https://github.com/Neltud/xArtists/commit/a2d5fa16180769ae21b786440ce103ce79b5550c))
* **ux:** public readiness, roadmap and orbital 3D homepage ([#398](https://github.com/Neltud/xArtists/issues/398)) ([13aad62](https://github.com/Neltud/xArtists/commit/13aad62633f3bc41bd9f7f5383c21d11dca43e4d))
* **ux:** RWA and TRO readable mobile journeys ([#423](https://github.com/Neltud/xArtists/issues/423)) ([9dd1a39](https://github.com/Neltud/xArtists/commit/9dd1a392fd2fc01e3ee91981d919687acbc9eb0b))


### Bug Fixes

* **api:** allow both official frontend origins with exact CORS policy ([#295](https://github.com/Neltud/xArtists/issues/295)) ([627409a](https://github.com/Neltud/xArtists/commit/627409a293ec7d9f455edf6360a2de4271c52d4e))
* **commercial:** recognize /offres/ trailing slash in browser SEO title ([#342](https://github.com/Neltud/xArtists/issues/342)) ([a8d1677](https://github.com/Neltud/xArtists/commit/a8d16778155feead4a7f4e637911c30f40a674d6))
* **commercial:** restore reliable public enquiries without broken mail domain ([#340](https://github.com/Neltud/xArtists/issues/340)) ([4cb6679](https://github.com/Neltud/xArtists/commit/4cb6679c2f418ad74db52e250cb32af9593412b3))
* **commercial:** SEO title, metadata and link previews for xArtists offers ([#339](https://github.com/Neltud/xArtists/issues/339)) ([702e5a5](https://github.com/Neltud/xArtists/commit/702e5a5a944689389d92af8bdefa375db3f5edfc))
* **gitbook:** drop invalid page metadata and unblock import ([#351](https://github.com/Neltud/xArtists/issues/351)) ([d0610c3](https://github.com/Neltud/xArtists/commit/d0610c3993f1532351a143fea0ad5263581c9bf7))
* **gitbook:** valid YAML and standard public nav ([#350](https://github.com/Neltud/xArtists/issues/350)) ([5f92e60](https://github.com/Neltud/xArtists/commit/5f92e6069217d5265ec0ed1c23029384708d1deb))
* **ipfs:** reject HTTP 200 HTML fallback during Studio media readback ([#436](https://github.com/Neltud/xArtists/issues/436)) ([e4412e0](https://github.com/Neltud/xArtists/commit/e4412e0f6f30e94435b0eed501a2196910f71c0f))
* **lia:** fail closed when chain memory is unknown ([#417](https://github.com/Neltud/xArtists/issues/417)) ([93ec865](https://github.com/Neltud/xArtists/commit/93ec86519c16f8638f252d87b2c59983227aa07e))
* **lia:** fail-closed source freshness, withhold stale Vellum signals ([#347](https://github.com/Neltud/xArtists/issues/347)) ([#360](https://github.com/Neltud/xArtists/issues/360)) ([b8ca75c](https://github.com/Neltud/xArtists/commit/b8ca75c334dde6d05f76db0c811794f25ad02a50))
* **mainnet:** exact EGLD amounts and wallet/payable guards ([5fb5d71](https://github.com/Neltud/xArtists/commit/5fb5d71afdeb5946b50ce2f53524dbde412c50e6))
* **marketing:** truthful PayBox checkout availability and social launch kit ([#300](https://github.com/Neltud/xArtists/issues/300)) ([1ba3021](https://github.com/Neltud/xArtists/commit/1ba3021f897e8c0e4b80d70baf54606863761ea6))
* **mint:** make PostgreSQL job reads strictly read-only ([#387](https://github.com/Neltud/xArtists/issues/387)) ([999c2aa](https://github.com/Neltud/xArtists/commit/999c2aac487e53d04e4b461206d10e838fe354de))
* **mobile:** contrast, wallet header, NFT layer reflow and safe DeFi copy ([#399](https://github.com/Neltud/xArtists/issues/399)) ([e15f756](https://github.com/Neltud/xArtists/commit/e15f7560513a18851086faa91022659c38998cd0))
* **mobile:** direct Marketplace + Auctions and one-row navigation ([#344](https://github.com/Neltud/xArtists/issues/344)) ([108bd2b](https://github.com/Neltud/xArtists/commit/108bd2b6b469c156a12d7a75468ff3b8a7b3896c))
* **P0 UX:** finance route providers, no-send visibility, RWA paper proof ([#357](https://github.com/Neltud/xArtists/issues/357)) ([b1f732b](https://github.com/Neltud/xArtists/commit/b1f732ba47ef1544cac646be6db0bf905aca1b68))
* **P0:** detect wrong Render API image and gate PayBox checkout ([#288](https://github.com/Neltud/xArtists/issues/288)) ([7731d8d](https://github.com/Neltud/xArtists/commit/7731d8dee663f721c205d2505edc88730f26479e))
* **pages:** HTTP 200 direct routes for commercial offers on GitHub Pages ([#338](https://github.com/Neltud/xArtists/issues/338)) ([a88e102](https://github.com/Neltud/xArtists/commit/a88e102995f26c60f51ff37d9fffde5b0014c55d))
* **pages:** preserve route-aware GitHub Pages 404 recovery ([#343](https://github.com/Neltud/xArtists/issues/343)) ([9731d49](https://github.com/Neltud/xArtists/commit/9731d494dc7ba6723eb04930eaf766b0e1a4cd36))
* **pages:** recover stale dynamic CSS/JS chunks via user-triggered reload ([#299](https://github.com/Neltud/xArtists/issues/299)) ([9236c0b](https://github.com/Neltud/xArtists/commit/9236c0bcbe2d0df55cd75fdde3d4a3b01b5063db))
* **pages:** verify release source, route entries and lazy assets ([#361](https://github.com/Neltud/xArtists/issues/361)) ([5b9232c](https://github.com/Neltud/xArtists/commit/5b9232c574a23f34720576cc1fbd3917532dd48e))
* **paybox:** payment does not imply NFT delivery ([#282](https://github.com/Neltud/xArtists/issues/282)) ([a98424c](https://github.com/Neltud/xArtists/commit/a98424cd7a9e4853c29d57fcb9437f36d7b0fd19))
* **public:** fail-closed pack signals and light-first editorial UX ([#408](https://github.com/Neltud/xArtists/issues/408)) ([89dc96b](https://github.com/Neltud/xArtists/commit/89dc96b75b933b9f197b22a3406d04f7498cfeb5))
* **public:** light-first homepage and truthful pack telemetry ([#396](https://github.com/Neltud/xArtists/issues/396)) ([bcc99f1](https://github.com/Neltud/xArtists/commit/bcc99f1ef6874eefbb53a06a2d77bc0a0a215042))
* **public:** pack titles and 116 public route inventory ([#384](https://github.com/Neltud/xArtists/issues/384)) ([a396b47](https://github.com/Neltud/xArtists/commit/a396b47112841f95feef8c2294897c0158c5cff5))
* **public:** visitor guide, legal a11y and 38-module audit ([#356](https://github.com/Neltud/xArtists/issues/356)) ([3569a0f](https://github.com/Neltud/xArtists/commit/3569a0f7121adf0e004893d5ab3d52294de4126e))
* **render:** role-aware shared image restores API while preserving frontend ([#289](https://github.com/Neltud/xArtists/issues/289)) ([0ef849e](https://github.com/Neltud/xArtists/commit/0ef849e22c2bebe693ecf4bb6cfd6d4e2b4cad68))
* **render:** verified frontend source stamp with strict JSON fallback ([#386](https://github.com/Neltud/xArtists/issues/386)) ([0c36768](https://github.com/Neltud/xArtists/commit/0c36768824840225d09caf31778a8128653a3779))
* **security:** enforce S1/S2 exact price and refund-aware evidence freshness ([#309](https://github.com/Neltud/xArtists/issues/309)) ([fa65489](https://github.com/Neltud/xArtists/commit/fa6548992541dafeb827396c958a4eb30bcdc9a8))
* **Studio:** contraste thème clair et parcours artiste guidé ([#412](https://github.com/Neltud/xArtists/issues/412)) ([3a5f7eb](https://github.com/Neltud/xArtists/commit/3a5f7eb042534c3344ed19971b0706085d991409))
* **studio:** éviter les doublons IPFS après une réponse Pinata incertaine ([#413](https://github.com/Neltud/xArtists/issues/413)) ([769adc9](https://github.com/Neltud/xArtists/commit/769adc90cfc691cbdfa5354b186cead4dae23679))
* **studio:** fiabiliser l’upload Pinata et les métadonnées IPFS immuables ([#410](https://github.com/Neltud/xArtists/issues/410)) ([d4aa704](https://github.com/Neltud/xArtists/commit/d4aa7040035278c558e12b060dc5387582e0efc7))
* **tro:** load sale portal CSS eagerly to stabilize public deep links ([#294](https://github.com/Neltud/xArtists/issues/294)) ([295edf9](https://github.com/Neltud/xArtists/commit/295edf9f0ec3520f6226fa8562db5157d42339e7))
* **tro:** supply audit and Burnify fail-closed guards ([#352](https://github.com/Neltud/xArtists/issues/352)) ([82f1ac6](https://github.com/Neltud/xArtists/commit/82f1ac6224212312fc93ba467f2ee9227cca08b9))
* **ux:** accessible loading for public routes and unique home headings ([#434](https://github.com/Neltud/xArtists/issues/434)) ([4d3c3b8](https://github.com/Neltud/xArtists/commit/4d3c3b8ea83d1a4994ae5f53b02ca6be704e0c53))
* **ux:** official xArtists wallet logo, responsive museum and truthful sponsor previews ([c31a0c8](https://github.com/Neltud/xArtists/commit/c31a0c80e6a9f9063a065ac75738250779178487))


### Performance

* **ux:** mobile 2D home hero and explicit immersive opt-in ([#355](https://github.com/Neltud/xArtists/issues/355)) ([a2215aa](https://github.com/Neltud/xArtists/commit/a2215aa17b3be3fe9938af3456e2cf4e2bcb210a))


### Documentation

* **auction:** physical + minted collectibles sale room design ([#317](https://github.com/Neltud/xArtists/issues/317)) ([16b6a33](https://github.com/Neltud/xArtists/commit/16b6a330fc5a8f38dd41ac46a9752e3eeff185bc))
* **audit:** define issue 428 mainnet evidence gates and NO-GO ([#431](https://github.com/Neltud/xArtists/issues/431)) ([029a02e](https://github.com/Neltud/xArtists/commit/029a02e4fb3e0f86e94e63c406b475987f19b3c6))
* **claim:** claimPack testnet design, 900s TTL and eight-case matrix ([#321](https://github.com/Neltud/xArtists/issues/321)) ([6b06e9e](https://github.com/Neltud/xArtists/commit/6b06e9e1d019d22cce2a78d3e7221f51d8c73d45))
* **claim:** review deployment-tx-bound V2 voucher alternative ([#328](https://github.com/Neltud/xArtists/issues/328)) ([#333](https://github.com/Neltud/xArtists/issues/333)) ([af4a419](https://github.com/Neltud/xArtists/commit/af4a419f11bd1edc0278e9cc3ff7c620eeff087e))
* **gitbook:** curated public visitor guides and truthful status ([#346](https://github.com/Neltud/xArtists/issues/346)) ([70b6652](https://github.com/Neltud/xArtists/commit/70b66524a0fee8c3ff56a91fe6cf7a81612a481b))
* **go:** safe live surfaces — refund ladder + public claims map ([#319](https://github.com/Neltud/xArtists/issues/319)) ([f26094a](https://github.com/Neltud/xArtists/commit/f26094ac26019ac619c06e5dadd5d0325a7d6bfe))
* **launch:** correct stale GO claims after final public preflight ([#380](https://github.com/Neltud/xArtists/issues/380)) ([efcf56b](https://github.com/Neltud/xArtists/commit/efcf56b51ba26506bae04cdce8ffb66b9748c2c3))
* **marketing:** truthful 30s Shorts storyboard and reviewed multichannel preview copy ([#311](https://github.com/Neltud/xArtists/issues/311)) ([95c8af4](https://github.com/Neltud/xArtists/commit/95c8af48d7d84fa9afceac6f4127cb652595b4ae))
* **ops:** current OIDC and S1/S2 launch evidence ([#307](https://github.com/Neltud/xArtists/issues/307)) ([24d416b](https://github.com/Neltud/xArtists/commit/24d416bb72756147f5c6af92af1a82909382efca))
* **ops:** S1 Sentinel proof checklist — prepare only, zero commercial activation ([#281](https://github.com/Neltud/xArtists/issues/281)) ([#359](https://github.com/Neltud/xArtists/issues/359)) ([22c12b1](https://github.com/Neltud/xArtists/commit/22c12b1eb4ae4f0b9835696ebe8cc90c3f0b4d99))
* **ops:** triage all 23 issues and release backlog safely ([3f25426](https://github.com/Neltud/xArtists/commit/3f25426fa3c45e1379c7cc96eb793c8c4fa57380))
* **packs:** align historical NFT pack catalog with verified Stripe prices and closed checkout ([#385](https://github.com/Neltud/xArtists/issues/385)) ([239cba8](https://github.com/Neltud/xArtists/commit/239cba82fd8ed29ab51ba3d34afcae49c836c2a7))
* **paybox:** owner-confirmed Solana recipient, safe funding preflight ([#354](https://github.com/Neltud/xArtists/issues/354)) ([09392b0](https://github.com/Neltud/xArtists/commit/09392b02681a97684c4a28ae158c729221c1d573))
* **plugins:** audit suite licensing, permissions and mainnet release gates ([#433](https://github.com/Neltud/xArtists/issues/433)) ([5200cdd](https://github.com/Neltud/xArtists/commit/5200cdd91ec8e437dad0ade4b79f2fee988f7ed6))
* **security:** atomic mint roadmap — refuse non-atomic live; GO-all … ([#316](https://github.com/Neltud/xArtists/issues/316)) ([f100b53](https://github.com/Neltud/xArtists/commit/f100b53f050c3e0a376e6048c8f1d63dc41dee2a))

## [0.129.1](https://github.com/Neltud/xArtists/compare/v0.129.0...v0.129.1) (2026-11-02)


### Bug Fixes

* **pages:** single deploy owner and TRO deep-link verification ([#278](https://github.com/Neltud/xArtists/issues/278)) ([f4ab298](https://github.com/Neltud/xArtists/commit/f4ab298f5c0a5a32e952df68044d2d28db810ddf))

## [0.129.0](https://github.com/Neltud/xArtists/compare/v0.128.0...v0.129.0) (2026-11-02)


### Features

* **rwa:** physical art provenance, Shopify fulfillment and signed receipts ([#270](https://github.com/Neltud/xArtists/issues/270)) ([2232648](https://github.com/Neltud/xArtists/commit/22326482691e0a145798226d92edc36d74095d7e))
* **studio:** artist-owned MultiversX mainnet collection and verified first NFT ([#268](https://github.com/Neltud/xArtists/issues/268)) ([f1ee088](https://github.com/Neltud/xArtists/commit/f1ee088abee5ed99586eae96037ece93e0a5e26c))
* **studio:** direct JPG and MP4 IPFS upload with creator wallet NFT mint ([#273](https://github.com/Neltud/xArtists/issues/273)) ([597e302](https://github.com/Neltud/xArtists/commit/597e302a8b3506a8ca1dcee44cb67bf2636cd1a3))
* **tro:** safe Solana bridge status and token discovery portal ([#277](https://github.com/Neltud/xArtists/issues/277)) ([0483ecd](https://github.com/Neltud/xArtists/commit/0483ecd4f51b4ccdf1fc93db0dbd82095725a300))


### Bug Fixes

* **ci:** enforce reproducible npm ci after issue [#271](https://github.com/Neltud/xArtists/issues/271) lockfile repair ([#275](https://github.com/Neltud/xArtists/issues/275)) ([4085b49](https://github.com/Neltud/xArtists/commit/4085b499d89354eda567a30476694c3469c373c8))
* **ci:** restore reproducible access-api npm lockfile ([#274](https://github.com/Neltud/xArtists/issues/274)) ([bd62446](https://github.com/Neltud/xArtists/commit/bd624460829cffc129c764b76b676201ffa18739))
* **types:** restore strict global TypeScript and frontend reproducibility ([#276](https://github.com/Neltud/xArtists/issues/276)) ([8e878c5](https://github.com/Neltud/xArtists/commit/8e878c5d6647dd48270f8f7e176d2b78b1698be1))

## [0.128.0](https://github.com/Neltud/xArtists/compare/v0.127.0...v0.128.0) (2026-11-02)


### Features

* **access-api:** mintDispatch after IPN + funding playbook ([9c0b8f4](https://github.com/Neltud/xArtists/commit/9c0b8f4eea142e41abe48e6377bcc8b9cbf92684))
* **mint:** LIVE_MINT_MAINNET armed — post-payment path + Rule1 SC prices ([58d1f0b](https://github.com/Neltud/xArtists/commit/58d1f0b68d2e6a888592a0f044c674d23c95cab7))
* **packs:** My Packs GenesisCard3D + media dual-face + GO S1/S2 checklist ([089b674](https://github.com/Neltud/xArtists/commit/089b67447e132904be0420a948e22773691ea37f))
* **ux:** touch-first LIA Control Room and wallet-optional welcome ([#262](https://github.com/Neltud/xArtists/issues/262)) ([a006622](https://github.com/Neltud/xArtists/commit/a006622c829a40598b22243ca6751c3ddb167d1f))


### Bug Fixes

* **launch:** V3 direct pack links + checkout lock + docs ([#264](https://github.com/Neltud/xArtists/issues/264)) ([f6c01ea](https://github.com/Neltud/xArtists/commit/f6c01ea9d68db515f3cdd82c1cf665329939789d))
* **mint:** restore SC pack prices to Rule1 33/22.5/15 EGLD after admin mint ([611e3b5](https://github.com/Neltud/xArtists/commit/611e3b5531fd2714297d95f45bedcbf75a7d5fa2))
* **mobile:** responsive Command Center rail, honest quote status and route checks ([#265](https://github.com/Neltud/xArtists/issues/265)) ([425c13c](https://github.com/Neltud/xArtists/commit/425c13ca5efed760f31d56f083dd8318f76cacc5))
* **public:** clarify Whop membership vs Genesis, official docs and HTTPS catalog CSP ([#266](https://github.com/Neltud/xArtists/issues/266)) ([92806c1](https://github.com/Neltud/xArtists/commit/92806c1ca6614521cf63462ee817c96cf496753e))

## [0.127.0](https://github.com/Neltud/xArtists/compare/v0.126.3...v0.127.0) (2026-11-02)


### Features

* **packs:** GenesisCard3D + mint-on-payment paper + metadata doc ([cd1a0f3](https://github.com/Neltud/xArtists/commit/cd1a0f3c552cd765e1162a2e4278c2cc2e989967))
* **packs:** PackLanding hero = GenesisCard3D + TCA Membership runbook ([01e34ed](https://github.com/Neltud/xArtists/commit/01e34ede8e9d9e1fa75582fb1c9ac72c6f7ad23a))
* **packs:** wire GenesisCard3D into GenesisPackShelf (recto/verso spin) ([5ac0b78](https://github.com/Neltud/xArtists/commit/5ac0b78bd86b453c265be55c0b4dfe61025b7fce))

## [0.126.3](https://github.com/Neltud/xArtists/compare/v0.126.2...v0.126.3) (2026-11-01)


### Documentation

* **sprint-2:** operator card B PayBox + compliance progress after S1-A VERT ([#240](https://github.com/Neltud/xArtists/issues/240)) ([4e32cf3](https://github.com/Neltud/xArtists/commit/4e32cf36dc0fbe5328ad9bb04fe32df015dd78b0))

## [0.126.2](https://github.com/Neltud/xArtists/compare/v0.126.1...v0.126.2) (2026-11-01)


### Documentation

* **sprint-1:** micro-preuve A VERT — buyPack Pulse journal 2026-11-01 ([#238](https://github.com/Neltud/xArtists/issues/238)) ([6fe32ea](https://github.com/Neltud/xArtists/commit/6fe32ea0bf9364c3574216940f6ca70caff48ca2))

## [0.126.1](https://github.com/Neltud/xArtists/compare/v0.126.0...v0.126.1) (2026-11-01)


### Documentation

* **sprint-1/2:** operator card micro-proof A + Sprint 2 compliance skeleton ([#225](https://github.com/Neltud/xArtists/issues/225)) ([098609d](https://github.com/Neltud/xArtists/commit/098609dc68b1012581c09206bd704c3fb7283446))

## [0.126.0](https://github.com/Neltud/xArtists/compare/v0.125.2...v0.126.0) (2026-11-01)


### Features

* **packs:** landing /packs/:packId miroir Whop + CTA checkout ([#220](https://github.com/Neltud/xArtists/issues/220)) ([d09f8e2](https://github.com/Neltud/xArtists/commit/d09f8e20251e66f6163a6e40a97b586b0ae267d6))


### Bug Fixes

* **probe:** 1 Nov mainnet snapshot, record LIA Ops breach, keep trading paper ([4f5628b](https://github.com/Neltud/xArtists/commit/4f5628b78312f4ced0663dc34f18187001da7572))

## [0.126.0] — 2026-11-01

* **probe:** public fallback moves to the 1 Nov mainnet probe (epoch 2280, EGLD $3.44, mcap $106.92M, LIA Ops 0.907888 EGLD / nonce 1487). Stop serving the 30 Oct chrome (epoch 2278, nonce 1479).
* **ops:** record the 30 Oct 17:20–17:29 UTC LIA Ops burst (8 txs, TROMEX removeLiquidity, 7.09 EGLD to the $TRO owner). That burst broke the published freeze. It is not a trading go-live and it does not authorise another signature.
* **go-live copy:** workflow default `VITE_LIA_LIVE_TRADING` is 0. Day 9/29 of Upbit notice 207379109. The Bithumb FET window (2–6 Nov) is not an EGLD clearance. No lift notice indexed on 1 Nov.
* **ci:** Pages artifact copy returns to the repo root before writing `_site`. `BUILD_ID.txt` catches up to 0.126.0 (it was still 0.124.0).

## [0.125.2](https://github.com/Neltud/xArtists/compare/v0.125.1...v0.125.2) (2026-10-31)


### Documentation

* **security:** P0 headers Pages + smoke checklist + marketing lock ([#215](https://github.com/Neltud/xArtists/issues/215)) ([d22d93d](https://github.com/Neltud/xArtists/commit/d22d93dcb14e49f8edd51532b70b0eb5842fd4c2))

## [0.125.1](https://github.com/Neltud/xArtists/compare/v0.125.0...v0.125.1) (2026-10-30)


### Bug Fixes

* **p0:** default VITE_LIA_LIVE_TRADING=0 fail-closed on Pages ([a260c09](https://github.com/Neltud/xArtists/commit/a260c0946b91d69d0263b01b209966dff0ecb13e))
* **p0:** fail-closed LIA=0, explicit PAYBOX_IPN_URL, no Stripe link fallback ([eb63df3](https://github.com/Neltud/xArtists/commit/eb63df32e93e62b30f4d19a9b798a35adc45003a))
* **p0:** require PAYBOX_IPN_URL env — no origin fallback before createOrder ([cbb23c1](https://github.com/Neltud/xArtists/commit/cbb23c12354524e7a41a3e17f5ed9bee5cc1dc67))
* **p0:** restore complete Pages workflow + LIA default 0 (rsync/build-info) ([e9ff790](https://github.com/Neltud/xArtists/commit/e9ff790b15382a86e0688ff72e360332b9d10c57))
* **p0:** restore full Pages workflow + LIA default 0 ([e596550](https://github.com/Neltud/xArtists/commit/e596550640b78b8d763cd7e5a4ca6ea81dd0b3b2))

## [0.125.0](https://github.com/Neltud/xArtists/compare/v0.124.0...v0.125.0) (2026-10-30)


### Features

* **map:** satellite-only capitals with monument relief markers ([3f47264](https://github.com/Neltud/xArtists/commit/3f47264119eb9e03580ddca5fa42f1e2bd63f513))
* **packs:** Genesis NFT-style preview plates + Rule1 caps ([b3a3f8e](https://github.com/Neltud/xArtists/commit/b3a3f8e968cffe98ad494f51740a04a714695aa0))


### Refactoring

* **hub:** replace neon gadget wall with labeled live control panel ([5b4ae0d](https://github.com/Neltud/xArtists/commit/5b4ae0db83b0e6c7f6f1a93c0acae2f8172070ea))
* **hub:** wire CommandWall rooms + drop holo gadget copy ([53a4949](https://github.com/Neltud/xArtists/commit/53a4949376ef4fc8553b4e7a7d6bdcaf9a708eb6))

## [0.124.0](https://github.com/Neltud/xArtists/compare/v0.123.0...v0.124.0) (2026-10-30)


### Features

* **museum:** Louvre M1 minimap room switcher ([84e18bf](https://github.com/Neltud/xArtists/commit/84e18bfb119e64a1e22cda086169fb8e519a47e8))
* **museum:** Louvre M1 multi-room nav + on-chain collection frames ([607f28e](https://github.com/Neltud/xArtists/commit/607f28e0ec4953f14ac2c10cdd6050f667a405d8))
* **museum:** Louvre M1 wing — 6 rooms + ALISTOR/BGG/XAUS frame loader ([7a3f3cf](https://github.com/Neltud/xArtists/commit/7a3f3cff039b9960628ea7ff8c6d1a9fb53d9a8a))
* **museum:** wire Louvre M1 entry blueprint into builtin layouts ([158ba47](https://github.com/Neltud/xArtists/commit/158ba474ebf4bb6158fd959f43a2f807dd7ca794))

## [0.123.0](https://github.com/Neltud/xArtists/compare/v0.122.4...v0.123.0) (2026-10-30)


### Features

* **ui:** redirect retired PolyLIA page to agents packs ([4dd63f6](https://github.com/Neltud/xArtists/commit/4dd63f603622ce896a52884911bb177ede63cd09))
* **ui:** retire PolyLIA module from experience registry ([09d6f0e](https://github.com/Neltud/xArtists/commit/09d6f0ee50ba3c01e3c810d36f7591413f2f4eea))


### Bug Fixes

* **map:** default Esri satellite only + fix container height ([d938b90](https://github.com/Neltud/xArtists/commit/d938b90e007b76baa94d13aec47090ec50d295df))

## [0.122.4](https://github.com/Neltud/xArtists/compare/v0.122.3...v0.122.4) (2026-10-30)


### Bug Fixes

* **probe:** epoch 2278 fallback and fail-closed Paybox default ([f36092b](https://github.com/Neltud/xArtists/commit/f36092b4271e29a9ffe07869002c6a57e5d22366))

## [0.125.0] — 2026-10-30

* **probe:** public fallback and entity snapshots move to the 30 Oct mainnet probe (epoch 2278, EGLD $3.21, mcap $99.73M, $TRO 561 accounts / 2815 tx). Stop serving the 28 Oct chrome when the API is down.
* **go-live copy:** Upbit wallet status is withdrawals-open / deposits-blocked with the caution designation still on. That is not a clearance of notice 207379109. Day 7/29 at probe time.
* **paybox:** Pages default `VITE_PAYBOX_ENABLED` returns to false. Preprod stays preprod. Do not treat the 29 Oct default `true` as production.
* **trading:** user-sign micro stays armed. LIA Ops nonce stays 1479. Proposal broadcast button stays locked.


## [0.122.3](https://github.com/Neltud/xArtists/compare/v0.122.2...v0.122.3) (2026-10-29)


### Documentation

* prod live status + security posture for GitBook sync ([7b3826a](https://github.com/Neltud/xArtists/commit/7b3826a5811ae5c42e12502e7adf9236818db6d7))

## [0.122.2](https://github.com/Neltud/xArtists/compare/v0.122.1...v0.122.2) (2026-10-29)


### Documentation

* Vellum LIA live-trade prompt + arming checklist 2026-10-29 ([60c47e9](https://github.com/Neltud/xArtists/commit/60c47e916ede6d2c2478feb77913fa6847e559f4))

## [0.122.1](https://github.com/Neltud/xArtists/compare/v0.122.0...v0.122.1) (2026-10-29)


### Bug Fixes

* **paybox:** clean ESM existsSync in loadPayboxPublicKey2048 ([f58062b](https://github.com/Neltud/xArtists/commit/f58062bcfc06e5e4dc13d770673b45ea5c3f39fc))
* **paybox:** HMAC field order EFFECTUE/REFUSE/ANNULE + IDENTIFIANT position ([b5f9499](https://github.com/Neltud/xArtists/commit/b5f9499c99e37b7f641679b5564c95edc6352ce0))

## [0.122.0](https://github.com/Neltud/xArtists/compare/v0.121.0...v0.122.0) (2026-10-29)


### Features

* **access-api:** quote FX fallback from EGLD_EUR_RATE env ([581e5ec](https://github.com/Neltud/xArtists/commit/581e5ec39fc15cd973ce9ed2cd308a2aba1fa269))


### Bug Fixes

* **ui:** restore MuseumPage + shell mode chips ([84bfa81](https://github.com/Neltud/xArtists/commit/84bfa81d9af3c4e6a3d01be93b1a6d3f7330d505))


### Documentation

* A sandbox status — preprod armed, E2E pending wallet+IPN ([99372b7](https://github.com/Neltud/xArtists/commit/99372b7204f9a238d1f73441e20512cec0300cee))
* launch prep checklist site + dApp 2026-10-29 ([3266407](https://github.com/Neltud/xArtists/commit/3266407a1dbf729167af39e14642b34e11150789))
* runbook A sandbox + B production PayBox marchande ([0be50e5](https://github.com/Neltud/xArtists/commit/0be50e5ad9bbc6b382b5421293d930b30476eabd))

## [0.121.0](https://github.com/Neltud/xArtists/compare/v0.120.0...v0.121.0) (2026-10-28)


### Features

* **ui:** CheckoutModal Genesis visual + wallet gate + AccessTerms props fix ([9231d4b](https://github.com/Neltud/xArtists/commit/9231d4b306db8d8b8de7e68e2394821931c42177))
* **ui:** GenesisPackShelf home component ([b03428d](https://github.com/Neltud/xArtists/commit/b03428dd05b5ededd6ccc46cbcc4ddd7e2fb6546))
* **ui:** mount GenesisPackShelf on Home after NetworkStrip ([826fbe1](https://github.com/Neltud/xArtists/commit/826fbe1b75198bd3cc382e904deeb290680e287f))
* **ui:** MyPacks Genesis hierarchy PACK_VISUAL + edition caps + xa-page ([2158300](https://github.com/Neltud/xArtists/commit/2158300a0a9fa51b15ca3ac78a93d4287b72281e))
* **ui:** Pages default access-api URL + GenesisPackShelf home + tokens ([d001bce](https://github.com/Neltud/xArtists/commit/d001bceefc46052272ab0640c7f1d93203fd47b6))


### Bug Fixes

* **ci:** restore Pages workflow + default VITE_ACCESS_API_BASE to Render access-api ([ad95c75](https://github.com/Neltud/xArtists/commit/ad95c75eb614c9d791b4a71721c750c87d48e15d))
* **ui:** restore MyPacks + Genesis PACK_VISUAL hierarchy ([c9e20bd](https://github.com/Neltud/xArtists/commit/c9e20bdfe3c66903e811a67ec18724e8504a5825))

## [0.120.0](https://github.com/Neltud/xArtists/compare/v0.119.7...v0.120.0) (2026-10-28)


### Features

* **packs:** align Genesis catalog prices 110/75/50 + visual motifs + caps ([a46925b](https://github.com/Neltud/xArtists/commit/a46925b931c29fcf8da602ddd4537c31a50bf899))
* **ui:** Agents page Genesis caps + acid visual system (Vague 1) ([c763ef4](https://github.com/Neltud/xArtists/commit/c763ef41afc13146d147684d35762a593aabd00e))
* **ui:** Genesis pack edition caps 333/500/777 + Agents page harmonize (Vague 0+1) ([0fa27b6](https://github.com/Neltud/xArtists/commit/0fa27b690c0cdf0ad1d1b197d7f9dd145f28823e))


### Bug Fixes

* **ui:** restore agentPacks + Genesis caps 333/500/777 + PACK_VISUAL ([2f84608](https://github.com/Neltud/xArtists/commit/2f84608599d0908b4fa4d3fb7a591ef8385fb642))


### Documentation

* lock Genesis pack editions 333/500/777 ([42fd6c0](https://github.com/Neltud/xArtists/commit/42fd6c0c4b9cef77971e7be893095590f1c5b2b8))

## [0.119.7](https://github.com/Neltud/xArtists/compare/v0.119.6...v0.119.7) (2026-10-28)


### Documentation

* **deploy:** point SANDBOX runbook to Render+Neon GO checklist ([4900137](https://github.com/Neltud/xArtists/commit/4900137a176d9111e5a8ea1a7e0c630e48f3bc51))
* **deploy:** Render Free + Neon GO checklist (budget 0€, paper) ([ecc08d3](https://github.com/Neltud/xArtists/commit/ecc08d313ecdb4dc13790585a3d8664eb48d7ee7))

## [0.119.6](https://github.com/Neltud/xArtists/compare/v0.119.5...v0.119.6) (2026-10-28)


### Bug Fixes

* **go-live:** refresh 28 Oct probe, keep LIA paper ([8653f4c](https://github.com/Neltud/xArtists/commit/8653f4cc85af04166e90c7e6d123e9bdd46761a3))

## [0.124.0] — 2026-10-28

### Bug Fixes

* **probe:** refresh the public fallback and entity snapshots to the 28 Oct mainnet probe (epoch 2276, EGLD $3.37, mcap $104.65M). Stop serving the 27 Oct chrome when the API is down.
* **go-live:** keep `VITE_LIA_LIVE_TRADING=0`. Day 6/29 of the Upbit 207379109 extension at probe time. A Bithumb FET notice on 2–6 Nov is not an EGLD clearance. Do not merge PR #200 (stripped access-api lockfile).

## [0.119.5](https://github.com/Neltud/xArtists/compare/v0.119.4...v0.119.5) (2026-10-27)


### Bug Fixes

* **quote:** Rule1 parity — EGLD = fiat anchor / rate (margin accounting only) ([#198](https://github.com/Neltud/xArtists/issues/198)) ([0d24baf](https://github.com/Neltud/xArtists/commit/0d24bafa0768102d102686211161d8a049434578))


### Documentation

* sandbox access-api deploy runbook + Dockerfile ([#197](https://github.com/Neltud/xArtists/issues/197)) ([9370a10](https://github.com/Neltud/xArtists/commit/9370a1014797eeeb92bc97aee8c5ee2980ffc428))

## [0.119.4](https://github.com/Neltud/xArtists/compare/v0.119.3...v0.119.4) (2026-10-27)


### Bug Fixes

* **go-live:** refresh 27 Oct probe, keep LIA paper ([2a48195](https://github.com/Neltud/xArtists/commit/2a4819591f505f319733fa1ad0d4e5bb9cecafc4))

## [0.123.0] — 2026-10-27

### Bug Fixes

* **probe:** refresh the public fallback and entity snapshots to the 27 Oct mainnet probe (epoch 2275, EGLD $3.22). Stop serving the 26 Oct chrome when the API is down.
* **contracts:** stop labeling listing #2 as a live 0.25 EGLD price. That figure stays a historical proof. SC balance remains 0.0175 EGLD.
* **go-live:** keep `VITE_LIA_LIVE_TRADING=0`. Day 4/29 of the Upbit 207379109 extension. A Bithumb FET notice on 2–6 Nov is not an EGLD clearance.

## [0.119.3](https://github.com/Neltud/xArtists/compare/v0.119.2...v0.119.3) (2026-10-26)


### Bug Fixes

* **probe:** refresh 26 Oct fallback and keep trading paper ([0fb30d7](https://github.com/Neltud/xArtists/commit/0fb30d75d6943a85945e7ca42c86eeb09e1ffd99))
* **pwa:** do not read navigator outside a browser ([b420bd5](https://github.com/Neltud/xArtists/commit/b420bd5d8a03b0d67f90278d1c173529afe051be))

## [0.122.0] — 2026-10-26

### Bug Fixes

* **probe:** refresh the public fallback and entity snapshots to the 26 Oct mainnet probe (epoch 2274, EGLD $3.23). Stop serving the 25 Oct chrome when the API is down.
* **readme:** stop describing listing #2 as a live 0.25 EGLD price. That figure is a historical proof, not a fallback.
* **go-live:** keep `VITE_LIA_LIVE_TRADING=0`. Day 3/29 of the Upbit 207379109 extension. A Bithumb FET notice in early November is not an EGLD clearance.

## [0.119.2](https://github.com/Neltud/xArtists/compare/v0.119.1...v0.119.2) (2026-10-25)


### Bug Fixes

* **go-live:** publish the site, keep LIA paper through the Korean extension ([6665441](https://github.com/Neltud/xArtists/commit/666544199617d087ea1f1702dfef35a98fc09627))

## [0.121.0] — 2026-10-25

### Bug Fixes

* **go-live:** distinguish site go-live from trading go-live. Show days left until 16 Nov and 21 Nov. Keep `VITE_LIA_LIVE_TRADING=0`.
* **entity map:** stop serving the 17 Oct LIA snapshot (1.603782 EGLD, nonce 1473). Live API overlay, fallback probe nonce 1479 / 1.585598 EGLD.

## [0.119.1](https://github.com/Neltud/xArtists/compare/v0.119.0...v0.119.1) (2026-10-24)


### Bug Fixes

* **access-api:** health moonpay flags, paybox 501 before auth, origin+rate limit, introspect ([1aef2db](https://github.com/Neltud/xArtists/commit/1aef2db57b42240f4b1b8bfa238aed4731b9c568))
* **go-live:** Korean warning is an extension, keep LIA paper ([87b62b7](https://github.com/Neltud/xArtists/commit/87b62b7b5a324f90d521b88f2d53260270457c4e))

## [0.120.0] — 2026-10-24

### Bug Fixes

* **go-live:** mount the orphan public pulse and treat the 23 Oct Upbit/Bithumb notice as an extension through 16–20 Nov, not a trading clearance. `VITE_LIA_LIVE_TRADING` stays 0.

## [0.119.0](https://github.com/Neltud/xArtists/compare/v0.118.1...v0.119.0) (2026-10-21)


### Features

* **v3:** experience state/Dialog/Icon/main + frontend release tests ([a33c63c](https://github.com/Neltud/xArtists/commit/a33c63c49cd074e493b571fabe58b5412169bc78))
* **v3:** frontend release tests (player, museum, access, load-source) ([66c1900](https://github.com/Neltud/xArtists/commit/66c1900455b51eff7101db2c1cef4394848a9d6b))
* **v3:** modules registry, App routes, scripts check-routes/verify-site/render, vite config ([a7901e3](https://github.com/Neltud/xArtists/commit/a7901e3a1b49ef54c44a3111b13249db37dddaa2))


### Bug Fixes

* **frontend:** Nelson playlist + Cacher keeps iframe / Arrêter unmounts ([00d5922](https://github.com/Neltud/xArtists/commit/00d592282f3cacddcbc14ceba597912aa063372a))
* **v3:** restore real modules.ts (36 modules + groups) and App/main/experience core ([3c9f3f1](https://github.com/Neltud/xArtists/commit/3c9f3f1e47fd183bef00c98b0cfbfba5bdc4e1f5))

## [0.118.1](https://github.com/Neltud/xArtists/compare/v0.118.0...v0.118.1) (2026-10-21)


### Bug Fixes

* **frontend:** instrumentales Nelson Tuduri et commandes musée mobile ([971b826](https://github.com/Neltud/xArtists/commit/971b82676e5feefdb4bc94993ae7ecf094ec1c9e))
* **frontend:** museum safe-area / bottom-nav CSS offsets ([5abf9d8](https://github.com/Neltud/xArtists/commit/5abf9d8678ab7d8abdf1962a8f8d410743804ed9))
* **frontend:** Nelson playlist default + listType=playlist embed ([3e6af6b](https://github.com/Neltud/xArtists/commit/3e6af6b5727ecb035df79a3f14677958dc805526))
* **frontend:** restore MuseumWebGLHallLive portal + measured nav insets ([1ebe8db](https://github.com/Neltud/xArtists/commit/1ebe8db5bf319fc5171704f1274cf16fd99fb4bf))
* **frontend:** stable playlist iframe player + museum CSS offsets ([c7096cd](https://github.com/Neltud/xArtists/commit/c7096cda14631ec5d8347304993f21b4752103f8))

## [0.118.0](https://github.com/Neltud/xArtists/compare/v0.117.0...v0.118.0) (2026-10-21)


### Features

* **go-live:** live balances and Korean review day counter ([6042918](https://github.com/Neltud/xArtists/commit/604291851825f67f9655650fe05c88af5e7e089f))

## [0.117.0](https://github.com/Neltud/xArtists/compare/v0.116.1...v0.117.0) (2026-10-20)


### Features

* **go-live:** pulse API + Upbit window, no invented listing price ([373df57](https://github.com/Neltud/xArtists/commit/373df570cdb5a710b02e852b57921c7f0ad65b98))

## [0.116.1](https://github.com/Neltud/xArtists/compare/v0.116.0...v0.116.1) (2026-10-19)


### Bug Fixes

* **security:** daily safety — fail-closed Paybox, require wallet for fiat, align EUR prices ([6a154b5](https://github.com/Neltud/xArtists/commit/6a154b572124096aac17b9d99a0d71a12d5464b2))


### Documentation

* mark Paybox fail-closed safety pass + update suite (2026-10-19) ([40c75ce](https://github.com/Neltud/xArtists/commit/40c75ce7f48a154cf72a0abfacf498115f63c512))

## [0.116.0](https://github.com/Neltud/xArtists/compare/v0.115.0...v0.116.0) (2026-10-18)


### Features

* **museum:** MuseumPage i18n modes + lead/disclaimer keys ([0e22713](https://github.com/Neltud/xArtists/commit/0e22713f80453f77b92a1a0a91957099da22c7c8))


### Documentation

* DESIGN_VALIDATED_DELIVERY — museum immersive + i18n multi-lang done ([e23a951](https://github.com/Neltud/xArtists/commit/e23a951290e1a0135dce5fa3f105e45b3f9ffb4e))

## [0.115.0](https://github.com/Neltud/xArtists/compare/v0.114.0...v0.115.0) (2026-10-18)


### Features

* **app:** route aliases from registry + real 404 ([733f077](https://github.com/Neltud/xArtists/commit/733f077fa54980bf6c53c4ddc8bb2f3cd182ca2f))
* centralized route registry — 5 spaces + aliases + meta ([6e47c61](https://github.com/Neltud/xArtists/commit/6e47c61019a64bbaf5d2d33d18e4ac9a2a9e8c1c))
* **header:** registry nav + graphite/acid chrome ([952a0b7](https://github.com/Neltud/xArtists/commit/952a0b7d4d4cec3b232b6c598044158f3180976d))
* **museum:** analog joystick with onChange + isolated pointer capture ([24aff68](https://github.com/Neltud/xArtists/commit/24aff6871dfcb1d725da0f23b8f0d38ace699e45))
* **museum:** FPS/avatar, dual-touch look, fullscreen, prev/next, ZQSD, reset ([195c228](https://github.com/Neltud/xArtists/commit/195c228fb153f1c17042e47403818eb3f35c5639))
* **museum:** immersive pass — teleport prev/next, dual-touch look, fullscreen polish ([05cf505](https://github.com/Neltud/xArtists/commit/05cf505303745521564e6c35a1fa361165b09f49))
* **museum:** larger touch joystick + acid green chrome ([6e0f3d4](https://github.com/Neltud/xArtists/commit/6e0f3d45e19397136d504e29bc5a1a84fde90042))
* **nav:** mobile bottom nav from route registry — 5 hubs ([af19593](https://github.com/Neltud/xArtists/commit/af195939c6a2d89687d3c9220ce50660301631ab))
* real 404 page (no silent redirect home) ([39fc06d](https://github.com/Neltud/xArtists/commit/39fc06d4061b9a3e1d43e6a200b46d44eb24df31))


### Bug Fixes

* **wc:** remove Firebase deep links — native xPortal / https only ([0f98d0e](https://github.com/Neltud/xArtists/commit/0f98d0e4ed2e42ae07d5945d1e9166bb6745a4e9))
* **xportal:** init → connect → login({ approval }) · no Firebase · explicit open ([ccf8230](https://github.com/Neltud/xArtists/commit/ccf823091bf398d96fc79a334c8d044c054c99eb))


### Documentation

* validated design delivery report — graphite/acid, routes, xPortal, limits ([542ba81](https://github.com/Neltud/xArtists/commit/542ba81a0d16f0c64ae9d27f1327ed5429cdd4a7))

## [0.114.0](https://github.com/Neltud/xArtists/compare/v0.113.1...v0.114.0) (2026-10-18)


### Features

* **agents:** protocol packs page + i18n keys ([4ef0264](https://github.com/Neltud/xArtists/commit/4ef0264e55eeddf6dc8f511bd576acaa97be1977))
* **cc:** protocol-grade Command Center UI (soul-aligned) ([92ba961](https://github.com/Neltud/xArtists/commit/92ba961f970153b9f399146722a673e1a4c82f5b))
* **dao:** protocol DAO page chrome ([24e8c2c](https://github.com/Neltud/xArtists/commit/24e8c2ceda9e0e4fdb2d895594ad1d249cce2b90))
* **footer:** protocol footer chrome ([0a39b75](https://github.com/Neltud/xArtists/commit/0a39b75f8d3381e63ba86b778fe4f53d35b160fe))
* **header:** cleaner protocol nav (soul-aligned) ([a458105](https://github.com/Neltud/xArtists/commit/a4581054e5672a0bd552ff8dfeb54dac9520debd))
* **home:** soul-aligned protocol hero + stats + module grid ([fbe0ed8](https://github.com/Neltud/xArtists/commit/fbe0ed8ed317a41e4685959940ce4bd02728f396))
* **lia:** protocol LIA Hub chrome + i18n ([a6fc592](https://github.com/Neltud/xArtists/commit/a6fc59209d8737d47ed9bfd9d956a6b5b7686956))
* **lp:** protocol LP pools page chrome ([61d1699](https://github.com/Neltud/xArtists/commit/61d16992b6d563fc94172eebf3bdc9039e25db97))
* **market:** protocol marketplace UI + clearer tabs ([a619345](https://github.com/Neltud/xArtists/commit/a619345cebe743755a161aef1b4824706eeb37b3))
* **museum:** protocol gallery chrome + i18n mode labels ([511407a](https://github.com/Neltud/xArtists/commit/511407a95923446bee260a4d25ec2ca2b380e4ba))
* **portfolio:** protocol portfolio chrome + i18n ([622f92e](https://github.com/Neltud/xArtists/commit/622f92e3ca33dac7b1c1ed75b5d37d5e03627e5d))
* **sale:** soul-aligned packs sale + i18n FR/EN ([3701e0c](https://github.com/Neltud/xArtists/commit/3701e0c59e7342d0a3700f6a27df6ffa37d43ed8))
* **staking:** protocol staking & yield chrome ([a57d7a9](https://github.com/Neltud/xArtists/commit/a57d7a91c07a2a272ce50b7a6da55ef87eeda803))
* **studio:** protocol Creator Studio chrome + i18n ([c6bae27](https://github.com/Neltud/xArtists/commit/c6bae2797438707076f1d4b1a75414442dfd709d))
* **tca:** protocol TCA gate chrome + clearer access states ([6d5e09a](https://github.com/Neltud/xArtists/commit/6d5e09ad2c99e2eb26096c34a0990ed14e897e86))
* **wallet:** protocol wallet page + i18n ([41f07a0](https://github.com/Neltud/xArtists/commit/41f07a06c505685781fe7e5693ec4a37b87e8dcc))


### Bug Fixes

* **paybox:** refuse client URL checkout that can carry an amount ([fec4554](https://github.com/Neltud/xArtists/commit/fec45543d564237d3bf14c166d92a8246a8478c4))
* **paybox:** server catalog 110/75/50 EUR as sole price source ([91eba22](https://github.com/Neltud/xArtists/commit/91eba2236e342bc5e1a89b2f841aa784ce90970c))


### Documentation

* design audit xArtists vs soul.io + refonte plan i18n ([459edd4](https://github.com/Neltud/xArtists/commit/459edd44735f923d8746eafd696530cae7baff65))
* mark LIA TCA Wallet Staking protocol chrome done ([80f5949](https://github.com/Neltud/xArtists/commit/80f5949e73c55665b3f5942f6f9f2f8fae4e2414))
* mark P2–P5 progress on soul redesign ([e005150](https://github.com/Neltud/xArtists/commit/e005150f3cf32943919cbcc45bd8d817a886bd2d))
* Studio Portfolio DAO LP protocol chrome done ([58648f0](https://github.com/Neltud/xArtists/commit/58648f009d606a800041f5a5651b2fe007aac440))

## [0.113.1](https://github.com/Neltud/xArtists/compare/v0.113.0...v0.113.1) (2026-10-18)


### Documentation

* document server-side price enforcement for PayBox ([4ca8047](https://github.com/Neltud/xArtists/commit/4ca8047854f63d1269a6e387a46cb0b8f0684df0))

## [0.113.0](https://github.com/Neltud/xArtists/compare/v0.112.1...v0.113.0) (2026-10-17)


### Features

* **executor:** PayBox multichain router — DecisionProof → Solana/EVM swap intents ([0657550](https://github.com/Neltud/xArtists/commit/0657550e0c34e75ee780501cb9083cc163f0e055))


### Bug Fixes

* **access-api:** clearer Stripe stub responses — no false success, explicit TODO path ([0091e56](https://github.com/Neltud/xArtists/commit/0091e56b3b81307d7d5d8f0c6d81638d75ba2872))
* **ui:** WarpsMintAgent — honest not-implemented state, no fake success alert ([aa852e8](https://github.com/Neltud/xArtists/commit/aa852e837f7b611dc7b0aec42627fc49c033c8a8))


### Documentation

* **audit:** Grok deep READ-ONLY + write pass 2026-10-17 — secrets clean, tickets P0-P2, gates paper ([389525f](https://github.com/Neltud/xArtists/commit/389525f060b68b54fcb15506f8dcae81fadf8415))
* link AUDIT_GROK_2026-10-17 + reinforce P0 proof / paper gates ([7206b4c](https://github.com/Neltud/xArtists/commit/7206b4cfd7462cf7c5d73b2cd57ceda874d7d2b3))
* Multichain trading brain → PayBox executor (Solana/EVM) — doctrine + gates ([0e69698](https://github.com/Neltud/xArtists/commit/0e69698c5309fe50b06f3780d002e07920d2a27d))
* **readme:** link AUDIT_GROK_2026-10-17 after deep write pass ([068b907](https://github.com/Neltud/xArtists/commit/068b907012a213c2e704108a7a8cb322c4358590))

## [0.112.1](https://github.com/Neltud/xArtists/compare/v0.112.0...v0.112.1) (2026-10-17)


### Bug Fixes

* **lia:** export buildUserSignPayload so Pages can ship 0.113 ([b8b0900](https://github.com/Neltud/xArtists/commit/b8b0900c5a513c98bbac736a7ca860806d37a476))


### Documentation

* **status:** probe 17 oct — epoch 2265, Upbit window, suites logiques GO_LIVE SC ([b8e73b6](https://github.com/Neltud/xArtists/commit/b8e73b6b0c577a5d262769da01cbbfd41d5552be))

## [0.112.0](https://github.com/Neltud/xArtists/compare/v0.111.0...v0.112.0) (2026-10-16)


### Features

* **lia:** live trading=1 path — xPortal sign for LIA ops + bootstrap TX ([70d8d83](https://github.com/Neltud/xArtists/commit/70d8d831b7185adea28decfd4bc718d8601899b4))
* **v0.110.0:** wire live xPortal into cockpit, restore dome+portals home, dual market labels ([5f615ae](https://github.com/Neltud/xArtists/commit/5f615aee2045e45114ba3d29b9ac185e0b970d21))


### Bug Fixes

* **market:** solid digital NFT/packs tab + live MVX floors; fix Agents notIncluded crash ([d85a8bf](https://github.com/Neltud/xArtists/commit/d85a8bfb498b55a76dbff10a3a39ccecbfe0f236))


### Documentation

* **security:** emergency pause runbook + buyAgentAction warnings + audit status update ([a142277](https://github.com/Neltud/xArtists/commit/a142277870b0ee8c670ecf991c06012c6b11249b))

## [0.111.0](https://github.com/Neltud/xArtists/compare/v0.110.1...v0.111.0) (2026-10-16)


### Features

* **i18n:** Dashboard + onboarding zero hardcode; net.timeout/okCache keys ([2b484a5](https://github.com/Neltud/xArtists/commit/2b484a5e93a73f32e75aaea283aec41bd60f73fb))


### Bug Fixes

* **cc:** distinct Pulse/Yield/Sentinel rooms + arrow-key navigation ([5ebd9c3](https://github.com/Neltud/xArtists/commit/5ebd9c35cedcf35c98f6f135d479086579f0784d))
* **ui:** restore fullscreen 360° dome home + clean HUD for presentation ([91af544](https://github.com/Neltud/xArtists/commit/91af54496666919a1326d402cca2afc2ba390aa4))


### Refactoring

* **clean:** detach RCE from slotHouseGuard after Slot extract ([4ead910](https://github.com/Neltud/xArtists/commit/4ead910199bcd0719e46ed88e9255ce86af48a58))
* **clean:** drop Slot from chain mirror targets ([0708279](https://github.com/Neltud/xArtists/commit/0708279443a9ebcf8f7f9ef36adab0a3913d0903))
* **clean:** remove Slot zone audio duck from route sync ([d1a38cf](https://github.com/Neltud/xArtists/commit/d1a38cf0162aace2dceb555d3d51f753d399c058))
* **clean:** remove slotEconomy (extracted to xArtists-Slot) ([2c3fa39](https://github.com/Neltud/xArtists/commit/2c3fa3929db6672dcfbba2eae4c234e9c312eb8e))
* **clean:** remove SlotHoloTerminal (extracted to xArtists-Slot) ([27d4310](https://github.com/Neltud/xArtists/commit/27d4310bc750c8dadfb69cd61bf76ed1f80b4212))
* **clean:** remove slotHouseGuard (xArtists-Slot) ([8b9f339](https://github.com/Neltud/xArtists/commit/8b9f33942d097195ff74e3538192949fdff6562e))
* **clean:** remove slotSensory ([815abe1](https://github.com/Neltud/xArtists/commit/815abe1c2c312361ab535db6fc02804a093cd3dc))
* **clean:** remove useSlotTx hook (xArtists-Slot) ([ef4c27a](https://github.com/Neltud/xArtists/commit/ef4c27a14ba8682ceba56f969cb11f8964b2c8f9))

## [0.110.1](https://github.com/Neltud/xArtists/compare/v0.110.0...v0.110.1) (2026-10-16)


### Bug Fixes

* **agents:** unlock packs on the buyPack codeHash ([d728c49](https://github.com/Neltud/xArtists/commit/d728c49736dfe078298ba6b03b1cd980ad4c13b4))
* **lia:** add allocate_budget and fuse_brain_outputs compat wrappers ([fa95524](https://github.com/Neltud/xArtists/commit/fa95524231edd83ba86acb6fd169e2819bc271d9))
* **pricing:** AGENT_PACKS list prices Pulse 10 / Yield 5 / Sentinel 2.5 EGLD ([9964ada](https://github.com/Neltud/xArtists/commit/9964ada68a275b7bba5c58470f4f57e11d05311e))
* **pricing:** align UI pack list prices with on-chain 10/5/2.5 EGLD ([5138b96](https://github.com/Neltud/xArtists/commit/5138b96d51e2ba4f5d3dce95b78973af6444f3e7))
* **regression:** allocate_budget/fuse_brain_outputs compat + contracts LIVE shape ([324bd7d](https://github.com/Neltud/xArtists/commit/324bd7d54c52d011b352e3b248f160c49f937398))

## [0.110.0](https://github.com/Neltud/xArtists/compare/v0.109.0...v0.110.0) (2026-10-15)


### Features

* **home+cc:** portal hall HomeMenuHall + ambientSnap on MarketTape ([c551fb6](https://github.com/Neltud/xArtists/commit/c551fb60156d9e5691f77103b507613a4d19bc2e))
* **museum:** Agrandir image fullscreen in artwork modal + RWA details ([3479ff0](https://github.com/Neltud/xArtists/commit/3479ff015a372afda1eef94b8a5901ae46ae07bd))
* **museum:** AmbientLight 0.8 + stronger key/fill (v0.110) ([e90df0d](https://github.com/Neltud/xArtists/commit/e90df0d6619ab7272175f1131b8d22b4cbd7933f))
* **museum:** raycast click to enlarge, drag look, texture fallbacks, free walk ([b4d0de2](https://github.com/Neltud/xArtists/commit/b4d0de2f36bf99e0f24d6ffbcd40715761439b47))
* **v0.110.0:** canonical 4 hubs — /market marketplace, hub redirects, dual RWA/digital tabs ([093de09](https://github.com/Neltud/xArtists/commit/093de09e0a9576a2495dc06c99591132417b0dbe))
* **v0.110:** App 4 hubs routing + dual marketplace RWA/digital + nav /market ([f7b547e](https://github.com/Neltud/xArtists/commit/f7b547edd15e8a21124171a2b818920c509b3d0f))
* **v0.110:** App.tsx canonical /market + /hub redirect + analytics ([fef7558](https://github.com/Neltud/xArtists/commit/fef75586cecd011752fdd187d6ecbd9bef8847ed))
* **v0.110:** Header /market hub + Marketplace dual tabs RWA|Digital ([22d784a](https://github.com/Neltud/xArtists/commit/22d784ad762b2c8676c66bc9d5d0faf91c2e4e1f))
* **v0.110:** HomeMenuHall portals Musee/Packs/Market/Command ([bc1a709](https://github.com/Neltud/xArtists/commit/bc1a709fdcd65c3de44dbfdd549489ba35646984))


### Bug Fixes

* **cc:** MarketTape optional snap — kill mode crash; wire ambientSnap ([fa50908](https://github.com/Neltud/xArtists/commit/fa50908c38129d96630ec769f3bddd390d5f381a))
* **cc:** pass ambientSnap to MarketTape (mode crash root fix) ([19996ba](https://github.com/Neltud/xArtists/commit/19996babaee03dcc9df0e6105a8d5fa663b28dd2))

## [0.109.0](https://github.com/Neltud/xArtists/compare/v0.108.2...v0.109.0) (2026-10-15)


### Features

* **cockpit:** Pack3DCockpit signals + fix mode crash + RWA-only market + home title ([fc14783](https://github.com/Neltud/xArtists/commit/fc1478330fe97df6225c12b2902e3e2a1d9df779))
* **marketplace:** wire Frameit Indexing + RWA Physical Art panel (v0.109.0) ([1584669](https://github.com/Neltud/xArtists/commit/1584669b413e1fa14f5a39e5e5ccdeea9eb3653c))
* mount Pack3DCockpit on Agents + LIA Hub; harden AgentNftOrb ([5865e83](https://github.com/Neltud/xArtists/commit/5865e83ced76bea2f52fa103c8ce271a0f5d2674))
* **packs:** Pack3DCockpit holographic signals console ([1d8b6c5](https://github.com/Neltud/xArtists/commit/1d8b6c5bb7772e42796bfb56cd5d05ea82879791))
* **rag:** ATC→TCA pipeline, ACTIVE_CONTEXT, setPackPrice workflow + local script ([642e1d4](https://github.com/Neltud/xArtists/commit/642e1d4c96d852d303ac3f56f40f4a67e733f077))
* **v0.109:** Frameit indexing API, RWA provenance metadata, market panel ([a5279a8](https://github.com/Neltud/xArtists/commit/a5279a88325ebf4a4c77d78406b0bb66d4e490aa))
* **v0.109:** FrameitMarketPanel + MuseumWebGL 60fps pause/frustum/context-loss ([f5b6739](https://github.com/Neltud/xArtists/commit/f5b6739cd99ed43a11a7f98f043f6829fd2aa1e8))


### Bug Fixes

* **cc:** DashboardSource pack fields name/icon + mode optional chain ([00e1c8d](https://github.com/Neltud/xArtists/commit/00e1c8dc34429a142169f33ed9156869cce0601b))
* **lia:** mount Pack3DCockpit + optional-chain mode/uniforms on LIA Hub ([e304a46](https://github.com/Neltud/xArtists/commit/e304a46096606287f38ee1f83cad2da5a5921d8a))
* **market+cc:** RWA-only market panel wiring, CC access/mode guards ([a13dfed](https://github.com/Neltud/xArtists/commit/a13dfed96c29a990ea03038b70c210e0ac7d0064))
* **market:** RWA Physical Art only (remove Frameit indexing UI copy) ([f103b95](https://github.com/Neltud/xArtists/commit/f103b951ab8e2d2050a0513329724090629129c3))
* **security:** audit S-01/S-02 — mainnet pack tickers, chain-only access, paper mint DEV-only ([34b7aa9](https://github.com/Neltud/xArtists/commit/34b7aa98abfb71797fcd9804cc5ebba2c4bb8ed3))
* **security:** chain-only markPackOwned/loadOwnedPacks + XAIPLS matching + DEV paper mint ([f78e993](https://github.com/Neltud/xArtists/commit/f78e993a612795d0812e6203793e6c7a13c9c7a3))
* **security:** mainnet PACK_COLLECTIONS + DEV-only paper mint + chain matching XAIPLS/XAIYLD/XAISNT ([8d69b61](https://github.com/Neltud/xArtists/commit/8d69b613f26af7de89afb395820568ee5ba7ed19))
* **security:** tickerToPackId XAIPLS/XAIYLD/XAISNT + DEV-only paper mint in useAgentPackTx ([678010c](https://github.com/Neltud/xArtists/commit/678010cb6d75c58360f47f6da9a6330f9eec977c))
* **ui:** institutional home copy, RWA-only market, CC mode guard, museum lights+art ([f10f323](https://github.com/Neltud/xArtists/commit/f10f32368328237d01406373db856b6919cc8ee5))
* **ui:** purge Slot from nav, home pack prices 10/5/2.5, cache bust 0.109.1 ([d8a83f0](https://github.com/Neltud/xArtists/commit/d8a83f063f4492252088f73a893cd9b24bf505c9))
* **ui:** remove Slot from product map, /slot redirect, version 0.109.1 cache bust ([03c6660](https://github.com/Neltud/xArtists/commit/03c6660e1e8c4dec4a682d27d002f3bdaf9edc47))


### Performance

* **museum:** restore MuseumWebGLHallLive + webglPause, frustumCulled, low-end DPR, context-loss 2D fallback ([263e9f2](https://github.com/Neltud/xArtists/commit/263e9f2d73b36c4d89d1ab4c621cadfaa117ddc5))
* **museum:** restore placeArt wall hangings + boost lighting + webglPause ([bff96b5](https://github.com/Neltud/xArtists/commit/bff96b59a51128c5c3cf8bd3a7fcc8680962ecb6))
* **museum:** webglPause on visibility, frustumCulled, low-end DPR, context-loss fallback ([09c8043](https://github.com/Neltud/xArtists/commit/09c80434211bf306f24b58a771af9329b77fc694))


### Documentation

* **mainnet:** update official SC pack prices to 10/5/2.5 EGLD ([2ba7027](https://github.com/Neltud/xArtists/commit/2ba7027d4853c59e0942ca95dd496cf814f21b91))
* release notes & CHANGELOG for v0.109.0 (Marketplace RWA/Frameit, Museum 60fps, zero-trust packs) ([d0a1f33](https://github.com/Neltud/xArtists/commit/d0a1f333eb81b094143e8d74649ddaae8712e0a5))
* restore full CHANGELOG under v0.109.0 (history from pre-truncate) ([b2d36f1](https://github.com/Neltud/xArtists/commit/b2d36f1ab5acd01ff67b595f81821d29de2e109a))

## [0.109.0](https://github.com/Neltud/xArtists/compare/v0.108.2...v0.109.0) (2026-10-15)

### Features

* **marketplace:** wire Frameit Indexing + RWA Physical Art panel on `/marketplace` ([1584669](https://github.com/Neltud/xArtists/commit/1584669b413e1fa14f5a39e5e5ccdeea9eb3653c))
* **frameit:** secondary-market floor + Frameit/Xoxno deep-links for `XAIPLS-2cf72b` · `XAIYLD-987e24` · `XAISNT-3d8a6b` (`frameitApi.ts`, `FrameitMarketPanel.tsx`)
* **rwa:** provenance schema — dimensions, medium, NFC chip ID, on-chain certificate (`rwaMetadata.ts`)
* **museum:** WebGL perf — frustum culling, `webglPaused` on background, context-lost → 2D fallback, dispose on unmount (`MuseumWebGLHallLive.tsx`)

### Security

* **access:** zero-trust pack rights — on-chain ESDT/SFT possession only (no `localStorage` grant path)
* **packs:** mainnet tickers aligned in `packNftMetadata.ts`; `mintPaper` restricted to DEV

### Economy (mainnet)

* **sc:** pack prices via `setPackPrice` — Pulse 10 EGLD · Yield 5 EGLD · Sentinel 2.5 EGLD (LIA Vellum trading wallet feed)

### Docs / RAG

* **docs:** `docs/RELEASE_NOTES_v0.109.0.md`
* **rag:** automated ingestion (`rag-ingestion.yml`) + shared memory sync (`ACTIVE_CONTEXT.md`)

## [0.108.2](https://github.com/Neltud/xArtists/compare/v0.108.1...v0.108.2) (2026-10-14)


### Documentation

* **sc:** pack collections configured — ESDTRoleNFTCreate + setPackCollection verified live ([04446fd](https://github.com/Neltud/xArtists/commit/04446fdf13aefabe5b82a5dbb734f331c7db2d77))

## [0.108.1](https://github.com/Neltud/xArtists/compare/v0.108.0...v0.108.1) (2026-10-14)


### Bug Fixes

* **ci:** configure existing XAIPLS/XAIYLD/XAISNT — skip re-issue ([677e3df](https://github.com/Neltud/xArtists/commit/677e3dfea9d95e78411d0b012f0e6f056625db84))
* **ci:** UserPEM Path + DEPLOYER env for issue pack collections ([8c2ec74](https://github.com/Neltud/xArtists/commit/8c2ec74798e7bc796b35d563ab903feb6f14e8e7))


### Documentation

* **sc:** agents-marketplace buyPack upgrade confirmed mainnet — collections pending ([5ae9494](https://github.com/Neltud/xArtists/commit/5ae9494b82db7e3ff0035a3a2c3cefa7443ab341))

## [0.108.0](https://github.com/Neltud/xArtists/compare/v0.107.0...v0.108.0) (2026-10-14)


### Features

* **onchain:** 1 pack purchase = 1 ESDT NFT — nftService, buyPack TX, collection match ([7a2f225](https://github.com/Neltud/xArtists/commit/7a2f22563306e66a3e48b2d640f6ada980e26f2e))
* **onchain:** buyPack TX 1 pack = 1 ESDT NFT + monitor + waitForPackNft ([3131516](https://github.com/Neltud/xArtists/commit/31315165dd469e3e72467e7718f906c8f6747542))
* **onchain:** CheckoutModal crypto rail calls buyPack for 1 pack = 1 ESDT NFT ([8812ab1](https://github.com/Neltud/xArtists/commit/8812ab1b3993314fd2a0033d6cd8b3e026c87c1f))
* **onchain:** map xAiAx/xAiAy/xAiAs collections to Pulse/Yield/Sentinel packs ([bc12037](https://github.com/Neltud/xArtists/commit/bc12037b68e575bfce82bfef1ed112a90bcd1457))
* **sc:** agents-marketplace buyPack — mint ESDT NFT to buyer on EGLD payment ([5ffce3d](https://github.com/Neltud/xArtists/commit/5ffce3d9ca8c22940944af2d4a902d4dc94e2f1d))
* **sc:** buyPack endpoint — esdt_nft_create + transfer NFT to buyer ([1d9e2b3](https://github.com/Neltud/xArtists/commit/1d9e2b33734b90bed58a20c04634c4bed5666fe7))


### Bug Fixes

* **ci:** mxpy upgrade uses --nonce (not --recall-nonce) for agents-marketplace ([23c64e2](https://github.com/Neltud/xArtists/commit/23c64e2c09a146774f2dfc82245d57e6ee70cfa3))

> **Note:** Full historical CHANGELOG (≤0.107.x) is preserved in git at commit `1584669` / blob `04579e23`. To restore the long form: `git show 1584669:CHANGELOG.md`. The v0.109.0 section above is authoritative for this release.
