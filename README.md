# xArtists · Art, AI Agents & MultiversX

**An immersive art and AI experience, open to everyone.** xArtists connects artists, collectors and visitors through a 3D museum, creative tools, NFTs and agent intelligence dashboards on MultiversX.

[**Launch the public dApp**](https://neltud.github.io/xArtists/) · [**Official GitBook**](https://xartists.gitbook.io/xartists/) · [**Browse the museum**](https://neltud.github.io/xArtists/museum) · [**AI Agents**](https://neltud.github.io/xArtists/agents)

## Discover xArtists

| Explore | Create | Intelligence | Your space |
| --- | --- | --- | --- |
| Immersive museum, collections and artwork references | Phygital Studio and collection preparation | LIA, Command Center, Genesis agent profiles | Wallet, owned artworks and access rights |

**No wallet is needed for public discovery.** The V3 mobile interface offers a lightweight 2D LIA overview, with an optional 3D immersive experience. Live signals in the public interface may be simulated or delayed; always read their labels.

## Genesis AI agent packs

| Pack | Tier | Catalogue price | Edition cap |
| --- | --- | ---: | ---: |
| **Pulse** | Gold | **€110** | 333 |
| **Yield** | Silver | **€75** | 500 |
| **Sentinel** | Platinum | **€50** | 777 |

Genesis packs are **one-time purchases**, associated with limited-edition MultiversX SFT artworks and durable access rights. They **are not subscriptions**. Cryptocurrency quotes, payments, NFT delivery and entitlements require the separately validated live path; do not infer their availability from a displayed catalogue price.

**Whop TCA Membership is separate:** recurring services while subscribed; no Genesis SFT automatically included. See [commercial model](docs/COMMERCIAL_MODEL.md), [public buying guide](docs/security/guide-public-packs-whop.md) and [current availability](https://xartists.gitbook.io/xartists/presentation/etat-du-produit).

## Release status — November 2, 2026

- **Public web app:** deployed on GitHub Pages. V3 mobile changes from [PR #262](https://github.com/Neltud/xArtists/pull/262) are merged.
- **LIA intelligence:** read-only/paper by default. **Autonomous LIA Ops trading is NOT authorised.**
- **MultiversX mainnet:** contracts and NFT references exist, but a deployment is not proof of safe commercial delivery.
- **Card payments:** PayBox production adapter is configured in the API, but end-to-end real payment → authenticated IPN → NFT entitlement → refund proof is **not confirmed**. At the last checked health response, live mint/dispatch flags were **disabled**.
- **Public financial launch:** **NO-GO until capability-specific human approval and evidence**. No claim of yield, investment performance or guaranteed gains.

For the dated evidence and remaining P0/P1 checks, see [Launch audit (2026-11-02)](docs/LAUNCH_AUDIT_2026-11-02.md). Historical operational logs and prior mainnet statements are not current launch authorisations.

## Developer quick start

The public site is a React 18 + Vite + TypeScript dApp, using Three.js, the MultiversX SDK and a separate Access API. GitHub Pages deployment is defined by [static.yml](.github/workflows/static.yml).

```bash
cd apps/frontend
npm ci --legacy-peer-deps
npm run test:release
npm run check:routes
npm run verify:site
npm run typecheck
npm run build
```

Optional APIs or credentials must be configured out of band. **Never commit private keys, wallet PEMs, JWTs, PSP merchant secrets or production session tokens.** A green CI build does not authorise new financial side effects.

## Project and documentation

- [Official public GitBook](https://xartists.gitbook.io/xartists/) — visitors, collectors, creators, mobile guide, product scope
- [Safety and launch gates](docs/security/launch-gates.md) — evidence before merchant/mainnet operations
- [Commercial model](docs/COMMERCIAL_MODEL.md) — Genesis vs Whop, pricing, delivery distinctions
- [GitHub Actions](https://github.com/Neltud/xArtists/actions) — reproducible tests and Pages deployments
- [Marketing and media pack](docs/marketing/VIDEO_LAUNCH_2026-11-02.md) — genuine browser recordings and publish-ready copy

## Security and contribution

Report reproducible issues through [GitHub Issues](https://github.com/Neltud/xArtists/issues). Checkout, mint, trading and permissions changes require isolated tests and human review. Read [launch gates](docs/security/launch-gates.md) before changing any live rail.

Created by **Nelson Tuduri / Neltud**. xArtists is an artistic and technical project, **not a guaranteed-return investment vehicle**.
