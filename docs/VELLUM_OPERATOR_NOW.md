# Vellum Operator — run NOW

**CHAIN=1 · LIA_LIVE_TRADING=0 · PEM secrets only in vault.**

Deploy détaillé : **[`VELLUM_DEPLOY.md`](VELLUM_DEPLOY.md)**

## One-shot (paper + publish frontend)

```bash
export CHAIN=1 LIA_LIVE_TRADING=0 PYTHONPATH=.
python -m lia.vellum.production_run
```

Cadence Timer : **3–5 min**. Deploy phase **skipped** si `VELLUM_DEPLOY_SCS≠1`.

## Deploy SC via Vellum

```bash
# 1) Dry (build only)
export VELLUM_DEPLOY_SCS=1 VELLUM_DEPLOY_DRY=1 CHAIN=1 LIA_LIVE_TRADING=0 PYTHONPATH=.
# vault: LIA_WALLET_PEM
python -m lia.vellum.production_run

# 2) Real send
export VELLUM_DEPLOY_DRY=0
python -m lia.vellum.production_run

# 3) Verify (obligatoire avant flags VITE)
python scripts/verify_marketplace_codehash.py
```

Ou module direct : `python -m lia.vellum.deploy_scs_node`

## Interdits

- No LIVE without micro-proofs
- No bandeau removal without codeHash
- No auto kill-reset
- No PEM in git
