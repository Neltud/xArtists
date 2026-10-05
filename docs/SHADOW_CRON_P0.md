# P0 — Shadow Sprint cron

Workflow: `.github/workflows/shadow-sprint.yml`

- Schedule: every **2 hours** UTC + `workflow_dispatch`
- Runs: `python -m lia.shadow.sprint` then `publish_lia_status`
- Commits updated `data/lia_shadow_*.json` + public mirrors when changed

This unfreezes hub KPIs so day_index / equity_curve move during the 7-day sprint.

**Still paper only** — no `LIA_LIVE_TRADING`.
