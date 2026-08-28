# Status — 2026-08-28 · v2.9.2-demo

| Item | State |
|------|--------|
| Pages | https://neltud.github.io/xArtists/ |
| Shell index/404 | **synced** (`index-BHdtwICv.js`) |
| Entity | `/#/entity` · 15 branches · GO_DEMO |
| Voyage | page + pack + CTA grid/checkout |
| On-ramp | MoonPay + Intent `ONRAMP` / buy |
| Pack checkout | intent local si pas de Stripe API |
| Trading | liquidity paper + board |
| SC market/agents/staking/gov/minter | **Pending** codeHash (all empty) |
| LIA live | **OFF** |
| LIA Ops EGLD | **0.069** · nonce 1437 |
| Supernova | Devnet 600 ms J+8 · nodes **J-4** (1 sept.) · activation **J-13** (10 sept.) |

## Docs

- [ANALYSE_DAPP_COMPLETE](ANALYSE_DAPP_COMPLETE.md) — recap + veille **28 août**
- [STATUS_2026-08-28](STATUS_2026-08-28.md)
- [VELLUM_P0_CHECKLIST](VELLUM_P0_CHECKLIST.md)
- [DEMO_WALKTHROUGH](DEMO_WALKTHROUGH.md)
- [SUPERNOVA_TIMEOUTS](SUPERNOVA_TIMEOUTS.md)

## P0 ops

1. Wallets Mission + Reserve + Reward + Ops  
2. Fund LIA EGLD  
3. Deploy marketplace + agents SC (`FEE_BPS=300`)  
4. `verify_*_codehash` exit 0  
5. Micro List/Buy / tip WC  
6. Ne **pas** merger Dependabot Vite 8 / ESLint 10 sans smoke  
7. Ne **pas** forcer `VITE_SUPERNOVA=1` avant le 10 sept.  
