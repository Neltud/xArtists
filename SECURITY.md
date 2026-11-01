# Security Policy — xArtists / Vellum.ia

**Doctrine** : fail-closed · paper-first · no commercial GO until Sprint 0–2 complete.

## Reporting

Report security issues privately to the maintainer (@Neltud). Do not open public issues for secrets or key material.

## Key & Role Separation (Sprint 0+)

| Role | Purpose | Storage |
|------|---------|---------|
| deployer | SC deploy/upgrade | GitHub Environment `production` only (`SC_DEPLOYER_PEM`) |
| owner | On-chain ownership | Multisig + timelock (Sprint 1 target) |
| lia_ops | Paper / future micro-live | Vellum vault only — never GitHub |
| treasuries | Fund destinations | Cold / warm addresses, no PEM in CI |

Any key that touched sandbox or non-prod **must be rotated** before production use.

## CI/CD Rules

- Secrets that can move funds or upgrade contracts live **only** in GitHub Environment `production`.
- Jobs reading `SC_DEPLOYER_PEM` require the `production` environment (required reviewers).
- Mainnet actions require explicit `confirm_mainnet=DEPLOY_MAINNET`.
- PEM is written to runner temp with umask 077 and deleted in `if: always()`.
- No `pull_request_target` on secret-bearing jobs.
- `VITE_LIA_LIVE_TRADING` defaults to `0`. Paper mode is the only allowed default.

## Branch Protection (required)

- `main` protected: PR reviews, status checks, no force push, no deletion.
- CODEOWNERS enforced on critical paths.

## Slot / Gambling Surface

The Primordial Slot is documented as closed (`isPayable=false`). It must remain non-payable and absent from the public site as a playable feature.

## Live Trading

LIA live trading remains **off** until explicit gate validation (go_live_gates + micro-proofs + Guardian ARMED + legal review).
