# xArtists — AI + RWA + NFT sur MultiversX

## Mise à Jour 1er août 2026
**Code pleinement corrigé (v0.14.0+) + Roadmap V1 active.**  
- Analyse dApp + Veille techno : [`docs/ANALYSE_DAPP_COMPLETE.md`](docs/ANALYSE_DAPP_COMPLETE.md)  
- **Roadmap 7 priorités** : [`docs/ROADMAP_V1.md`](docs/ROADMAP_V1.md)  
- PWA (manifest + SW) · OpenAPI · Docker · AgentsMarketplace · E2E Playwright smoke

**Live Demo** : https://neltud.github.io/xArtists

## Key Features
- AI Generative Art + Phygital NFTs (Warps / LIA agents)
- Staking NFT & $TRO + Liquidity
- DAO Governance (quorum 60 %)
- Marketplace Escrow RWA + Trading Terminal
- Wallet ESDT complet (Hatom, xExchange) + Tip EGLD/BTC
- Bridge BTC expérimental
- Agents GreenSmoke (6 agents prévisions) + BottomNav mobile + **PWA**

## Stack
- Smart Contracts : Rust (MultiversX)
- Frontend : React + Vite + TypeScript + Tailwind + sdk-dapp + PWA
- Agents : LIA v5/v6 autonomes + GreenSmoke + Discord bot
- Monorepo pnpm + CI/CD GitHub Actions + Docker + Playwright E2E

## Docs
- [Roadmap V1 (7 priorités)](docs/ROADMAP_V1.md)
- [Analyse DApp complète + Veille techno (1er août 2026)](docs/ANALYSE_DAPP_COMPLETE.md)
- [OpenAPI](docs/openapi.yaml)
- [Documentation technique LIA](docs/TECHNICAL_DOCUMENTATION.md)
- [Résumé Vellum live](docs/VELLUM_RESUME_LIVE.md)
- [Audit LIA v6](LIA_V6_OPTIMIZATION_AUDIT.md)
- [CHANGELOG](CHANGELOG.md)

## Flux live LIA / Vellum
- `OrchestratorRouter → lia.vellum.live_cycle.run_cycle`
- `→ lia.circuit.vellum_cycle.run_cycle` (optionnel)
- `→ lia.vellum.publish_data_for_frontend.publish()`
- `→ git push data/* + docs/data/* + apps/frontend/public/data/*`

**PEM uniquement dans Vellum / secrets runtime, jamais en git ni dans le frontend.**

```bash
# Docker (frontend)
docker compose up --build
# → http://localhost:8080/xArtists/
```

Contribuez ! 🎨

**Artiste / Creator** : Nelson Tuduri (@tudurioriginal)
