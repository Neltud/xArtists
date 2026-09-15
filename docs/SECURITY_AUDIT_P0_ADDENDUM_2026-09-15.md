# Audit addendum — P0 enforcement (2026-09-15)

Suite de [`SECURITY_AUDIT_EXHAUSTIVE_2026-09-15.md`](./SECURITY_AUDIT_EXHAUSTIVE_2026-09-15.md).

## P0 items — statut

| # | Item | Statut |
|---|------|--------|
| 0.1 | DEMO_MODE true | **Enforced** `demoMode.ts` + `ops_p0_verify.py` |
| 0.2 | Probe SC avant deploy | `ops_sc_status.py` + p0 verify |
| 0.3 | PEM hors git | Runbook + no PEM in repo (ops discipline) |
| 0.4 | Interdit btc-bridge | `DO_NOT_DEPLOY.md` + deploy script refuse |
| 0.5 | Docs GO_DEMO | SOURCE_OF_TRUTH + ROADMAP |

## Commande unique

```bash
python3 scripts/ops_p0_verify.py
python3 scripts/ops_sc_status.py
```

## Audit approfondi — findings additionnels

### A1 — Nested `xArtists-master/`
**Sévérité P1** — copie imbriquée (~92 files). Risque de modifier le mauvais arbre.  
**Action :** supprimer ou déplacer vers `archive/` hors main path.

### A2 — Double executor paths
`lia/executor/universal.py` vs `nodes/universal_executor.py`  
**Risque :** Vellum node ignore `mode.py` si non importé.  
**Action P1 :** nodes must call `resolve_mode()` before live submit.

### A3 — Agents marketplace address null
UI must not invent addresses. integrityGates covers empty.

### A4 — Museum third-party images
Hotlink / IP leakage. Prefer repo `public/` or allowlist.

### A5 — Supernova speed vs watcher timeouts
600 ms rounds — ensure TX watchers don’t false-timeout (sdk migration).

### A6 — Discord bot token
If bot added: same class as PEM — host secret only.

## Re-test matrix (manual)

| Test | Attendu |
|------|--------|
| ops_p0_verify | exit 0 |
| Buy click demo | blocked |
| deploy btc-bridge | exit 1 |
| DEMO_MODE false in PR | p0 verify fail |
