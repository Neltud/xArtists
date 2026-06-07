# xArtists - DApp

This repository contains the xArtists frontend dApp (MultiversX) — NFT staking, TRO dashboard, marketplace, and DAO integrations.

Live site (GitHub Pages): https://neltud.github.io/xArtists/  
(Deployment triggered on each push to main via GitHub Actions)

Quick status
- MultiversX SDK integrated (xPortal / web wallet support)
- On-chain price & APY via pool reserves implemented (src/services/onchain.ts)
- Fallback price via CoinGecko kept for cases where no pool address is configured
- Wallet & staking hooks wired; UI pages updated for TRO dashboard and staking flows

How to run locally
1. Install dependencies: npm install (or pnpm / yarn)
2. Dev server: npm run dev
3. Build: npm run build
4. Preview production build: npm run preview

Environment variables (recommended)
- VITE_NETWORK=mainnet
- VITE_API_URL (optional)
- VITE_TRO_POOL_ADDRESS (address of the on-chain pool to use for price/TVL/APY)
- VITE_TRO_TOKEN_ADDRESS (TRO token contract address)
- VITE_NFT_STAKING_ADDRESS (NFT staking contract address)
- VITE_PRICE_POLL_INTERVAL (ms) — default 60000

Notes & next steps
- If you want APY/price shown immediately, set VITE_TRO_POOL_ADDRESS to the pool pair address (TRO/USDC or TRO/EGLD).
- CI will run tests and deploy to GitHub Pages on push to main. Monitor Actions: https://github.com/Neltud/xArtists/actions

If you want me to perform further cleanup (permanent deletion of files or refactor), confirm and I will proceed with deletions/PRs as requested.