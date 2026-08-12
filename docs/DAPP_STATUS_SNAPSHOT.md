# dApp status snapshot — 12 août 2026

## Live UX (Pages)

| Capacité | État |
|----------|------|
| Home / Galerie / DAO lecture | OK |
| Wallet user vs Portfolio LIA | Séparé + banners |
| Connect (Web / extension / paste RO) | OK — LIA reject |
| List/Buy/Bid NFT on-chain | **Bloqué** (codeHash null) |
| Buy agents SC | **Bloqué** (null) |
| My Packs Model C | Paper + Stripe path doc |
| Trading / Board | Paper JSON |
| Soul / Burnify experimental | Isolé pre-mainnet |
| $TRO page | Cap 500k, burn feed UI |

## Sécurité TX

- `marketplaceReceiverOrThrow` — jamais placeholder vide
- `useSendTransaction` refuse LIA ops + paste + no `__xartistsSendTx`
- Offer = pas d’endpoint

## P0 ops

1. Deploy nft-marketplace + agents-marketplace
2. verify codeHash → VITE_* → Pages
3. index listings
4. Micro List/Buy **user**
5. `LIA_LIVE_TRADING=0` jusqu’à micro-preuves
