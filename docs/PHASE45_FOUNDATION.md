# Phase 4.5 — Foundation fixes

| Item | Fix |
|------|-----|
| Pending UI | `PendingActions` on LIA hub — WAITING FOR SIGNATURE |
| History | `/#/history` |
| Admin | `/#/admin` local YAML overlay (read-only server truth) |
| Slippage size | cut 50% if realized slip > 2% |
| Slippage guard | `min_out` bps widens from `performance_delta` |
| Audit | `data/system_audit.log` via `lia.utils.audit_log` |
| Docker | `docker-compose.yml` |

Static GitHub Pages cannot run `/api/approve` server-side. UI approve = localStorage + copy CLI.

No new strategies. No live auto-trade.
