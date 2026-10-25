# Changelog — xArtists

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
