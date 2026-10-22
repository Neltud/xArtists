# GROK_SUITE — Vellum · xArtists audit 2026-10-22

Repository: https://github.com/Neltud/xArtists  
Audit branch: `docs/vellum-audit-2026-10-22`  
Main SHA at suite open: `5af60b5f4c1cdcbfeb097b9f421147ed39c60138`  
V3 release SHA (merged #180): `1f2941198d7b1a19962582fc400aa09ca08a3c4b`

**Scope:** documentation, capability matrix, simulation/tests only.  
**Forbidden in this suite:** live financial operations, activation of owner/builder/répartition proposals, seed/key exposure, automatic investment management.

Directives index: [`data/vellum_update_directives.json`](../../../data/vellum_update_directives.json)  
Source policy: [`docs/VELLUM_LIA_WALLET_DIRECTIVES.md`](../../VELLUM_LIA_WALLET_DIRECTIVES.md)

---

## 0. Pre-flight (verified 2026-10-22)

| Item | Status | Evidence |
|------|--------|----------|
| V3 on main | **OK** | PR [#180](https://github.com/Neltud/xArtists/pull/180) merged |
| Site marker `sites-v3-release` | **OK** | https://neltud.github.io/xArtists/ |
| `build-info.json` renderer | **OK** | `sites-v3`, `source_sha=1f294119…` |
| Assets JS/CSS HTTP 200 | **OK** | index / react / router / mx-sdk / wc / css |
| Git bundle attach (`xartists-v3-release.bundle`) | **SKIPPED re-import** | Prerequisites missing on shallow clone; V3 already on main — preserve |
| Transfer-kit ZIP | **Informational only** | Kit for prior transport path; not re-applied |
| Directives LIA Wallet on main | **OK** | docs + data already present |
| Real-funds ops | **BLOCKED** | Policy: human approval per order; suite stays simulation |

---

## Gate map G1–G4

| Gate | Title | Deliverable | Status |
|------|-------|-------------|--------|
| **G1** | Strategy capability matrix | `data/strategy_capability_matrix.json` + unit test | Planned (small PR) |
| **G2** | MultiversX + PayBox capability probe (read-only) | Matrix rows + blockers; no tx | Planned |
| **G3** | Order pipeline states + deterministic risk checks | Code + tests; proposals inactive | Planned |
| **G4** | Structured outputs + simulation/mock proofs | Schema + mock test results | Planned |

Each gate lands as a **small PR** with tests. No gate enables live trading.

---

## Policy locks (non-negotiable)

1. `real_funds_require_human_approval_per_order = true`
2. `scheduler_or_model_may_manage_real_investments = false`
3. `automatic_financial_test_operations_allowed = false`
4. Owner / builder / répartition proposals remain **inactive**
5. Preserve V3 frontend + static.yml path
6. User will validate intents **one by one** via LIA wallet after gates

---

## G1 brief

Audit `lia/brain/strategies.py` (13 strategies). Emit matrix with:

- id, family, paper_only flag
- signal / simulation / tx-build / execution support
- status: `SIMULATION` | `BLOCKED` | `READY_FOR_APPROVAL`
- required data, network, blockers

Default: 12 strategies remain `paper_only=True`; only `STRAT_MICRO_PROOF` is non-paper in registry (ops dust only — still not auto-enabled).

## G2 brief

Read-only checks: MultiversX network/decimals/routes for EGLD, USDC-c76f1f, TRO-94c925. PayBox: discover tools/networks without assuming MultiversX support (`UNKNOWN_UNTIL_VERIFIED`). No balances transfer, no OAuth token logging.

## G3 brief

Explicit states: PROPOSED → AWAITING_APPROVAL → APPROVED → SUBMITTED → PENDING → CONFIRMED | FAILED | EXPIRED | CANCELLED.  
Deterministic budget/risk gates (15 USD / op, 40 USD / day). Idempotency keys. Kill switch does **not** auto-liquidate. Owner/builder/répartition stay inactive flags.

## G4 brief

Validated output schema (`run_id`, strategy, mode, network, quote, risk checks, approval state, tx hash if any). Simulation and mock tests only. No real financial test txs.

---

## Bundle / ZIP note

- Attached ZIP = transfer kit (prepare/apply/import workflow helpers), not a self-contained full-history bundle usable without base commit `2b39ac6…`.
- Attached `.bundle` HEAD `236d365e…` requires that base; re-import would risk overwriting current V3 on main → **explicitly not performed**.
- V3 is already the live path; suite preserves it.

---

## Next actions for Grok / co-architect

1. Land this docs PR (documentary).
2. Open PR **G1** with matrix + test.
3. After user wallet connection: validate intents **one by one** — never batch auto-execute.
