# Changelog

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
