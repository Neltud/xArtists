# xArtists — LIA v5 (Clean Main) - Updated & Maintained

**MultiversX × Bitcoin Layer 2 × AI Agent**

**Our GitHub: Neltud/xArtists** | Live Demo: https://neltud.github.io/xArtists

## Évolution du projet
- **Base de départ** : alexbolog/xArtists (smart contracts) + alexbolog/xArtists-dapp (frontend monorepo client/server/shared, Vite/TS/Tailwind/Drizzle, ~fév 2025). Repo SC alexbolog 404 aujourd'hui.
- **Version actuelle (Neltud)** : Renommée, améliorée et étendue en monorepo Rust (63%) + TypeScript/React/Vite frontend + Python tools. Focus : Art/NFT + Staking + DAO + Bitcoin L2 bridge + AI Agent (LIA v5). Nettoyé juin 2026.

## Stack Technologique (Veille 2026)
- **Blockchain** : MultiversX (sharding, SPoS, bas frais, scalable). Intégration via Rust contracts (workspace: packages/contracts) + outils (faucet, tip).
- **Frontend** : Vite + React 18 + TypeScript + react-router-dom + Supabase (backend-as-service). Wallet connect (xPortal, extension, web).
- **AI Agent** : LIA v5 (décisions WAIT, cycles).
- **Bitcoin L2** : Bridge mock, Lightning, X402/L402.
- **DeFi** : Hatom positions, LP Pools TRO (TRO-94c925), gouvernance/voting.
- **Data** : Prix réels EGLD/TRO/WBTC/etc., Fear & Greed, collections NFTs (11 mainnet).
- **Deployment** : GitHub Pages (/docs), CI/CD GitHub Actions (build, lint, test, cargo check).

## Ce qui fonctionne (Juin 2026)
- Dashboard avec prix réels (EGLD, TRO).
- Pages : Bitcoin L2 features, Hatom, LP TRO, Tip/Pourboires, routing complet.
- Wallet Connect (xPortal, Web Wallet, extension).
- AI Agent LIA v5 (mock cycles).
- GitHub Pages live : https://neltud.github.io/xArtists

## Architecture Monorepo
- `packages/contracts/` : Smart contracts Rust (NFT, staking, governance, liquidity).
- `apps/frontend/` ou root Vite : Frontend React/TS (dashboard, wallet, pages).
- `tools/` : faucet, tip (Node/Python).
- `data/` : Datasets statiques.
- `src/` : Core entrypoints.
- Workflows : `.github/workflows/` (ci-cd.yml, deploy-frontend, rust.yml, static.yml).

## Instructions pour développer & déployer
```bash
# Frontend (Vite/React)
cd apps/frontend || npm run dev  # ou root
npm install
npm run dev

# Build & Deploy (manuel ou via CI)
cd apps/frontend
npm run build
cd ..
git add .
git commit -m "deploy: frontend update"
git push origin main
# GitHub Pages déploie automatiquement depuis main vers /docs

# Rust Contracts
cargo build --release -p contracts  # ou workspace
cargo test

# Outils
cd tools/faucet || npm ci
```

## Améliorations prioritaires (Code corrigé & Roadmap)
1. **Intégration SDK MultiversX complète** : Ajouter @multiversx/sdk-dapp, mx-sdk-dapp-ui pour queries réelles (remplacer placeholders $— et 0 par données live). Fix data fetching (collections, positions, pools).
2. **Frontend complet** : Assurer cohérence apps/frontend vs root. Ajouter hooks wallet, queries ABI contracts.
3. **CI/CD robuste** : Vérifier workflows (cache, type-check, lint manquants dans root package.json ?). Ajouter dependabot, secret scan.
4. **Contrats Rust** : Tests exhaustifs, déploiement mainnet/testnet docs, audit sécurité.
5. **Live Demo** : Rendre data dynamique (API Supabase ou on-chain). Gérer erreurs gracefully.
6. **Docs** : ABI contracts, architecture diagrams, contribution guide.
7. **Veille** : Migrer vers mx-sdk-dapp v5+ (modulaire, Passkeys), Vite 6+, React 19 si stable. Intégrer AI agents avancés.

## Statut Live Demo
- Connect Wallet disponible.
- Beaucoup de placeholders (données on-chain à connecter).
- Contrats staking/governance marqués inactifs (déployer ou mettre à jour adresses).
- AI Agent en mode WAIT (premier cycle attendu).

**Projet prêt pour itération suivante : Intégration on-chain full + features artistes/NFT mint/staking avancées.**

Maintenu par Neltud | Base initiale alexbolog respectée et évoluée.
