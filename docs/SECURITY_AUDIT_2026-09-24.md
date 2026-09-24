# Security audit — xArtists · 2026-09-24

Scope: repo `Neltud/xArtists` (frontend Pages + workflows + docs). Not a pentest of live SC (SC OFF).

## Verdict
**Acceptable for DEMO / paper.** Not production-custody ready. No PEM/mnemonic found in git. SC flags OFF. Wallet signing stays with the user.

## Strengths
- `.gitignore` blocks `.env*`, `*.pem`, `*.key`, `*seed*`
- Deploy SC workflow uses GitHub Secret `LIA_WALLET_PEM` (not committed)
- `canListBuyNft()` / `canBuyAgent()` gate TX until codeHash OK
- Known empty marketplace address is denylisted
- DEMO_MODE + paper checkout (localStorage, no auto-sign)
- Dual-brain: IA propose, humain signe
- Separate LIA vs GrokyversX PEM (ops policy)

## Findings (priority)

### P1 — Holder room is client-side only
Paper packs live in `localStorage`. Anyone can forge `xartists_nft_pack_owned` in DevTools.
**Mitigation now:** UI badge “paper / device”, never claim on-chain privilege.
**Later:** NFT mint + server check.

### P1 — Secrets in GitHub Actions
`LIA_WALLET_PEM` can sign mainnet if workflow `chain=1` is dispatched.
**Rule:** restrict who can run `deploy-scs.yml`; default chain D/T; never log PEM.

### P2 — Public protocol wallet addresses
LIA ops address is in frontend source (tips/treasury). Expected. Do not mix with user Connect wallet.

### P2 — XSS / HTML
No `dangerouslySetInnerHTML` / `eval` hits in code search. Keep NFT titles as text nodes only.

### P2 — localStorage intents
Checkout log is device-local, forgeable, not a payment proof.

### P3 — CORS image proxies (weserv)
Third-party proxy for textures. Privacy/availability risk only.

### P3 — Pages + service worker
SW must stay network-first for JS/HTML (v8). Stale SW = old wallet UI.

## Explicit non-issues (this pass)
- No `.pem` files in tree
- No mnemonic / BEGIN PRIVATE KEY in code search
- Marketplace list/buy blocked without codeHash

## Do / Don't
- DO keep SC flags OFF until `/go-live` green
- DO keep PEMs off git, chat, Vellum logs
- DON'T treat paper holder access as authorization
- DON'T enable `chain=1` deploy without 2-person review
