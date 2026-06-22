# xArtists — Plateforme NFT, RWA & IA Agents sur MultiversX

**Version Unifiée Complète Optimisée v1.0.3** (22 juin 2026)

Frontend provenant de Vellum pushé et intégré, tous contrats Rust, LIA nodes, ready pour daily CI updates.

[![Deploy](https://github.com/Neltud/xArtists/actions/workflows/pages.yml/badge.svg)](https://github.com/Neltud/xArtists/actions)

**Live Demo**: [https://neltud.github.io/xArtists](https://neltud.github.io/xArtists)

## ✨ Features
- Minting NFT/RWA Phygital avec Escrow
- Staking Hybride NFT + TRO
- LIA v6 Autonomous Agents Dashboard
- BTC L2 Bridge
- xPortal Integration

## Structure
- `apps/frontend/` : Nouvelle version optimisée (Vellum)
- `contracts/` : Rust smart contracts
- `nodes/` : Python LIA agents
- `packages/` : Core TS

## Quick Start
```bash
git clone https://github.com/Neltud/xArtists.git
cd xArtists
pnpm install
pnpm --filter frontend dev
```

Poussé automatiquement chaque jour via GitHub Actions pour version toujours à jour.

**Contributeurs** : Neltud + Vellum AI