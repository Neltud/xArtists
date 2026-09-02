# Vellum ↔ Warps integration

## Pipeline
1. `lia.vellum.deploy_scs_node.run` writes `data/contracts.json`
2. `lia.vellum.update_warps_from_contracts.update_warps` injects `contracts.agents_marketplace` into `data/warps/*.json`
3. `lia.vellum.publish_data_for_frontend.publish` mirrors:
   - `data/agents_catalog.json`
   - `data/contracts.json`
   - `data/warps/*.json`
   - critical frontend JSON files
4. Frontend serves mirrored files from:
   - `apps/frontend/public/data/`
   - `docs/data/`

## Post-deploy checklist
- [ ] `data/contracts.json` contains a real `contracts.agents_marketplace`
- [ ] `python -m lia.vellum.update_warps_from_contracts` returns `"ok": true`
- [ ] `data/warps/buy-agent-action.json` no longer contains placeholders
- [ ] `data/warps/list-agent-action.json` no longer contains placeholders
- [ ] `apps/frontend/public/data/warps/` contains the refreshed templates
- [ ] `docs/data/warps/` contains the refreshed templates
- [ ] `apps/frontend` build stays green

## Reporter wiring
Use this order in Vellum Reporter:

1. `update_warps_from_contracts.update_warps()`
2. `publish_data_for_frontend.publish()`

This keeps the frontend and static Warps aligned with the latest deployed `agents_marketplace` address without committing any PEM or other secret.
