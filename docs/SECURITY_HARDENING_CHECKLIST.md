# Security hardening checklist (ops)

Complète [`SECURITY_AUDIT_EXHAUSTIVE_2026-09-15.md`](./SECURITY_AUDIT_EXHAUSTIVE_2026-09-15.md).

## Chaque release démo

- [ ] `python3 scripts/ops_sc_status.py` → NOT_DEPLOYED attendu ou DEPLOYED vérifié
- [ ] SoftStatus GO_DEMO si non déployé
- [ ] Aucun `VITE_LIA_LIVE_TRADING=1` sur Pages
- [ ] grep PEM/seed absent du diff

## Avant premier SC mainnet

- [ ] `./scripts/preflight_deploy_mainnet.sh`
- [ ] External review notes
- [ ] Owner key process (2-step if available)
- [ ] `post_deploy_verify` + update contracts.json
- [ ] Re-run integrityGates against live codeHash

## Avant LIA_LIVE_TRADING=1

- [ ] `mode_report('auto')` documenté
- [ ] Guardian kill testé
- [ ] Risk limits day/hour
- [ ] Micro EGLD only
- [ ] DEPLOYMENT_LOG entry
