# XA World Rights — commercial distribution gate (2026-11-08)

**Status: NO-GO for paid plugin distribution.** A public rights-dossier workbench
is a noncommercial preview, NOT a freely distributable paid plugin. There is no
live purchase, account entitlement, licence token, owner-wallet exemption or
download API in this PR. Never hide a public ZIP behind a frontend-only button.

## Licence and rights-chain facts

1. Older published revisions were distributed with an MIT licence; their legitimate
   recipients retain those terms. Removing a ZIP or replacing a licence file
   cannot revoke historical grants or remove copies from Git history.
2. The repository root is also MIT: **a code-by-code and contribution review is
   required** before any claim that the newly scoped package licence overrides
   the original MIT grants. Third-party component licences remain unaffected.
3. A public static frontend has downloadable JavaScript by design. Proprietary
   commercial execution must live in a protected backend or an authorized
   downloadable package, not in public GitHub Pages assets.
4. The name "N. TUDURI" is the artist's declared name; the operator must verify
   legal copyright ownership, contributors and trademark before relying on this
   notice as a signed commercial licensing agreement. This Git change is NOT
   copyright registration.

## Required paid licence service (not implemented)

- Serve paid plugin archives only from a private artifact store behind an
  authenticated HTTPS API; never from `apps/frontend/public/` or public
  `packages/` source distributions.
- Use a fresh SIWX/xPortal challenge with anti-replay nonce, bounded TTL and
  Ed25519 signature verification bound to the canonical MultiversX address.
  **Never** authorize based on a pasted `erd1...` string or browser flag.
- Evaluate the verified signer against an independently configured admin
  allowlist (owner exemption) and an immutable paid-entitlement ledger with
  payment-processor webhook verification and revocation; fail closed if unknown.
- Mint no licence NFT or copyrighted content by default; legal licence contract
  and wallet/software entitlement are different concepts.
- Apply least-privilege platform OAuth scopes, server-only OAuth client secrets,
  per-account disconnect/revoke, tenant isolation, rate limits and auditable
  export/download receipts. Social account access alone proves no content rights.
- Generate short-lived signed download URLs only AFTER the server authorizes
  a specific package and licence version. Guard replay, cache leakage, filename
  traversal and CDN public readback. Audit all ZIP entries before distribution.
- Test unsigned wallet, wrong wallet, expired challenge, self-declared
  entitlement, reused nonce, revoked grant, stolen receipt and server restart.
- Publish pricing, refunds and terms only after the payment, entitlement and
  delivery path have independently verified end-to-end evidence.

## Current review acceptance

- No unauthenticated ZIP exposed in the Pages build.
- Public UI explicitly shows preview-only / no payments.
- No override of historical MIT grants is claimed.
- Dedicated server-side entitlement, owner exception and paid delivery remain
  off. Do not close #416 until real tests and operator approval exist.
