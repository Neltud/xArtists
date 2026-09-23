# Vellum ↔ dApp ↔ GitHub sync

Vellum is the **operator brain**: strategies, Guardian, paper/live execution.  
The dApp is the **surface**: pages, TxShell (user signs), demo tour.  
GitHub is the **source of truth** for public modules + mirrored JSON (never PEM).

## Doctrine

| Rule | Detail |
|------|--------|
| Paper-first | `LIA_LIVE_TRADING=0` by default |
| Guardian before Brain | `guardian_hook` before size-up |
| Fail-closed | gates / risk_manager can TRIP |
| User TX | `TxShell` on dApp — user wallet only |
| LIA ops TX | PEM **only** in Vellum vault — never user wallet, never git |
| Demo | Frontend `DEMO_MODE` + paper cycle |

## Cadence (Workflow A)

```bash
git pull origin main
export PYTHONPATH=. CHAIN=1 LIA_LIVE_TRADING=0
python -m lia.vellum.production_run
# after brain / signals:
python -m lia.vellum.dapp_sync
python -m lia.vellum.grok_mcp_ingest   # optional CrossScore
```

## Who signs what

| Actor | Where | Routes / nodes |
|-------|--------|----------------|
| **User** | TxShell (frontend) | `/marketplace` `/studio` `/agents` `/wallet` `/tip` `/staking` `/tro` `/burnify` `/sale` `/dao` … |
| **LIA paper** | Vellum host | `/trading` DecisionProof — no chain TX |
| **LIA live** | Vellum + PEM | only if gates + Guardian ARMED + micro-proofs |
| **Deploy SC** | Vellum + PEM | `deploy_scs_node` rare manual |

## Page ↔ roles (summary)

| Route | Strategy | Guardian | Sign |
|-------|----------|----------|------|
| `/trading` | ✓ | ✓ | paper / later LIA |
| `/agents` | ✓ | — | user packs |
| `/staking` `/lp` | ✓ | ✓ | user |
| `/tro` `/burnify` | ✓ | ✓ | user |
| `/hatom` | ✓ | — | paper propose |
| `/go-live` | — | ✓ | none (gates only) |
| `/demo` `/sim` | paper | — | none |
| `/wallet` `/tip` | — | — | user |
| `/marketplace` `/studio` | — | — | user |

Full machine-readable map: `data/vellum_dapp_map.json` (produced by `lia.vellum.dapp_sync`).

## Guardian surface on dApp

- Global: `GuardianStatusBar` ← `lia_v6_status.json` (`orchestrator.guardian`)
- Trading: brain + pretrade + paper legs
- Go-live: `go_live_gates.json` / `lia_decision_gates.json`
- Portfolio: `risk_manager_state.json`

## Strategies owned by Vellum

- Desk fuse + mode select (`YIELD` / `COMPOUND` / `DEFENSE`)
- Momentum / cross-arb scan (paper)
- Compounding echelons (staking / LP)
- TRO policy + burnify state
- Hatom booster publish
- Grok CrossScore (`grok_mcp_ingest`)

## Sync checklist for Vellum operators

1. `git pull` before each cycle  
2. Run `production_run` (pipeline → guardian → brain → paper → mirror)  
3. Run `dapp_sync` → refresh `vellum_dapp_map.json`  
4. Confirm Pages mirror (`apps/frontend/public/data/*`)  
5. Demo tour (`/demo`) uses paper only  
6. Never enable live without gates + Guardian ARMED + PEM vault  

## Related

- [VELLUM_WORKFLOW_MAP.md](./VELLUM_WORKFLOW_MAP.md)
- [GROK_VELLUM_MCP.md](./GROK_VELLUM_MCP.md)
- [INTEGRATION_HOOKS.md](./INTEGRATION_HOOKS.md)
- [PAGE_THEMES.md](./PAGE_THEMES.md)
