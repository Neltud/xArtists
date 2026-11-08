# xArtists plugin suite — mainnet release audit (2026-11-08)

**Status: NO-GO.** This is a review matrix, not a claim that plugins are live, audited or paid.

| Component | Current evidence inspected | Required before release |
|---|---|---|
| XA World Rights (#415/#416) | `docs/security/PLUGIN_ENTITLEMENTS_PAPER_V1.md`: ZIP MIT licence conflicts with proprietary paid-only distribution; entitlement gate OFF; owner exception denied | Resolve authorship/licence and redistribution terms; verify server-side grants, owner signature challenge and revocation; audit YouTube OAuth scopes |
| NFT Factory / Art Engine / distributors | `docs/NFT_FACTORY_DISTRIBUTORS_PAPER_TO_LIVE.md`: PAPER plans and metadata, no rendered images or verified mint | Prove rights, media generation, SHA-256, independent IPFS pins, wallet-authorized mint, distributor price/supply controls |
| Art-ID / provenance (#324) | Issue open | Human-review evidence, false-positive controls, provenance and stolen-art checks; no automated ownership verdict |
| Plugin Registry (#375) | Issue open | Signed manifests, scoped capabilities, install consent, sandboxing, version pinning, rollback and revocation |
| LIA intents (#367–#372) | Issues open | Signed bounded mandate, anti-replay, read-only defaults, adversarial tests and audit logs |
| RWA Vault / Physical Art Steward | Escrow PR #430 draft; no validated vault integration | Consent-based custody, beneficiary ledger, dual authorization, legal title evidence, dispute hold and reconciliation |
| Social Rights | No live OAuth evidence checked | Read-only first, per-platform permission review, rights/licence proof, no unverified revenue claim |

## Cross-plugin acceptance gates

1. Authentication and authorization: no trust in browser-supplied wallet, grants or payment status.
2. Plugin licences: verify ownership, third-party dependencies, paid redistribution restrictions, owner exemption through signed identity.
3. Security: scoped secrets, least privilege, idempotency, webhook signature, immutable audit, fail-closed defaults.
4. UX: disclose paper/sandbox/live per operation, accessible mobile navigation and explicit user consent.
5. Financial/on-chain: no automatic fiat-to-mint, no autonomous real transfers or spending; wallet transaction-specific consent.
6. Release: reproducible builds, test results, SBOM/dependency audit, CI, deployed SHA, rollback and independent review.

**Do not close #416 or #375 or merge #415 based on this document.** Proof of rights and runtime enforcement is still missing.
