# Security audit — xArtists · 2026-09-24

Scope: repo `Neltud/xArtists` (frontend Pages + workflows + docs). Not a pentest of live SC (SC OFF).

## Verdict
**Acceptable for DEMO / paper.** Not production-custody ready. No PEM/mnemonic found in git. SC flags OFF. Wallet signing stays with the user.

## Règles ops (non négociables)
- SC flags OFF jusqu’à `/go-live` vert
- PEM hors git / chat / Vellum / logs CI
- Holder paper ≠ autorisation on-chain
- Deploy mainnet uniquement après revue + phrase `DEPLOY_MAINNET`

## Strengths
- `.gitignore` blocks `.env*`, `*.pem`, `*.key`, `*seed*`
- Deploy SC workflow uses GitHub Secret `LIA_WALLET_PEM` (not committed, never printed)
- **Mainnet gate** : `chain=1` exige `confirm_mainnet=DEPLOY_MAINNET` sinon job fail
- `canListBuyNft()` / `canBuyAgent()` gate TX until codeHash OK
- Known empty marketplace address is denylisted
- DEMO_MODE + paper checkout (localStorage, no auto-sign)
- Dual-brain: IA propose, humain signe
- Separate LIA vs GrokyversX PEM (ops policy)

## Findings (priority) + mitigations

### P1 — Holder room is client-side only
Paper packs live in `localStorage`. Anyone can forge `xartists_nft_pack_owned` in DevTools.
**Mitigation applied:** badge « paper device · UI only » + warning amber si paper-only ; jamais revendiqué comme on-chain.
**Later:** NFT mint + server check.

### P1 — Secrets in GitHub Actions / mainnet
`LIA_WALLET_PEM` peut signer mainnet si `chain=1`.
**Mitigation applied:** step **Mainnet hard gate** — sans `confirm_mainnet=DEPLOY_MAINNET` le job échoue immédiatement.
**Ops:** limiter les comptes qui peuvent lancer le workflow ; default chain D.

### P2 — Public protocol wallet addresses
LIA ops address is in frontend source (tips/treasury). Expected. Do not mix with user Connect wallet.

### P2 — XSS / HTML
No `dangerouslySetInnerHTML` / `eval` hits in code search. Keep NFT titles as text nodes only.

### P2 — localStorage intents (`/payments`)
Checkout log is device-local, forgeable, **not a payment proof**.

### P3 — CORS image proxies (weserv)
Third-party proxy for textures. Privacy/availability risk only.

### P3 — Pages + service worker
SW must stay network-first for JS/HTML. Stale SW = old wallet UI.

## Explicit non-issues (this pass)
- No `.pem` files in tree
- No mnemonic / BEGIN PRIVATE KEY in code search
- Marketplace list/buy blocked without codeHash

## Do / Don't
- DO keep SC flags OFF until `/go-live` green
- DO keep PEMs off git, chat, Vellum logs
- DON'T treat paper holder access as authorization
- DON'T run `chain=1` without dual review + `DEPLOY_MAINNET`
