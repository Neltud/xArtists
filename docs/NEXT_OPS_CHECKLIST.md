# Next ops checklist — xArtists (mainnet only)

## P0 — cash path

1. PEM + EGLD on **LIA ops** (deployer / owner SC)
2. `./scripts/deploy_mainnet.sh nft-marketplace`
3. `./scripts/deploy_mainnet.sh agents-marketplace` · `FEE_BPS=300`
4. `python scripts/verify_marketplace_codehash.py` → codeHash ≠ null
5. `python scripts/post_deploy_contracts.py --marketplace erd1… --agents erd1…`
6. Set `VITE_MARKETPLACE_*` + `VITE_AGENTS_*` + `VITE_*_CODEHASH_OK=1`
7. Rebuild GitHub Pages
8. Micro List/Buy with **user** wallet (extension) — never LIA ops session
9. Keep `LIA_LIVE_TRADING=0` until micro-trades proven

## P1

- Create **Mission** + **Reserve** wallets → `data/contracts.json` + TREASURY_POLICY
- `listings_index.json` after first listings
- Pinata proxy (JWT server-side only)
- Stripe webhook HTTPS for Model C mint

## Never

- Paste LIA ops as Connect user
- Claim market live without codeHash
- Vote TX UI without sdk-dapp + SC
- Soul / bridge user funds pre-mainnet gates

See also: `docs/LIA_VS_USER.md`, `docs/DAPP_MODULES_MAP.md`, `docs/TREASURY_POLICY.md`.
