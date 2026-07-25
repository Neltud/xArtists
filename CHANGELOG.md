# Changelog

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
