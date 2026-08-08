# xArtists — AI + RWA + NFT sur MultiversX

## Mise à Jour 8 août 2026
**Code pleinement corrigé (v0.15.0+) + Roadmap V1 active.**  
- Analyse dApp + Veille techno : [`docs/ANALYSE_DAPP_COMPLETE.md`](docs/ANALYSE_DAPP_COMPLETE.md)  
- **Roadmap 7 priorités** : [`docs/ROADMAP_V1.md`](docs/ROADMAP_V1.md)  
- PWA (manifest + SW) · OpenAPI · Docker · AgentsMarketplace · E2E Playwright smoke · Stripe onramp · Escrow logic · Studio journey

**Live Demo** : https://neltud.github.io/xArtists

## Key Features
- AI Generative Art + Phygital NFTs (Warps / LIA agents)
- Staking NFT & $TRO + Liquidity
- DAO Governance (quorum 60 %)
- Marketplace Escrow RWA + Trading Terminal
- Wallet ESDT complet (Hatom, xExchange) + Tip EGLD/BTC
- Bridge BTC expérimental
- Agents GreenSmoke (6 agents prévisions) + BottomNav mobile + **PWA**
- Stripe onramp + Studio creator journey + dual-product UX

## Stack
- Smart Contracts : Rust (MultiversX)
- Frontend : React + Vite + TypeScript + Tailwind + sdk-dapp + PWA
- Agents : LIA v5/v6 autonomes + GreenSmoke + Discord bot
- Monorepo pnpm + CI/CD GitHub Actions + Docker + Playwright E2E

## Docs
- [Roadmap V1 (7 priorités)](docs/ROADMAP_V1.md)
- [Analyse DApp complète + Veille techno (8 août 2026)](docs/ANALYSE_DAPP_COMPLETE.md)
- [OpenAPI](docs/openapi.yaml)
- [Documentation technique LIA](docs/TECHNICAL_DOCUMENTATION.md)
- [Audit LIA v6](LIA_V6_OPTIMIZATION_AUDIT.md)
- [CHANGELOG](CHANGELOG.md)

```bash
# Docker (frontend)
docker compose up --build
# → http://localhost:8080/xArtists/
```

Contribuez ! 🎨

**Artiste / Creator** : Nelson Tuduri (@tudurioriginal)
