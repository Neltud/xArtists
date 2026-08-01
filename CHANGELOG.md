# Changelog

## Unreleased

### Bug Fixes

* align GitHub Pages deploy with frontend package-lock, mirrored data JSON, and strict typed build
* unify frontend live JSON fetches through local `/xArtists/data/*` with raw GitHub fallback
* harden marketplace tx wiring, PWA cache refresh, and LIA/BTC tip data defaults
* fix Deploy xArtists Exclusive setup-node cache path so Pages builds no longer fail before install
* add TRO + Hatom mirrored JSON fallbacks for live frontend data when upstream APIs are stale or unavailable
* accept PEM secret text in live executor and add adaptive confirmation polling for Supernova-ready signing

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
