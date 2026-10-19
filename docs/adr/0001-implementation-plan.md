# Implementation plan — ADR 0001 (xArtists architecture v1)

**Branch:** `feat/xartists-design-architecture-v1`  
**Rule:** No push to `main` until PR + human security review. No live financial TX from agent or CI.

---

## Phase 0 — Baseline (record before code change)

| Step | Action | Done when |
|------|--------|-----------|
| 0.1 | Note CI target = `apps/frontend` only | Documented in ADR |
| 0.2 | Confirm `VITE_LIA_LIVE_TRADING=0` in `static.yml` | Already true |
| 0.3 | Confirm Paybox fail-closed on main | Commit `6a154b57` |
| 0.4 | Run `npm install` + `npm run build` in `apps/frontend` when environment allows | Log pass/fail honestly |

Do **not** claim green build unless it actually ran.

---

## Phase 1 — Domain types (no network)

**Location (proposed):** `apps/frontend/src/domain/`

| File | Content |
|------|---------|
| `order.ts` | `OrderState`, transitions, terminal states |
| `orderDigest.ts` | Canonical fields + `hashDigest()` (pure) |
| `riskPolicy.ts` | Cap constants, pure `checkPolicy(input)` |
| `walletRole.ts` | `User` \| `LiaOps` |
| `chain.ts` | `mvx` \| `sol` discriminants |

**Tests:** Vitest pure unit tests (root or frontend — follow existing test layout). No chain calls.

**Exit:** Types compile; tests for digest stability and policy reject NaN / over-cap.

---

## Phase 2 — Application services (stubs)

**Location (proposed):** `apps/frontend/src/application/`

| Service | Behaviour v1 |
|---------|----------------|
| `createDraftOrder` | Builds DRAFT from UI intent |
| `attachQuote` | → QUOTED with expiry |
| `runPolicyCheck` | → POLICY_CHECKED or reject |
| `requestHumanApproval` | → AWAITING_HUMAN_APPROVAL (no fake approver string) |
| `markSubmitted` / `markConfirmed` / `markFailed` / `markUnknown` | Explicit transitions |

**MultiversX pack buy / stake / bid** continue via existing hooks (`useAgentPackTx`, etc.) until wrapped; wrapping is incremental and must not break mainnet paths.

**Exit:** Services typed; still no broadcast from new code paths.

---

## Phase 3 — Adapter contracts

| Adapter | Interface sketch |
|---------|------------------|
| `IChainSubmitter` | `submit(signedPayload) → { status: submitted \| unknown \| failed }` |
| `ITxVerifier` | `verify(txHash) → confirmed \| failed \| unknown` |
| `IPaymentSession` | Access-API only; amounts ignored client-side |
| `IAuditLog` | Append-only events keyed by digest (server later; client log is non-authoritative) |

Solana/Jupiter = **separate opt-in module**, not imported by default MultiversX routes.

---

## Phase 4 — UI incremental

| Item | Scope |
|------|--------|
| Loading / error / empty | Shared patterns on hub pages |
| Network badge | MultiversX explicit where balances shown |
| Risk / TX status | Surface order state when pipeline is used |
| Accessibility | Focus, reduced motion (existing soul tokens) |

**Do not** invent prices or balances. Prefer existing i18n keys.

Screenshots: attach to PR description when UI changes land (device + desktop if possible).

---

## Phase 5 — Docs & env

| File | Change |
|------|--------|
| `apps/frontend/.env.example` | Document risk-related public flags only; no secrets |
| `docs/ENVIRONMENT_VARIABLES.md` | Cross-link ADR; reaffirm `LIA_LIVE_TRADING=0` |
| `docs/adr/README.md` | Index of ADRs |

---

## Phase 6 — CI & PR

1. Ensure build / typecheck / test scripts that exist are listed in PR checklist.
2. Open **draft PR** → `main`:
   - Title: `feat: architecture v1 (ADR 0001) — domain + safety (no live trading)`
   - Body: changed files, test plan, migration (none for domain-only), **rollback** = close PR / revert branch
3. Human review of financial controls required before merge.
4. **Never** force-push `main`. **Never** set `LIA_LIVE_TRADING=1` in this PR.

---

## Rollback

- Branch-only work: delete branch or close PR.
- After merge: `git revert` of merge commit; Pages rebuild from previous main.
- No on-chain migration in this plan → no SC rollback needed.

---

## Explicit non-goals (this plan)

- Autonomous Paybox live execution
- LIA live trading
- Server-side cap enforcement implementation (design only until access-api hardening)
- Pixel-diff vs external Sites reference (login-blocked)

---

## Suggested first commits on this branch

1. ✅ ADR + this plan (`docs/adr/0001-*`)
2. Domain types + unit tests
3. Application stubs + adapter interfaces
4. Optional UI polish PR slice
5. Draft PR for review
