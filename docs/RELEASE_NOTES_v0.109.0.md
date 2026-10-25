---
hidden: true
noIndex: true
---

# 🚀 Release Notes — v0.109.0 (2026-10-15)

### 🎨 Marketplace RWA & Frameit Indexing

* **Frameit Market Panel:** Integration du composant `FrameitMarketPanel.tsx` en tête de `/marketplace`.
* **Marketplace Secondaire:** Tracking du Floor Price, du volume et liens directs vers Frameit / Xoxno pour les collections `XAIPLS-2cf72b`, `XAIYLD-987e24` et `XAISNT-3d8a6b`.
* **RWA Provenance:** Schema de métadonnées pour oeuvres physiques (`rwaMetadata.ts`), ancrage NFC Chip ID et certificats On-Chain.

### 🛡️ Sécurité On-Chain & Zero-Trust (P0/P1)

* **Mainnet Tickers Alignement:** Correction des Tickers par défaut (`packNftMetadata.ts`) sur les collections officielles live.
* **Access Control:** Suppression de la dépendance au `localStorage` (`markPackOwned`) pour l'octroi des droits d'accès. Seule la possession d'ESDT/SFT On-Chain fait foi.
* **Paper Mint Isolation:** Restriction stricte de `mintPaper` à l'environnement `DEV`.

### 🏛️ Économie Smart Contract (Mainnet Live)

* **Nouveaux tarifs SC:** Mises à jour des prix On-Chain via `setPackPrice` (Pulse: 10 EGLD, Yield: 5 EGLD, Sentinel: 2.5 EGLD) destinés à l'alimentation du wallet de trading LLM Vellum de LIA.

### 🏛️ Museum WebGL 3D (Perf & 60 FPS)

* Frustum culling, interruption du rendu en arrière-plan (`webglPaused`), gestion dynamique de perte de contexte WebGL et fallback 2D.

### 🤖 Pipeline RAG Multi-IA (ATC -> TCA)

* Ingestion RAG automatisée via GitHub Actions (`rag-ingestion.yml`) et synchronisation de la mémoire partagée dans `ACTIVE_CONTEXT.md`.

***

**Repo:** https://github.com/Neltud/xArtists\
**Tag:** `v0.109.0`\
**Compare:** https://github.com/Neltud/xArtists/compare/v0.108.2...v0.109.0
