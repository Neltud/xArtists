# mint_jobs DB probe — #281 residual (2026-11-03)

**PAT exposé : révoqué** (confirmé opérateur).

## Why this exists
Neon connector project `xartists-access-sandbox` previously showed `paybox_orders` without `mint_jobs`. That does **not** prove Render uses the same database. `mintDispatch.mjs` creates `mint_jobs` lazily when PostgreSQL is used with dispatch paths.

## Operator checklist (no secrets in chat)

1. In Render dashboard only: note which Postgres instance is bound to access-api (`DATABASE_URL` — never paste).
2. In that instance SQL console, run:
   ```sql
   SELECT to_regclass('public.mint_jobs') AS mint_jobs_regclass;
   ```
3. If null, apply `services/access-api/sql/mint_jobs.sql` then re-run the select.
4. Optional count only (no PII):
   ```sql
   SELECT count(*) AS mint_jobs_count FROM mint_jobs;
   ```
5. Comment on #281: `mint_jobs present: yes/no` + whether instance is sandbox or production-named — **no connection string**.

## Still NO-GO
Checkout, live mint, claim HTTP issuer, LIA trade, TRO bridge.
