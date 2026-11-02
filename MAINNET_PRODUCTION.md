# xArtists — Mainnet deployment vs financial authorisation

**Status reviewed: 2026-11-02.** This page supersedes the general LIVE claims written in the historical June 7, 2026 deployment note. The word "mainnet" identifies the blockchain environment; it is **not** a blanket authorisation to trade, accept customer funds, mint or deliver SFTs.

| Capability | Verified state | Launch decision |
| --- | --- | --- |
| Public website | GitHub Pages deployment succeeded for V3; home, museum, LIA and agent pages rendered in Chromium | **Public discovery GO** |
| Wallet-free visitor flow | Supported in UI; 2D LIA and optional 3D experience | **GO, public/read-only** |
| Smart contracts on MultiversX | Some contracts/collections are deployed on mainnet; exact ownership, price and pause gates require per-contract proof | **No automatic commercial GO** |
| LIA analytical dashboard | Paper/shadow; service health returned `lia_live_trading: "0"` | **Paper-only GO** |
| Autonomous LIA Ops trading | Freeze breach after earlier no-sign mandate; independent operational gates unresolved | **NO-GO** |
| PayBox real sales | API health returned `paybox_configured: true`, `paybox_mode: "prod"`, Postgres backend; production configuration ≠ validated payment | **NO-GO without operator evidence** |
| NFT issuance / delivery after checkout | API health returned `mint_dispatch_enabled: false`, `mint_live_enabled: false`, `mint_dry_run: true` | **NO-GO** |
| Refund and reconciliation | Signed payment+IPN+delivery+refund production chain not attested in reviewed evidence | **NO-GO** |

## Production endpoints

- [Public dApp](https://neltud.github.io/xArtists/)
- [Official public GitBook](https://xartists.gitbook.io/xartists/)
- [Access API health (read-only)](https://xartists-access-api.onrender.com/health)
- [GitHub CI and releases](https://github.com/Neltud/xArtists/actions)

**Health check is read-only evidence, not proof of successful paid order processing.**

## Release requirements

1. Identify the exact frontend commit/build/deployment and verify rendered mobile and desktop routes including direct product links.
2. Verify pricing from the authoritative server/contract, buyer identity, accepted chain, destination, signed quotes, expiry and idempotence.
3. Perform one operator-authorised real Sentinel test only in a controlled procedure, with payment amount, order ID, RSA-verified IPN and post-payment entitlement linked to the same buyer.
4. Prove on-chain delivery, replay safety, refund/revocation semantics, reconciliation and a working kill-switch.
5. Separately clear risk Guardian, caps, isolated wallet credentials, exchange/watch warnings and no-sign freeze before any autonomous LIA Ops operation.

No CI test or promotional launch grants these permissions. **Never change `LIA_LIVE_TRADING`, PayBox flags, mint dispatch or private wallet credentials as part of a site/marketing release.**

Reference: [launch audit](docs/LAUNCH_AUDIT_2026-11-02.md), [security gates](docs/security/launch-gates.md), [commercial model](docs/COMMERCIAL_MODEL.md).
