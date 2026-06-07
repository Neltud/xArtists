# xArtists — LIA v5 (Clean Main) - Updated & Maintained

**MultiversX × Bitcoin Layer 2 × AI Agent**

**Our GitHub: Neltud/xArtists** | Live Demo: https://neltud.github.io/xArtists

## Évolution du projet
- **Base de départ** : alexbolog/xArtists (smart contracts) + alexbolog/xArtists-dapp (frontend monorepo client/server/shared, Vite/TS/Tailwind/Drizzle, ~fév 2025). Repo SC alexbolog 404 aujourd'hui.
- **Version actuelle (Neltud)** : Renommée, améliorée et étendue en monorepo Rust (63%) + TypeScript/React/Vite frontend + Python tools. Focus : Art/NFT + Staking + DAO + Bitcoin L2 bridge + AI Agent (LIA v5). Nettoyé juin 2026.

## Stack Technologique (Veille 2026)
- **Blockchain** : MultiversX (sharding, SPoS, bas frais, scalable). Intégration via Rust contracts (workspace: packages/contracts + contracts/ dir: btc-bridge, nft-staking, tro-staking) + outils (faucet, tip).
- **Frontend** : Vite + React 18 + TypeScript + react-router-dom + Supabase. **MVX SDK v3+ intégré** (DappProvider, wallet connect xPortal/Extension/Web).
- **AI Agent** : LIA v5 (décisions WAIT, cycles).
- **Bitcoin L2** : Bridge mock, Lightning, X402/L402.
- **DeFi** : Hatom positions, LP Pools TRO (TRO-94c925), gouvernance/voting.
- **Data** : Prix réels via CoinGecko (EGLD/TRO/WBTC/etc.), Fear & Greed, collections NFTs.
- **Deployment** : GitHub Pages (/docs), CI/CD GitHub Actions + Dependabot.

## Ce qui fonctionne (Juin 2026)
- Dashboard avec prix réels (EGLD, TRO via CoinGecko).
- Pages : Bitcoin L2 features, Hatom, LP TRO, Tip/Pourboires, routing complet.
- Wallet Connect (via SDK : xPortal, Extension, Web Wallet).
- AI Agent LIA v5 (mock cycles).
- GitHub Pages live : https://neltud.github.io/xArtists
- **Nouveau** : useMvxAccount hook + example contract queries dans src/services/mvx.ts. TRODashboard affiche balance EGLD réelle quand connecté.

## Architecture Monorepo
- `contracts/` : Rust SC (btc-bridge, nft-staking, tro-staking).
- `packages/` : core, discord-bot (et workspace contracts si présent).
- `src/` : Frontend React/Vite (App.tsx avec 12+ modules/démos : Minter, NFTStaking, DAOGovernance, TRODashboard, etc.).
- `src/services/` : price.ts (CoinGecko), mvx.ts (SDK hooks).
- Workflows : `.github/workflows/` + Dependabot.yml.

## Instructions pour développer & déployer
```bash
# Frontend (Vite/React)
npm install
npm run dev

# Build & Deploy (manuel ou via CI)
npm run build
git add .
git commit -m "deploy: frontend update + MVX SDK"
git push origin main
# GitHub Pages déploie automatiquement

# Rust Contracts (ex. tro-staking)
cd contracts/tro-staking
cargo build --release
# Déployer sur testnet/mainnet avec mxpy ou outil MVX

# Outils
cd tools/faucet || npm ci
```

## Roadmap prioritaire - Progrès
1. **Implémenter queries SDK MVX dans frontend** ✅ **Fait (base)** : DappProvider + useMvxAccount + queryContract skeleton dans src/services/mvx.ts. TRODashboard utilise balance réelle. Remplacer tous les $— / 0 par données live en implémentant les queries avec adresses déployées des contrats.
2. **Déployer/mettre à jour contrats staking/governance** : Contrats Rust prêts (tro-staking, nft-staking, btc-bridge). Déployer sur testnet/mainnet, récupérer adresses + ABI, mettre à jour dans mvx.ts et UI. Adresses exemple à ajouter dans .env ou config.
3. **Rendre AI Agent LIA v5 plus interactif** : Base existante (mock). Prochaine itération : lier à cycles réels ou oracles on-chain.
4. **Ajouter mint NFT artistes, marketplace basique, analytics** : Démos existants (MinterDemo, MarketplaceEscrowDemo, DAOGovernanceDemo, NFTStakingDemo). Améliorer avec SDK pour mint réel et analytics on-chain.
5. **Tests + audit sécurité + Dependabot** ✅ **Fait** : Dependabot.yml ajouté (npm, cargo, github-actions). Ajouter tests unitaires dans CI et audits (cargo audit, npm audit).
6. **Migrer vers mx-sdk-dapp v5+** : Actuel v3+ fonctionnel. v5+ (modulaire, Passkeys, UI components) à adopter quand stable pour meilleure UX.

## Améliorations prioritaires suivantes
- Implémenter queryContract avec vraies adresses des contrats/tro-staking et nft-staking.
- Ajouter bouton Connect Wallet visible + gestion d'erreurs.
- Rendre tous les dashboards dynamiques (staked amounts, governance votes, NFT counts).
- Déploiement contrats + mise à jour adresses UI.
- Tests complets et audit.

## Statut Live Demo
- Connect Wallet disponible via SDK.
- Prix réels (CoinGecko).
- Balance EGLD réelle quand wallet connecté.
- Placeholders restants pour données on-chain staking/governance (en attente déploiement contrats + queries).
- AI Agent en mode WAIT (premier cycle attendu).

**Projet prêt pour itération suivante : Full on-chain integration + features artistes/NFT mint/staking avancées.**

Maintenu par Neltud | Base initiale alexbolog respectée et évoluée. Corrections poussées régulièrement.
