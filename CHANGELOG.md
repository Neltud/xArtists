# Changelog

## [0.16.0](https://github.com/Neltud/xArtists/compare/v0.15.0...v0.16.0) (2026-08-08)


### Features

* **ads:** auction MVP — AdSlot, /ads page, schema, bid memo, treasury split ([d3b8ce6](https://github.com/Neltud/xArtists/commit/d3b8ce67f71ba40d310d1e7a1b29b7944b5b6b92))
* **ads:** wire AdSlot on Dashboard + /ads route ([914ce4d](https://github.com/Neltud/xArtists/commit/914ce4dee53cca62d623f9ef7e70f5bb4ac3ffad))
* **agents:** GsnLeaderboard pre-trade score panel on Agents page ([e91dc59](https://github.com/Neltud/xArtists/commit/e91dc59ad71fcf5d78e5f330e01ecf215cbf7cef))
* **bridge:** latency model, adaptive penalty, inventory pre-position, edge decay abort ([1d05578](https://github.com/Neltud/xArtists/commit/1d0557800ea39cd986a72cdd753d803e7bf8664e))
* **ci:** regression test suite + runner + GitHub Actions workflow ([b23f55d](https://github.com/Neltud/xArtists/commit/b23f55db9095699a17c4b4f046a5340093735594))
* **claude_agent:** get_allocation + pyramids external_allocator + SignalBus social cap 0.15 ([d4c56c3](https://github.com/Neltud/xArtists/commit/d4c56c3dfc8f53ecfdbe9383d5e265f16f760b7e))
* **claude_agent:** merge SignalBus+pyramids adapter (lia imports, bias map, tests) — Claude is advisor not 2nd executor ([6b0bca4](https://github.com/Neltud/xArtists/commit/6b0bca4117ccaca11b12d5e0b2f19d8087e7c715))
* DAO live TRO holders/pool from MVX API; Studio KPI steps + clearer publish path ([c7e2d72](https://github.com/Neltud/xArtists/commit/c7e2d729941df454837054fa89107a0bd45f19b3))
* **dapp:** AdSlots market/studio, agents create-prompt UX, treasury banner, ads in secondary nav ([f36ea56](https://github.com/Neltud/xArtists/commit/f36ea569cd057d6b20a3ee79bdcbcafb316cdb95))
* **dapp:** Guardian panel, status seeds, SEO sitemap, resilient data fetch, SC banners ([4128f9b](https://github.com/Neltud/xArtists/commit/4128f9b39ac724f7f1a1ebf4bffa6cafe205bfd4))
* **dapp:** post-deploy VITE pipeline, user-wallet List/Buy guard, board cadence, treasury Mission/Reserve skeleton ([3386611](https://github.com/Neltud/xArtists/commit/33866111ccd63af3a684e7ee706d6412dbea67f1))
* **dapp:** wire TreasuryBanner, CreateSubAgentForm, AdSlot on market ([8deb237](https://github.com/Neltud/xArtists/commit/8deb2373fe8d7ecb75b332f37accf07d96a2cb4a))
* decentralized price oracles + full review doc + frontend oracle hook v2.6 ([8ad7df5](https://github.com/Neltud/xArtists/commit/8ad7df55bde7ff65933be1b005a3f5e7bfd2e4a9))
* **e2e:** next_run full pipeline, data mirror, SC live gates, resilient status fetch ([f8b558b](https://github.com/Neltud/xArtists/commit/f8b558b9fdae9d9bbea2f46582370c45f89bf696))
* **frontend:** show OraclePriceBadge in Header ([2f5f92d](https://github.com/Neltud/xArtists/commit/2f5f92db4b5750f9efcccfb28a70bb50144144da))
* **front:** persona welcome (artiste/collectionneur/investisseur/curieux), landing Lovable-inspired, TRO supply max 500k, a11y skip-link — publish Pages ([f51124f](https://github.com/Neltud/xArtists/commit/f51124fd453e148d838431f1895fa30acf019592))
* gallery xArtists branding + artist bios; BottomNav DAO/Gallery mobile; market SC banner; priorities doc; force Pages-facing updates ([9b10f63](https://github.com/Neltud/xArtists/commit/9b10f63dd8f259435f82591125b4cb16d2303445))
* **gallery:** progressive load index → collections/{id}.json on expand ([7f434c6](https://github.com/Neltud/xArtists/commit/7f434c6d7bafb7ff1537169d622cfbf428447dac))
* Guardian gate in guarded_cycle + Hyperliquid lev check ([8bf417b](https://github.com/Neltud/xArtists/commit/8bf417bedea2ef5a9e91e9fb23571a65fbc3f19d))
* Guardian spiral gate + RWA escrow bridge SC scaffold (Guardian before Brain) ([6283d42](https://github.com/Neltud/xArtists/commit/6283d429dd3e29ffa78952c46178f735cdd61f2a))
* isolate LIA vs owner sub-agents; fiat onramp; agent stake escrow SC + UX journey ([7cac893](https://github.com/Neltud/xArtists/commit/7cac89366e98bf2e424329e354c13755839d0b07))
* lia/claude_agent suite + Vellum reconstruction master (LIVE_TRADING=0, SC deploy next run, allocator, trade lock) ([90094d9](https://github.com/Neltud/xArtists/commit/90094d9281c167e6d8af377c5ee39631d4387e45))
* **lia:** defense_circuit — DEFENSE mode activation, BUY block, persist state, wire orchestrator ([441cc9e](https://github.com/Neltud/xArtists/commit/441cc9e76b20c16002260878a330a221465373b3))
* **lia:** liquidity catalog Hatom/xEx/OneDex/Ash + xMEX weekly compound strategy ([bcad274](https://github.com/Neltud/xArtists/commit/bcad2744ca8171d7e54b35598325154d96a8187a))
* **lia:** optimized Hatom loop + AshSwap fees + compound pyramids (1000x1% multi-sleeve) ([12b3461](https://github.com/Neltud/xArtists/commit/12b3461cc2c15d26cad480c73b55b090440d10f2))
* **lia:** secure API keys, NFT rights, agent stake with starting funds ([2bb21eb](https://github.com/Neltud/xArtists/commit/2bb21eb8524212cf1bd8554403e401ed39c0cf64))
* **lia:** social_intel signals + multi trading modes with triggers (paper-safe) ([cf0923c](https://github.com/Neltud/xArtists/commit/cf0923c631c102d7888a6f34e8df83a9826ce297))
* **lia:** Statistical Arbitrage (pairs/z-score) for LIA brain + compounding ([#36](https://github.com/Neltud/xArtists/issues/36)) ([d87d41a](https://github.com/Neltud/xArtists/commit/d87d41a2542ccaf3d5206c6530376392e648717f))
* **lia:** sub-agent factory from user prompt + marketplace listing concept (Vellum) ([5b97f34](https://github.com/Neltud/xArtists/commit/5b97f340b389b3abf419dce7d7cbd85afb51ecec))
* **lia:** yield risk (IL/leverage/HF) + Hatom routes + Soul experimental routes ([3068098](https://github.com/Neltud/xArtists/commit/3068098f9fa5e27667a00084e302a3ccee23eb84))
* **lia:** yield strategy + compound/yield brain trained on on-chain memory ([5f5bf44](https://github.com/Neltud/xArtists/commit/5f5bf44d69dcf4e7c6d655dafe48c15275a58ca6))
* **market:** AdSlot sidebar + treasury note under P0 banner ([68aa83e](https://github.com/Neltud/xArtists/commit/68aa83ee8d6a7a323bd1140f30e154771d8c1371))
* **market:** UserWalletGuard + SC live gate on List/Buy/Bid modal ([c6906cb](https://github.com/Neltud/xArtists/commit/c6906cb6bea4afa4df97489a65acf7c423f04dc2))
* multi-chain LIA wallets BTC/SOL, packs 5-25EUR, 1 TRO reward max, Wallet≠Portfolio, GSN leaderboard score, Editions sub ([7e3eb84](https://github.com/Neltud/xArtists/commit/7e3eb8478f6c770780a9129e77a59a8f731953d2))
* **ops:** automated post-deploy verification suite + report + runbook hook ([e76d84c](https://github.com/Neltud/xArtists/commit/e76d84c5bf73a785cbba5606e6bc46a57a9e1c57))
* **oracles:** on-chain-leaning price config, multi-token feeds, publish + Vellum hook ([3de54a3](https://github.com/Neltud/xArtists/commit/3de54a398000c5c2931920f83a98e70a38fb78f8))
* Stripe onramp, escrow logic, studio journey, dual-product UX, security matrix ([5981451](https://github.com/Neltud/xArtists/commit/598145110ea33f9dcf8d316a80e7111b62ca3668))
* **trading:** secure TP stack, multi-chain lever policy, venue gates, profit lock ([76a4362](https://github.com/Neltud/xArtists/commit/76a43628d92806ca03e3a517a97aae1878656ae5))
* **trading:** slippage engine, cross-chain arb (gated), dynamic trail manager, security hooks ([093719f](https://github.com/Neltud/xArtists/commit/093719fdd480405d1e06ee181576b92c73295653))
* **ui:** InfoTip + PageGuide + help copy across dApp; document UX gaps ([56e2ef8](https://github.com/Neltud/xArtists/commit/56e2ef85093ff1c32b01226a3260b9a2db79dcf0))
* **ui:** PageGuide + tips on Portfolio (LIA vs user clarity) ([bf42b9c](https://github.com/Neltud/xArtists/commit/bf42b9cbd5995efd9f0b6a3bce46744dc3ff1c6d))
* wire Guardian+RWA into orchestrator, guarded_cycle, policy, HL executor ([7fd79a3](https://github.com/Neltud/xArtists/commit/7fd79a363d680217be34ffd67bb0f472da59eab0))


### Bug Fixes

* **circuit:** repair fuse_signals IndentationError (agent decide was broken) ([8febce5](https://github.com/Neltud/xArtists/commit/8febce5b5281006dff5dad63dce6387407322ccc))
* complete RUNBOOK_DEPLOY + runbook_deploy.sh phase orchestrator ([e73e52f](https://github.com/Neltud/xArtists/commit/e73e52fc04c57351e98178a2f820b465055ce2b1))
* **cross_chain_arb:** syntax typo in bridge_mode string ([1bb703f](https://github.com/Neltud/xArtists/commit/1bb703fed61b3d6d03be51bd5389b95d57f09038))
* **dapp:** seed docs/data for Pages 404s, DataHealth strip, ensure_pages_data in deploy ([2b04851](https://github.com/Neltud/xArtists/commit/2b048517e3fdd9f22b5283b8e9611ccc4ef637c2))
* **dapp:** seed public data (board+index), harden Pages copy, refresh status — close 404s ([ac97450](https://github.com/Neltud/xArtists/commit/ac97450ef3bfe29f1ee4104d3c4b3770f7064617))
* lacunes remedies — SEO keywords, persona modal FR coherent + useNavigate, connect modal FR, robots/sitemap, Vellum gates note ([02e992d](https://github.com/Neltud/xArtists/commit/02e992d7fd22d8e6c9e9d4171e7bddfc4dd5d003))
* **regression:** scripts package + import path for post_deploy_verify tests ([8e6919c](https://github.com/Neltud/xArtists/commit/8e6919c86a7a1afe542c6547c581a719a45a0add))
* restore Marketplace.tsx after accidental empty overwrite ([c916dea](https://github.com/Neltud/xArtists/commit/c916deabc925d5aa6c5d894e6ae94e596baa394e))
* **trading_stack:** credit ledger locked/compoundable without double-split ([e35ef49](https://github.com/Neltud/xArtists/commit/e35ef4957f1458a9a79520ecf459c7a2ec021e6a))
* TroPage show max supply 500k; persona navigate via Link-friendly paths ([e68138a](https://github.com/Neltud/xArtists/commit/e68138a458e7c92297e1d9ed734ef0c51d6784c3))
* useWalletTokens compat Hatom/LP; nav Editions; mobile UX; EXEC_SUMMARY_NEXT ([be0fabf](https://github.com/Neltud/xArtists/commit/be0fabff5ed351ad02fffa696cf22ed404423d58))
* useWalletTokens skip when no user address; Agents+GSN board; Tip BTC update ([c371bf8](https://github.com/Neltud/xArtists/commit/c371bf84b4ca95e94f49df8091656f6f5d5569c9))
* valid TS string quotes in helpCopy.ts bubble texts ([8ed43e0](https://github.com/Neltud/xArtists/commit/8ed43e0d1a53b6251244148e5398ac611662c701))
* Wallet user-only; Portfolio LIA+multi-chain; Editions route; packs 5-25EUR; Tip BTC; Agents GSN board ([701be08](https://github.com/Neltud/xArtists/commit/701be08022b1d5d53cf868248ef86bd254529c77))
* Wallet=user only, Portfolio=LIA ops+multi-chain BTC/SOL, packs EUR, GSN score UI, Editions ([253ac51](https://github.com/Neltud/xArtists/commit/253ac51e7d78245f3dd8709130d05fdd97540afb))
* zero Nelson Tuduri in gallery; BottomNav Studio+DAO+Market KPI paths; retention CTAs ([e0c0c1f](https://github.com/Neltud/xArtists/commit/e0c0c1f580453b9f48fd1a6c171b54a07bacc09e))


### Performance

* fast regression runner (single process), CI cache, tighter confirm poll ([28836d6](https://github.com/Neltud/xArtists/commit/28836d6c78a051e5213f0b6032929e619a5d0f97))
* **frontend:** portfolio N+1 kill, vite chunks, visibility pause, gallery CV, fonts ([363978d](https://github.com/Neltud/xArtists/commit/363978dde0aa36de3c42b2300e6a22b8a422308e))
* **frontend:** virtual NFT grid, lazy MxDapp TX shell, slim catalog, Lighthouse CI ([46d3ecc](https://github.com/Neltud/xArtists/commit/46d3eccd61ab58221ca3c7e18bf8ee719960ad6b))
* **gallery:** use LazyImage for NFT tiles (decode + CLS) ([f0b18c1](https://github.com/Neltud/xArtists/commit/f0b18c1b0c5bc522d6d2fe83a7b12947761d322a))
* slim xartists_collections (~72KB) + Gallery VirtualNftGrid + Lighthouse fix ([f6dcc9b](https://github.com/Neltud/xArtists/commit/f6dcc9b2784735df17f73c672b60a0efb041d4a3))
* **ui:** Header PRIMARY short + SECONDARY_NAV in mobile drawer ([3f954fb](https://github.com/Neltud/xArtists/commit/3f954fb03faec7074d1972f80356f8dd804429c3))
* vite minify+chunks, SW v3 SWR data, LazyImage, route prefetch, TxShell dynamic import ([b68c6a3](https://github.com/Neltud/xArtists/commit/b68c6a3c4a97f65e64044bb4cbf32d29d5965f43))


### Refactoring

* **lia:** unified Vellum trading pipeline + full module architecture map ([d5a312d](https://github.com/Neltud/xArtists/commit/d5a312d310b1c99053f86012a63da9a180ed2c81))


### Documentation

* comprehensive $TRO token documentation (TRO.md + factsheet) ([0064013](https://github.com/Neltud/xArtists/commit/0064013c02459c9d17c4bd3d40d8082e0a87eae9))
* confirme veille techno + analyse dApp complète — 8 août 2026 (J+2 post v1.11.10.0) ([00275c1](https://github.com/Neltud/xArtists/commit/00275c17260881c9a8e2921a707708eb40ea7265))
* DEPLOYMENT_STEPS.md — étapes mainnet complètes (build→simulate→deploy→verify→Pages) ([f8df2d4](https://github.com/Neltud/xArtists/commit/f8df2d459f821b5468732fbfa0070e120d7a311c))
* GO_LIVE_DEPLOY — PEM local only; Pages workflows triggered ([3def8b4](https://github.com/Neltud/xArtists/commit/3def8b4eebfb2645852911845b416eaa49bb5999))
* LIA split mechanisms analysis (TRO redistrib, treasury, profit lock, fees) ([e0278c5](https://github.com/Neltud/xArtists/commit/e0278c50d13b2f532b03dc4ec65efc9f788e5300))
* MICRO_PROOF checklist — gates before LIA_LIVE_TRADING=1 ([40ab36e](https://github.com/Neltud/xArtists/commit/40ab36e7e4ea246eb9bbb2d68ee264c6ed51c34e))
* mise à jour 5 août 2026 — veille techno + analyse dApp complète + code pleinement corrigé v0.15.0+ ([20b9eb8](https://github.com/Neltud/xArtists/commit/20b9eb8a03719b553d69fd8d5cf12104236164e5))
* mise à jour 6 août 2026 — code pleinement corrigé v0.15.0+, veille techno (activation mainnet v1.11.10.0 epoch 2198), analyse dApp complète ([f533bab](https://github.com/Neltud/xArtists/commit/f533baba0f8b2f6a11a34b1401d20051d568716c))
* mise à jour analyse dApp complète + veille techno 4 août 2026 — code pleinement corrigé (v0.15.0) ([04e224b](https://github.com/Neltud/xArtists/commit/04e224b1b344086cf707663dd360563ef93c9ee4))
* mise à jour analyse dApp complète + veille techno 7 août 2026 — code pleinement corrigé (v0.15.0+) ([36f2e69](https://github.com/Neltud/xArtists/commit/36f2e690cd66f77bab809f6c636a0fc940964857))
* open-source AI trading agents survey + xArtists profitability priorities ([00a9205](https://github.com/Neltud/xArtists/commit/00a920569ccc07114244f8caddef4690cb1e2bfe))
* point Sprint A / DEPLOYMENT_STEPS to optimized SC deploy pipeline ([7883a68](https://github.com/Neltud/xArtists/commit/7883a6819b571dd5633bcd94c805f5188d9e0dce))
* TREASURY_POLICY v0.2 — foundation model LIA+fees+tips, no LP fund framing ([d6c4931](https://github.com/Neltud/xArtists/commit/d6c4931de5094572c94a9439b4bb0c62d2193a4e))
* TREASURY_POLICY.md v0.1 — foundation wallets, splits, DAO, activation gates ([57a7e42](https://github.com/Neltud/xArtists/commit/57a7e4229bf4e0b0ce3d941d6e043808976065a2))
* update analyse dApp + veille techno + roadmap + README — 8 août 2026 (J+2 post v1.11.10.0) ([b061629](https://github.com/Neltud/xArtists/commit/b061629caaf3a48b0633dc413afcbe358271cda0))
* VELLUM_LIA_AUTONOMOUS_RECAP — full duty list, EGLD flows, auto-learning, gates ([86084ef](https://github.com/Neltud/xArtists/commit/86084ef100a9c72ba6ac351b34a90ed0fbd29280))
* VELLUM_RECONSTRUCTION_PROMPT_FULL — dApp + LIA strategies + social signals (repo-grounded only) ([40bbd00](https://github.com/Neltud/xArtists/commit/40bbd00dc786da40f16051efe125a3184cc06314))

## [0.15.0](https://github.com/Neltud/xArtists/compare/v0.14.0...v0.15.0) (2026-08-03)


### Features

* **agents-marketplace:** full integration — ABI aligned SC, hooks List/Buy, UI, deploy script ([900ef88](https://github.com/Neltud/xArtists/commit/900ef88087b73c55d6e3cc598dc4289200ffc6d6))
* **agents:** catalog limited packs + fee split helper for frontend transparency ([b580d5b](https://github.com/Neltud/xArtists/commit/b580d5bf4729029c59dfb6168c6e11db9569745b))
* BottomNav — onglet $TRO ([970923c](https://github.com/Neltud/xArtists/commit/970923cc14519c2436cbccd7ef7e12a248a3083b))
* **config:** tro_burn_bps + multi-currency payment tokens + escrow block flag ([224a669](https://github.com/Neltud/xArtists/commit/224a66916ff31f19efa82dbbfa0e2d75f3919b3d))
* contracts.json placeholders - replace agents_marketplace after deploy ([48bc84c](https://github.com/Neltud/xArtists/commit/48bc84ce5afb8982c7e3d0073d0fafa7cb52dcb4))
* **core:** AgentsMarketplace ABI stub (on-chain agents marketplace v0.1) ([cae7454](https://github.com/Neltud/xArtists/commit/cae7454b591e85f4f1c95d9cee685540ef799489))
* **dapp:** canonical links, nav cleanup, Midjourney Vellum service, professional model ([530e41c](https://github.com/Neltud/xArtists/commit/530e41c8babfa99f297887ef965fa559197d097d))
* **dapp:** marketplace Buy/Sell/Offer/Bid UI, portfolio 365d win-rate scenarios, remove Midjourney + GoFundMe ([bf66412](https://github.com/Neltud/xArtists/commit/bf66412bda5de5453b9400188ec871a1f1e19541))
* **dapp:** network timeouts, TX concurrency lock, xPortal/WalletConnect modal, LIA-only cycle button ([696b193](https://github.com/Neltud/xArtists/commit/696b193f32c6589abe87028ef7da570d8a291d28))
* DappProvider + xPortal deep link + Burnify route + agents registry + Vellum runbook ([6ce3436](https://github.com/Neltud/xArtists/commit/6ce34360685b8c3a129500442999365770b7d6fa))
* **dapp:** wire network timeouts + tx queue into send path; finalize LIA-only cycle gate docs ([486526e](https://github.com/Neltud/xArtists/commit/486526e6d2800b9b7d280e80158e98c05ac10ead))
* **dashboard:** LIA trades list + trailing state from data JSON ([c9e3a25](https://github.com/Neltud/xArtists/commit/c9e3a2570dd39ab03d77248bc358a7e95606deec))
* deploy script agents-marketplace + write address to data/contracts.json ([e44289c](https://github.com/Neltud/xArtists/commit/e44289cf19e60afb1add71f3d20629e6b2e912f5))
* deploy script for nft-marketplace + agents-marketplace mainnet ([603f0fd](https://github.com/Neltud/xArtists/commit/603f0fdb832b66231c43762f39af8932b9186d0e))
* Dynamic trailing stop (ATR + step-tightening + break-even + partial TP) ([bfeb3d2](https://github.com/Neltud/xArtists/commit/bfeb3d2a4689230a73e99438945ad409b4573d54))
* **frontend:** full dApp shell for Vellum run — routes, LIA ops, circuit, tech, layout ([8d45dcb](https://github.com/Neltud/xArtists/commit/8d45dcb639ffff66f470ee05c71f896b608260ad))
* **frontend:** route /burnify + nav Burnify ([e63e176](https://github.com/Neltud/xArtists/commit/e63e1761220c1ec31a363fff1d615453e97fdfe7))
* GreenSmoke top-10 template for LIA (replace with live API scores) ([044007f](https://github.com/Neltud/xArtists/commit/044007f3fbf6db289525455c7af6ad42a9a74392))
* Hatom LIA positions service — tokens + HTM, no fake $0 ([1726f7f](https://github.com/Neltud/xArtists/commit/1726f7fcb20215dea2e7388d578e3aa9c6ede7ec))
* Hatom LIA positions template (collateral + HTM, no borrow) ([eb19a13](https://github.com/Neltud/xArtists/commit/eb19a13c19b1515f9c0fac29e05a272a8b9d99ff))
* **hatom:** protocol client + publish hatom_lia.json + yield sleeve APY ([8f9ef40](https://github.com/Neltud/xArtists/commit/8f9ef4028ea6049206ee7c40bfe08e329c343c7e))
* **hatom:** wire yield signal + orchestrator publish_hatom ([032ac02](https://github.com/Neltud/xArtists/commit/032ac02fc8e7d2eb9d9bde91cd29eb1256cb5c31))
* initial empty trailing stop state for dashboard / Vellum ([5c34a50](https://github.com/Neltud/xArtists/commit/5c34a50715c4ca4c5885ab5297715b4056558c76))
* LIA $TRO creator rewards — physical 5+1×NFT cap 500, pro digital 10k; costs/revenue BM + Vellum module ([ec2bea7](https://github.com/Neltud/xArtists/commit/ec2bea713edce84d8c1cc3f6201917a6f571f1a9))
* LIA board multi-venue + 3x$10 series + HF arb scan + on-chain bid SC ([a525f26](https://github.com/Neltud/xArtists/commit/a525f265fef44f27360d7d21a3d428b450c0261b))
* LIA multichain production architecture — MVX base, agent MVX, Soul zk stubs ([8f599e3](https://github.com/Neltud/xArtists/commit/8f599e3ceb9c75b54d044ca720dbb630e54414a1))
* lia_trades.json store for Vellum trade log + dashboard ([63e1f92](https://github.com/Neltud/xArtists/commit/63e1f92490179fe70565e96090f49ea12c878dd1))
* **LIA:** circuit financier pro — boucle 1% compounding, streak, SL obligatoire, surplus yield, verify on-chain ([4ba63ad](https://github.com/Neltud/xArtists/commit/4ba63ad48194e8458c1fb3bb954210d47f2ec76b))
* **LIA:** implement circuit guards — preflight, runtime SL/BE/trail, halt, asset policy, daily limits, verify gates ([548deb5](https://github.com/Neltud/xArtists/commit/548deb5bee6860de6af5db6abd32c04fa3093898))
* **lia:** integrate tp_mode into CompoundCircuit open_trade/on_tick/persist ([b1b92a3](https://github.com/Neltud/xArtists/commit/b1b92a3a10a22ddfc80a689c4b1181f33ebd003c))
* **lia:** logarithmic/exponential/ladder take-profit curves + validation helpers ([14ecdcb](https://github.com/Neltud/xArtists/commit/14ecdcb0c4e3a949c16bed5e41fa78cecca8f81f))
* **LIA:** multi-horizon decision engine + on-chain TX memory + cadence accumulation + open-loop reinvest ([79d9981](https://github.com/Neltud/xArtists/commit/79d9981358b7bb8d48c09298d2e25a06fdc7d32b))
* **lia:** multi-venue onchain feeds, multi-DEX block arb, expanded series+risk limits, board UI ([81f560e](https://github.com/Neltud/xArtists/commit/81f560e02ada77d070625d47926dfa69d7ff3905))
* **lia:** multi-venue strategy registry MVX/Solana/HL + Soul Protocol future hooks ([88757b4](https://github.com/Neltud/xArtists/commit/88757b4020fe1c4f9d331e93ad263f173e30eb3b))
* **LIA:** strategy symbiosis orchestrator — budget cap, conflict resolution, audit tests ([266350b](https://github.com/Neltud/xArtists/commit/266350b4f62e65d847a7b6b98b249f3f60ff25e3))
* List/Buy buttons in NFT modal via useMarketplaceTx + wallet ([dddbb69](https://github.com/Neltud/xArtists/commit/dddbb694c84af96f8ba114865d22c6d9b6fe9087))
* **marketplace:** card quick actions Buy/Sell/Offer/Bid open modal tabs ([611c6f9](https://github.com/Neltud/xArtists/commit/611c6f9d6380770f260a6e41bafffd95a0b7814b))
* **marketplace:** MoonPay fiat buy button in hero ([74d5d62](https://github.com/Neltud/xArtists/commit/74d5d6204567fee16078ec2b092358423e6e9d6a))
* **marketplace:** multi-currency buy links + burn TRO / escrow notices ([6fe7217](https://github.com/Neltud/xArtists/commit/6fe72178069eff11d7194fd7a3ebb7a24c1e07ee))
* **marketplace:** wire TxStatusBanner + autoSend error path ([47287a1](https://github.com/Neltud/xArtists/commit/47287a154c3f8327fb8d2132a6e2050c6ae986d2))
* **media:** IPFS/Pinata/Arweave storage + YouTube as external link (not NFT host) ([b43d567](https://github.com/Neltud/xArtists/commit/b43d567b6a12fe3f5005fb69e817fa00b8cfaba4))
* micro-trade gas optimization — tiered limits, min notional, gas/edge gate, cost-sim helper ([03ea83b](https://github.com/Neltud/xArtists/commit/03ea83bfaedc672b0fa6fb0d71183210fb7fd18b))
* MVX gas estimates + portfolio sim with gas + Artist Studio journeys ([06e5ad7](https://github.com/Neltud/xArtists/commit/06e5ad7ea1e25b1448b4fb538dad0b6c8db0a773))
* nav $TRO dans Header ([53d4e8c](https://github.com/Neltud/xArtists/commit/53d4e8c7a270bb91c992b262e155f9b3b7add2cb))
* OneDex TRO/EGLD pool data for dashboard ([cc53fdf](https://github.com/Neltud/xArtists/commit/cc53fdf45609edf0e3b30b7819eb96296d4c710b))
* **P0:** Agents Marketplace SC skeleton - list/buy/execute agent actions ([b80e8f4](https://github.com/Neltud/xArtists/commit/b80e8f48e9c4e02dcb8cd34c3e06a0a85d5f1b57))
* **P0:** Cargo.toml for agents-marketplace contract ([d23ca57](https://github.com/Neltud/xArtists/commit/d23ca578a1118e86f47792d6d04f9a1786aef677))
* **P0:** GreenSmoke top agents placeholder for LIA consumer ([0717c74](https://github.com/Neltud/xArtists/commit/0717c7445670cd355de8524f2941a6ddb75ce5a4))
* **P0:** GreenSmokeConsumer + trailing stops for LIA brains ([b65a49c](https://github.com/Neltud/xArtists/commit/b65a49cbbf850b6d0ce3e3a001e9479fbe6b6d9e))
* **P0:** LIA UniversalExecutor paper/live + security audit + deploy runbook scripts ([3d296ff](https://github.com/Neltud/xArtists/commit/3d296ffa669c86b6c59bf16a6e83cd76261d3d98))
* **P0:** MARKETPLACE_ABI + contract addresses for list/buy via sdk-dapp ([9c0c5e1](https://github.com/Neltud/xArtists/commit/9c0c5e121835f7ccb5f5fec31c5e9c3e2cc0026d))
* **P0:** Playwright E2E CI job for marketplace + dashboard smoke ([17464cd](https://github.com/Neltud/xArtists/commit/17464cd9409224a0c24f07e845b32fd526f74e54))
* **P0:** Playwright smoke tests - dashboard + marketplace routes ([141019f](https://github.com/Neltud/xArtists/commit/141019f77bd28b65cea182c9cec1b7a50ecc77e6))
* **P0:** UniversalExecutor live PEM/wallet signing skeleton for mainnet trades ([bc0bbe6](https://github.com/Neltud/xArtists/commit/bc0bbe6e552d003ecaae5fd264ab3a379fabaf8b))
* **P0:** useMarketplaceTx - List/Buy NFT via MARKETPLACE_ABI + sendTransactions ([6e761b3](https://github.com/Neltud/xArtists/commit/6e761b34f7aeb695d9c960013f52776b6eb9dc68))
* **P0:** Vellum final prep — LIA TRO distribution policy, marketplace List/Buy wiring, agents SC deploy ready, Playwright extended, BTC bridge stabilize ([d864c23](https://github.com/Neltud/xArtists/commit/d864c23f4f47f4621ac776b575f862d1924caf21))
* page $TRO + Buy TRO + lacunes produit (burn TRO, escrow, multi-currency, LP/Hatom) ([9223887](https://github.com/Neltud/xArtists/commit/922388782a21e3a54e6fde048c6592f6c7e9e24e))
* Pinata IPFS full connect — pin file/JSON, auth test, Gmail signup guide, Vellum env ([b86d9de](https://github.com/Neltud/xArtists/commit/b86d9deef13cfb19f1402c99948be55139704625))
* playwright.config.ts - force E2E smoke on CI ([01ee296](https://github.com/Neltud/xArtists/commit/01ee2965702e65b9651cd268ea6b0ef5d13b6b69))
* publish data/ → docs/data + public/data for Pages + raw.githubusercontent ([7eab46b](https://github.com/Neltud/xArtists/commit/7eab46bdb1ce72526d2951187406c7c0806ee08d))
* **PWA:** install banner for Android/Chrome + iOS instructions ([5db2a21](https://github.com/Neltud/xArtists/commit/5db2a211f48f02dc320d6d296426a643d5a9fdf0))
* **pwa:** link manifest + register service worker in index.html ([ad6ac6b](https://github.com/Neltud/xArtists/commit/ad6ac6b0c9402757c79ae89e038f58fd2a63259e))
* **PWA:** register service worker for installable mobile app ([7353b3b](https://github.com/Neltud/xArtists/commit/7353b3b048a93bfc901f78e6d068c7e861a31fa6))
* **PWA:** register SW on app boot ([86cc442](https://github.com/Neltud/xArtists/commit/86cc442ebfa6ff2a6f12ad2aed580122431354c4))
* **PWA:** show install banner in App shell ([6efcf5d](https://github.com/Neltud/xArtists/commit/6efcf5df429688d15ebc6c22fc9d2475988a8852))
* **roadmap:** PWA + OpenAPI + Docker + agents marketplace plan + ROADMAP v1 (29 juil 2026) ([fe937af](https://github.com/Neltud/xArtists/commit/fe937af506200ad157ba6613e0f14b612d073f90))
* route /tro — page $TRO dédiée ([c761af5](https://github.com/Neltud/xArtists/commit/c761af50ed7ee8cf699f2cbe91553a955c0421ac))
* **SC:** Cargo.toml nft-marketplace ([fe0f429](https://github.com/Neltud/xArtists/commit/fe0f42970bf25f96d8f3d2427250cf44822133af))
* **SC:** multiversx.json for nft-marketplace ([6e6adcb](https://github.com/Neltud/xArtists/commit/6e6adcbad43d88c1f5240c8828053410b49bcd3b))
* **SC:** NFT marketplace with list/buy, royalties, pause, owner treasury ([ffe3bfe](https://github.com/Neltud/xArtists/commit/ffe3bfeeaa5a9232b8cd779e69051c53641ee347))
* single machine contract Vellum ↔ data JSON ↔ frontend routes ([37ebfdc](https://github.com/Neltud/xArtists/commit/37ebfdcedf74a9e0da91c1e009a3d01d9b9282fa))
* **soul:** configure zk proof circuit — config, claims, verify pipeline, env flags ([4999f7f](https://github.com/Neltud/xArtists/commit/4999f7f6056212b84f97ef86446a95f663bf4f61))
* **soul:** on-chain zk verifier SC + Halo2 scheme pipeline ([5206794](https://github.com/Neltud/xArtists/commit/5206794eef2e4e83b4d848f3d08a46a60e6a98a2))
* Sprint A/B operator — Vellum orchestrator, sprint_a script, agents catalog UX hooks, env ([57a20e8](https://github.com/Neltud/xArtists/commit/57a20e839512afdcd7efb36e00f1f8aa4ce35a34))
* **treasury:** agent sale money flows + claimFees SC + fee transparency docs ([b824b92](https://github.com/Neltud/xArtists/commit/b824b927328a32c2a4b8264ef4edaf8011a16348))
* TRO supply, OneDex pool, Hatom, fiat buy, commissions config ([c2604e5](https://github.com/Neltud/xArtists/commit/c2604e50ee3ecef373cc03301f36044204c1d551))
* **tx:** nonce polling + reservation — fetch live nonce, wait pending, multi-tx sequence ([2ccefdd](https://github.com/Neltud/xArtists/commit/2ccefdd69d00d6302b5c5d0eeff267d2698fac57))
* **tx:** transaction error handling — classify, toast UI, send with status polling ([b0b7118](https://github.com/Neltud/xArtists/commit/b0b7118941c775c2c66acee498ea112d599fbe41))
* **ui:** /studio route + nav Studio; GasCostPanel on Portfolio; drop midjourney link ([dbcb65b](https://github.com/Neltud/xArtists/commit/dbcb65b099beb49c5a63b8afb3434891cb75a397))
* **ui:** Agents marketplace packs panel with fee split (Sprint C ready) ([6682e8c](https://github.com/Neltud/xArtists/commit/6682e8c2a823289d3989b09a57a84995fdb67390))
* **ui:** LiaBoardPanel on Trading — arb limits + series ([1d14e91](https://github.com/Neltud/xArtists/commit/1d14e9196ed3e485b13c763b19e626f6c12abbe8))
* **ui:** wire AgentsMarketplacePanel on /agents ([0e79cbb](https://github.com/Neltud/xArtists/commit/0e79cbbdf758dc06c7774980b9cee5bca4db1661))
* **ui:** wire MarketplaceActivity, AgentsDeployStatus, full bid/cancel modal actions ([7aa1463](https://github.com/Neltud/xArtists/commit/7aa146313928fda60077b7e009a931ca3ea7c835))
* UniversalExecutor sign+broadcast path + micro-swap test helper ([d40ce24](https://github.com/Neltud/xArtists/commit/d40ce248e8b253aa40a153e6348ec94a68f4a7e3))
* useSendTransaction - queue txs + sdk-dapp path when available ([ab8b828](https://github.com/Neltud/xArtists/commit/ab8b828e733ab9ba08212a2f38e136c77b4f3bf5))
* Vellum node - deploy SCs using PEM secret (never commit PEM) ([1fcfbdd](https://github.com/Neltud/xArtists/commit/1fcfbdd3c538806807fe6af2a4cf45ec4f9c0f15))
* Vellum-callable nodes - trailing tick + cycle gate + trade log ([71328ae](https://github.com/Neltud/xArtists/commit/71328aed35bb83b71b8ae2f54918c57edf07fa72))
* **Vellum:** implement OrchestratorRouter node — fuse multi-brain votes via symbiosis ([8b00ccd](https://github.com/Neltud/xArtists/commit/8b00ccdc875ee42c42cf486e92daa379f79c30a2))
* **Vellum:** live cycle gate → trailing → close → append_trade → redistribute TRO ([4d39214](https://github.com/Neltud/xArtists/commit/4d392147cdd25e7817db85fc6ca6fd5c61a0c956))
* wire DynamicTrailingStopManager into GreenSmokeConsumer ([1f1604a](https://github.com/Neltud/xArtists/commit/1f1604a1a420967b9f20fbaecdb29545f98c7edd))


### Bug Fixes

* Board LIA 404 seed JSON + gallery xArtists branding + DAO in nav + resilient fetch ([091aff4](https://github.com/Neltud/xArtists/commit/091aff4c4b5f0a5d78d53fb2e941b7d829b77b85))
* **board:** clean series.py; wire placeBid FE; Offer disabled; orchestrator publishes board ([902cece](https://github.com/Neltud/xArtists/commit/902ceced4a226bf407dbf68a99bc2faae05d45a9))
* clear LIA vs user wallet distinction on Dashboard/Wallet/Portfolio labels + address-aware scan ([eda1b0c](https://github.com/Neltud/xArtists/commit/eda1b0cf7248251e8ca0f126e9d5d57ba2584c11))
* **dapp:** App footer + Soul/Hatom/Burnify links cleanup ([7a0bf1f](https://github.com/Neltud/xArtists/commit/7a0bf1f482fe2db23bdd31736806d7fd656d77ce))
* **frontend:** add missing StakingPage, SoulTestnetPage, AgentsPolyliaPage for wired routes ([22af2db](https://github.com/Neltud/xArtists/commit/22af2db6803787a1488f64c338ed6ab53ff9665d))
* **frontend:** Header wallet modal — Web Wallet real redirect, no LIA mock, extension + xPortal deep link ([dbbea9a](https://github.com/Neltud/xArtists/commit/dbbea9a32e26508d697998f9cd963d5a6d73e975))
* **frontend:** wire /staking /soul-testnet /agents/polylia routes; remove Header mock LIA wallet connect ([d92e97e](https://github.com/Neltud/xArtists/commit/d92e97ec59723a86a4fa86d23fc4137d7a3b2dc7))
* **hatom:** HF N/A clair + labels collateral (pas de faux « Sûr » si API down) ([f5620bc](https://github.com/Neltud/xArtists/commit/f5620bc672ba68630032be21d9651e0283aef3f8))
* **LIA:** momentum NameError price_spike undefined in strategies.py ([22e3ab1](https://github.com/Neltud/xArtists/commit/22e3ab10bb7bab90c3b32ba479d378e26c6abed6))
* live NFT counts (wallet 8 vs collections 275) — stale JSON had 0; Dashboard labels; xartists_onchain refresh; deep review notes + Vellum deploy prep ([d1c9f1a](https://github.com/Neltud/xArtists/commit/d1c9f1a14e2da92984bde9265ad73e257783bc1d))
* NFTDetailModal listNft/buyNft 1-arg API — restore tsc build ([13a3b00](https://github.com/Neltud/xArtists/commit/13a3b0089a0249c107ad273ff2dfce3830035cc1))
* **PWA:** bump cache version for new install banner build ([835cdab](https://github.com/Neltud/xArtists/commit/835cdab5678c987184392e845ea9b26c5a7134c6))
* remove unused [@ts-expect-error](https://github.com/ts-expect-error) in MxDappProvider (build) ([57838bd](https://github.com/Neltud/xArtists/commit/57838bdabda9ebf2a07ff9b136203b80716f722a))
* strict separation LIA Vellum agent packs vs GreenSmoke forecast feed (UI+docs) ([0f184e8](https://github.com/Neltud/xArtists/commit/0f184e850bbf286d7c111d0ab53201957410d881))
* **symbiosis:** recalibrate default budgets sum under global 85% cap ([480772d](https://github.com/Neltud/xArtists/commit/480772d2d1a19c11ae69de8f752d68455c9c579f))
* TRO supply fallback 476223 + stable MultiversX price parse ([158e5ad](https://github.com/Neltud/xArtists/commit/158e5aded99c3677bfda0205ad5d2e9ae2ab26e9))
* TxCapabilityBanner uses wallet method; wire banner on Marketplace ([76f3976](https://github.com/Neltud/xArtists/commit/76f397663b30f014ca37ee6bb448d196a8d373cc))


### Performance

* **soul:** tighten proof bounds per scheme Halo2 vs Groth16 ([31211d2](https://github.com/Neltud/xArtists/commit/31211d21ea79cf354d3ef7f1e7f158dbd1735b06))


### Documentation

* analyse dApp complète + veille techno 30 juillet 2026 — code pleinement corrigé confirmé ([3681547](https://github.com/Neltud/xArtists/commit/368154762c37a9a5f0637c4cbd30cb3e208870bb))
* audit consolidation + Supernova countdown + Copilot sprint prompt ([73f9ece](https://github.com/Neltud/xArtists/commit/73f9ece091c5b9517a16b9e5580399df62d403e4))
* Buy NFT in EUR flow (MoonPay first, then xMoney) ([0e56060](https://github.com/Neltud/xArtists/commit/0e56060ca7b7e5ea30b80090377e5180939a8996))
* CGU, disclaimer, commission structure for xArtists marketplace ([f56b8cf](https://github.com/Neltud/xArtists/commit/f56b8cfa8d507da3a2d2a3d3ea37ecf4fa591cd4))
* Commercial roadmap - supply TRO, pools, fiat, LIA fees ([8c04d31](https://github.com/Neltud/xArtists/commit/8c04d31b9f55be9b5fa37db2a572a35f53c66ae5))
* deploy SCs via Vellum PEM secret (no PEM in git) ([63e8631](https://github.com/Neltud/xArtists/commit/63e863120bc46cf7e7c839e48b2c16c192080d73))
* Dynamic trailing stop usage for Vellum + LIA ([d479d92](https://github.com/Neltud/xArtists/commit/d479d922d570786f4eaf0ab72f1539863c4b26a9))
* full audit SC endpoints+consequences, wallets, workflows, agents, dApp logic gaps ([4494785](https://github.com/Neltud/xArtists/commit/4494785bfab9c09dcad22e9f691347481b10efcc))
* full click→TX matrix, long-term coherence, LIA decision processes + risk tiers; Pinata deferred note ([f3a1440](https://github.com/Neltud/xArtists/commit/f3a1440841e685b4bbf4def8815d97e270ce9620))
* full secrets checklist GitHub + Vellum + deploy SC guide ([0aef3a8](https://github.com/Neltud/xArtists/commit/0aef3a8c22b19677e501da7dd495ea65719f7faa))
* mise à jour analyse dApp complète + veille techno 1 août 2026 — code pleinement corrigé ([f9896fe](https://github.com/Neltud/xArtists/commit/f9896febd8da4fc797f3cbb2880d98fd3ec7d52c))
* mise à jour analyse dApp complète + veille techno 2 août 2026 — code pleinement corrigé ([5f5c0e1](https://github.com/Neltud/xArtists/commit/5f5c0e14934395a5f274cd9e0dc69828fa7c8c52))
* mise à jour analyse dApp complète + veille techno 28 juillet 2026 — code pleinement corrigé ([07d05c7](https://github.com/Neltud/xArtists/commit/07d05c719f0e018643e83a9c3d789cf010ff4a11))
* mise à jour analyse dApp complète + veille techno 29 juillet 2026 — code pleinement corrigé ([199201c](https://github.com/Neltud/xArtists/commit/199201c9b466b068af54c7035ac220229e2e095d))
* mise à jour analyse dApp complète + veille techno 29 juillet 2026 — code pleinement corrigé confirmé ([9d86edb](https://github.com/Neltud/xArtists/commit/9d86edb56c39639a018b365319973e8ccadf2886))
* mise à jour analyse dApp complète + veille techno 3 août 2026 — code pleinement corrigé ([3b41f73](https://github.com/Neltud/xArtists/commit/3b41f738e03d2fc6951956afdb6299f64ad01ddb))
* P0 status - executor, marketplace, agents SC, GreenSmoke, E2E ([a85e388](https://github.com/Neltud/xArtists/commit/a85e38885e8edc46a9cadfd4a93b021bd1e5c3d9))
* priority gaps + how Vellum must wire nodes to full frontend ([9c9c1de](https://github.com/Neltud/xArtists/commit/9c9c1de8e056b834bde524c5a87a547c1d51b1d4))
* product/LIA plan status — Vellum PEM-only, P1 items shipped in repo ([9f831c3](https://github.com/Neltud/xArtists/commit/9f831c30c3ef5c39b4d3605f3bfeec45ec25aca7))
* PWA install on phone + Vellum nodes wiring ([7209ece](https://github.com/Neltud/xArtists/commit/7209ecedd2ec4a9f63bd5d13f993357360366a74))
* README — confirmation code pleinement corrigé + analyse à jour 29 juillet 2026 ([a7f266b](https://github.com/Neltud/xArtists/commit/a7f266b7e20f1f0b27d061545fefdc4c3020371c))
* README — mise à jour 31 juillet 2026 (code corrigé + analyse dApp + veille techno) ([a3d3a47](https://github.com/Neltud/xArtists/commit/a3d3a4767f450e1d3640ba1bcbcd3dadfa0a7447))
* README — Roadmap V1 + PWA/OpenAPI/Docker livrés (29 juil 2026) ([4ae7547](https://github.com/Neltud/xArtists/commit/4ae754764e944f0873b40bfcdba1deafb2305dad))
* README — statut code corrigé + analyse + veille techno 3 août 2026 ([64abb8d](https://github.com/Neltud/xArtists/commit/64abb8de5b0ff93016d97e2f1829e64b3eb37117))
* README — statut code corrigé + analyse à jour 1er août 2026 ([c7a2541](https://github.com/Neltud/xArtists/commit/c7a254190282a310f6219ceab3f732b372ff8820))
* README — statut code corrigé + analyse à jour 2 août 2026 ([fcfa1f6](https://github.com/Neltud/xArtists/commit/fcfa1f6c9cd2b81a122a3bf9ebe5b9bbd12c5099))
* README — statut code corrigé + analyse à jour 29 juillet 2026 ([97a7367](https://github.com/Neltud/xArtists/commit/97a73679d7603a9434a0ab9277ce34649a120cf7))
* README — statut code corrigé + analyse dApp + veille techno 30 juillet 2026 ([0f965f5](https://github.com/Neltud/xArtists/commit/0f965f59bf474540832a03d923a3c8888df39945))
* SC list + deploy mainnet instructions ([e137835](https://github.com/Neltud/xArtists/commit/e137835bbf463d00023ad4b82092c13ba1002f3d))
* TradingView / DexScreener chart integration for $TRO ([c7f1297](https://github.com/Neltud/xArtists/commit/c7f1297e119f47fb6012fb5f72da35b61a02a4b5))
* veille techno + analyse dApp complète — mise à jour 31 juillet 2026 (code corrigé, RWA ~$33.5–36.8B, Supernova 97.7%) ([bc46721](https://github.com/Neltud/xArtists/commit/bc4672142aab7ab3b2368e7847374098ab996067))
* veille techno + analyse dApp complète rafraîchie 31 juil 2026 — code pleinement corrigé confirmé ([214b07d](https://github.com/Neltud/xArtists/commit/214b07de0eca23fdf8a79df96cb2161b960a9ee6))
* Vellum + GitHub Actions dual deploy path ([0107069](https://github.com/Neltud/xArtists/commit/0107069f4978491f8cc4e4301e1a638406ed559e))
* Vellum resume from last publish — PEM on Vellum only, live cycle ([3d9e0a0](https://github.com/Neltud/xArtists/commit/3d9e0a09c22de54c8ee84d8c9afe3a56d0be2c7b))
* VELLUM_PRODUCTION_PROMPT — full dApp + LIA E2E live operator brief ([44160e2](https://github.com/Neltud/xArtists/commit/44160e2b5ab4b6a34a3f027afb976e69e98898b8))
* YouTube transfer limits, Pinata gateway config, mxpy issue/mint, DAPP composition map ([6dd5828](https://github.com/Neltud/xArtists/commit/6dd5828a1ea7ec8728686d7e8bb01dad47f1d6bd))

## [0.14.0](https://github.com/Neltud/xArtists/compare/v0.13.0...v0.14.0) (2026-07-27)


### Features

* Config BTC tip address + Hatom + TRO pools endpoints ([73476ed](https://github.com/Neltud/xArtists/commit/73476edc9145a4dd97e899f1901a6debd91af0e5))


### Documentation

* mise à jour analyse dApp complète + veille techno 27 juillet 2026 — code pleinement corrigé ([f791070](https://github.com/Neltud/xArtists/commit/f791070b05446a38b2043b6bbf022ff3f80531b1))
* README — statut code corrigé + analyse à jour 27 juillet 2026 ([32107d5](https://github.com/Neltud/xArtists/commit/32107d536d8da3d0c6f8472d7855c127dcccf936))

## [0.13.0](https://github.com/Neltud/xArtists/compare/v0.12.0...v0.13.0) (2026-07-26)


### Features

* Agents — 6 GreenSmoke (Liia météo, Lia crypto, Macro, Politics, Sport, Tech) + contrats GSN ([9f5f036](https://github.com/Neltud/xArtists/commit/9f5f036a24c3ef1561a4fab35d0106b83f85ea3f))
* BottomNav mobile — navigation accessible téléphone ([4741ce3](https://github.com/Neltud/xArtists/commit/4741ce34d8c26d78996a3e3411f99b2aae6b83c3))
* Dashboard — bandeau prévisions GreenSmoke + lien Agents ([b08d98f](https://github.com/Neltud/xArtists/commit/b08d98f51af3deeddf0d99004793cec0faf3b22e))
* page Agents — monitoring détaillé GreenSmoke (Liia, Lia, Macro) + prévisions ([a3489a1](https://github.com/Neltud/xArtists/commit/a3489a196030fe174fc1d619597313be251072b8))
* route /agents + BottomNav + padding mobile safe-area ([1dffc99](https://github.com/Neltud/xArtists/commit/1dffc9962f03bbb9d6009a23fc2a8fb860a293d0))


### Bug Fixes

* deploy — npm install (pas npm ci) pour build frontend fiable ([39bd356](https://github.com/Neltud/xArtists/commit/39bd35653311f6c69ec300b6b7bdcf598e408d71))
* Header mobile — menu complet + lien Agents, scroll, z-index ([18a9371](https://github.com/Neltud/xArtists/commit/18a9371f309a59e902f4d9b4e5715e9e821c3f66))
* remove local @xartists/core dep pour build CI fiable ([7c7a129](https://github.com/Neltud/xArtists/commit/7c7a129d7b3f1210abb0d852600c8d122e931bfa))
* viewport mobile safe-area + apple-mobile-web-app ([c3d9dc3](https://github.com/Neltud/xArtists/commit/c3d9dc3c6a103ae051682685dd9d42d0e2f2cc2e))


### Documentation

* mise à jour analyse dApp complète + veille techno 26 juillet 2026 — code corrigé confirmé ([b6bace2](https://github.com/Neltud/xArtists/commit/b6bace28857756e7c98e95bfe89b5f20274c9f96))
* README mis à jour — code corrigé + analyse dApp + veille techno 26 juil 2026 ([cc706f2](https://github.com/Neltud/xArtists/commit/cc706f295a5b7f572f446d51cc7adbf0a8ca5659))

## [0.12.0](https://github.com/Neltud/xArtists/compare/v0.11.0...v0.12.0) (2026-07-25)


### Features

* complete ESDT wallet scan with Hatom & xExchange positions + site reorganization ([#23](https://github.com/Neltud/xArtists/issues/23)) ([a8f797d](https://github.com/Neltud/xArtists/commit/a8f797d90240ab20d7e9572a2106b1e4981b506d))

## [0.11.0](https://github.com/Neltud/xArtists/compare/v0.10.0...v0.11.0) (2026-07-25)


### Features

* implement 7-phase xArtists stabilization and improvement plan ([#21](https://github.com/Neltud/xArtists/issues/21)) ([ab050f7](https://github.com/Neltud/xArtists/commit/ab050f7a784617348eddd8f0adb64f3ba393687e))


### Bug Fixes

* Correct TRO-94c925 price and supply parsing from MultiversX API ([3e8c712](https://github.com/Neltud/xArtists/commit/3e8c7125e0bab49f982749143342da4e00dad28f))
* Force publish dashboard - trigger exclusive deploy ([3ffc784](https://github.com/Neltud/xArtists/commit/3ffc78435f229be9793ada085c16e1e4f8234e57))
* WalletConnectButton navigates to /wallet instead of non-existent /unlock ([#22](https://github.com/Neltud/xArtists/issues/22)) ([314230a](https://github.com/Neltud/xArtists/commit/314230a8b030352afd6ed1f13f0eda995028c53e))

## [0.10.0](https://github.com/Neltud/xArtists/compare/v0.9.1...v0.10.0) (2026-07-25)


### Features

* Add AgentMonitor component ([d989a86](https://github.com/Neltud/xArtists/commit/d989a86dada9dc7544188ac58232de8618ccf213))
* Add complete Header component with navigation ([9d08c08](https://github.com/Neltud/xArtists/commit/9d08c082523f3a6f670991ccc02ce7314e43d71f))
* Add PriceCard component ([13eebde](https://github.com/Neltud/xArtists/commit/13eebde100e9663a5367dd181a67b78b88b7debb))
* Add reusable Button component ([5e38754](https://github.com/Neltud/xArtists/commit/5e38754b9720d6169229e43b8d1c5d3c4cde5d08))
* Add usePortfolioData hook ([d2fc6b7](https://github.com/Neltud/xArtists/commit/d2fc6b71ea0f80a0ea30973a1b0923f4b18e270f))
* Add useRealTimePrices hook ([0de1729](https://github.com/Neltud/xArtists/commit/0de172947d383f108d08e082752509b202bd20d5))
* App.tsx — router lazy-loaded, 8 pages, layout complet ([2b3f3e9](https://github.com/Neltud/xArtists/commit/2b3f3e9ea6e5a49ea4ca5fd271c528b07e759789))
* DAO page — voting on-chain, proposals, quorum 60% ([9e32ba7](https://github.com/Neltud/xArtists/commit/9e32ba71905dbde2c4adaa054315b93deb744875))
* Dashboard page — portfolio, prix live, agents LIA, BoN ([68260f8](https://github.com/Neltud/xArtists/commit/68260f82c60c9d7156602bdf2e8d580bff2af328))
* Fetch all ESDT tokens from LIA wallet and display them ([fd59dc5](https://github.com/Neltud/xArtists/commit/fd59dc51a2f4c39f73fe5e0658347ba2d16cfc46))
* Global CSS + Tailwind directives ([6ce3c89](https://github.com/Neltud/xArtists/commit/6ce3c894e8502feb20e65e2a9e319384264e1ce4))
* Header — navigation, wallet connect, dark/light, FR/EN ([8be809d](https://github.com/Neltud/xArtists/commit/8be809dc1dd06c95c50b3d579f9e91e9e4e2a69b))
* Improve real-time price service (EGLD, TRO-94c925, BTC) ([d3b2a8c](https://github.com/Neltud/xArtists/commit/d3b2a8ce04f52470d04c03d6587d38288ef4f166))
* Marketplace page — NFT + Arts Physiques + Escrow RWA ([3fe81a3](https://github.com/Neltud/xArtists/commit/3fe81a30b1460fa92723e88a816e29de4e5439cd))
* MultiversX data hook — prix live, wallet, LIA status ([24d800c](https://github.com/Neltud/xArtists/commit/24d800c9415d23e1cbc816bc6cda78f9aecfd4d7))
* Portfolio page — historique trades, ROI, projections ([a829635](https://github.com/Neltud/xArtists/commit/a829635d6bcf9e5b7a337b3be7811ee3adc0da22))
* React + Vite + Tailwind setup for xArtists dApp ([f018a5a](https://github.com/Neltud/xArtists/commit/f018a5a23429897a84430fbf5d96be1f347b16a3))
* React app entry + router ([e9dab27](https://github.com/Neltud/xArtists/commit/e9dab27a89ee3f34e73c4a53f40b66b7b9759ab9))
* React app entry point ([21b3c09](https://github.com/Neltud/xArtists/commit/21b3c09a7f2ea94f494d2ada988cfd36fa70eae0))
* Tailwind CSS config ([c30cd14](https://github.com/Neltud/xArtists/commit/c30cd14456f1bf52397a1dc6b33679bd922142c8))
* Tip page — QR codes BTC + EGLD, GoFundMe, services ([f7640ae](https://github.com/Neltud/xArtists/commit/f7640ae16e45d0b2007bea6de8bfac40fe59f176))
* Trading Terminal page — signaux LIA, $TRO, exécution ([068f54b](https://github.com/Neltud/xArtists/commit/068f54b0950c1e75b19a690b725931086e3c581a))
* TypeScript config for React app ([2012069](https://github.com/Neltud/xArtists/commit/201206910a7d42befa3d9d8c1865e8f196f1cf01))
* Vite config with base /xArtists/ for GitHub Pages ([58db3c6](https://github.com/Neltud/xArtists/commit/58db3c6b2ac9ae8cc045ca791ff55eecd9aec3bd))
* Wallet page — balances, Hatom, tokens ([85e026a](https://github.com/Neltud/xArtists/commit/85e026a9f2a3989cf3b140b8e4329fcd56aa5c30))

## [0.9.1](https://github.com/Neltud/xArtists/compare/v0.9.0...v0.9.1) (2026-06-26)


### Documentation

* update CHANGELOG.md with v1.5.0-vellum-production details ([b62909f](https://github.com/Neltud/xArtists/commit/b62909fcb2403ea357ffd518c1eda6bfdb863d68))

## [v1.5.0-vellum-production] - 2026-06-26

### 🎉 **Version majeure : Vellum Mainnet Full Integration**

**Fusion complète de la version Production Live Mainnet Vellum** dans le monorepo xArtists.  
Cette release rend le projet **production-ready sur MultiversX Mainnet** avec une architecture stabilisée, sécurité renforcée et flux Phygital optimisés.

### ✨ Nouvelles fonctionnalités majeures
- **Intégration Vellum Mainnet** : Fusion des contrats, configurations et workflows stables de Vellum (production live).
- **Phygital NFTs complet** : Upload photo physique → Réévaluation AI automatique (LIA v6) → Mise à jour métadonnées on-chain.
- **Warps v3 AI Agents** : Minting intelligent, analyse qualité d'œuvre, génération de métadonnées enrichies.
- **Staking & DAO xSafe** : Module staking intégré + gouvernance basique via xSafe.
- **Bitcoin Bridge support** : Préparation pour bridging assets (BTC → xArtists NFTs).
- **Frontend Vellum UI** : Refonte complète avec meilleure UX (onboarding artistes/collectors, status escrow en temps réel).

### 🔒 Sécurité & Corrections
- Ajout de guards et ownership checks sur les smart contracts Rust.
- Rate-limiting sur les appels AI (GPT-4o-mini / LIA v6).
- Secret scanning + suppression des variables d'environnement exposées.
- Validation renforcée des inputs (uploads images, minting parameters).
- Audit basique des dépendances (pnpm audit + mises à jour critiques).

### ⚡ Améliorations techniques
- **Rust Contracts** :
  - Optimisation gas pour mainnet.
  - Gestion d'erreurs améliorée et events plus complets.
  - Adresses mainnet placeholders + scripts de déploiement mis à jour.
- **Frontend (Vite + TS + Tailwind)** :
  - Mise à jour `@multiversx/sdk-dapp` vers la dernière version stable.
  - Amélioration responsive + dark mode.
  - Flux escrow phygital fluidifié.
- **Monorepo (pnpm workspaces)** :
  - Nettoyage complet des fichiers bloat (`archive/`, `dist/`, anciens builds, dossiers temporaires).
  - Mise à jour des dépendances globales.
  - Amélioration des scripts de build et CI/CD.

### 📚 Documentation & Déploiement
- README.md entièrement mis à jour avec :
  - Adresses contrats mainnet.
  - Guide de déploiement Vellum.
  - Instructions LIA v6 AI Agents.
- Nouveau fichier `DEPLOY_MAINNET.md` avec étapes détaillées.
- CHANGELOG détaillé (ce fichier).

### 🧹 Nettoyage
- Suppression des branches/fichiers obsolètes.
- Organisation claire des dossiers : `contracts/`, `apps/frontend/`, `bots/`, `scripts/`.

### 🧪 Tests & Qualité
- Tests unitaires Rust étendus.
- Amélioration des tests e2e frontend (minting + phygital flow).
- Validation manuelle du workflow mainnet.

### 🔄 Changements mineurs
- Mise à jour des versions des packages (pnpm update).
- Améliorations mineures de logging et monitoring.
- Optimisation des performances frontend (lazy loading, bundle size).

### 📌 Déploiements
- **Frontend** : https://neltud.github.io/xArtists (live avec Vellum)
- **Contrats** : À déployer sur mainnet via `mxpy` (voir DEPLOY_MAINNET.md)
- **Demo Devnet** : Toujours disponible pour tests

---

## Versions précédentes

### [v0.9.0] - 2026-06-24
[Existing content from previous changelog]

*Pour l'historique complet, voir les releases GitHub.*

---

**Auteur** : Neltud (via Grok Assistant)  
**Date** : 26 juin 2026  
**Tag** : `v1.5.0-vellum-production`
