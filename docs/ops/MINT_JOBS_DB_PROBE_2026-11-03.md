# mint_jobs DB probe — #281 residual (2026-11-03)

**PAT exposé : révoqué** (confirmé opérateur).

## Why this exists
Neon connector project `xartists-access-sandbox` previously showed `paybox_orders` without `mint_jobs`. That does **not** prove Render uses the same database. `mintDispatch.mjs` creates `mint_jobs` lazily when PostgreSQL is used with dispatch paths.

## Operator checklist (no secrets in chat)

1. Identify the PostgreSQL **provider and instance actually bound to Render access-api** using the operator dashboard, without copying, logging or posting `DATABASE_URL`. The connected Render workspace currently lists no managed Postgres instances; the runtime may use an external provider. Do NOT infer production from the Neon sandbox.
2. In the **actual database provider's SQL console** (not in an unrelated Neon sandbox), run:
   ```sql
   SELECT to_regclass('public.mint_jobs') AS mint_jobs_regclass;
   ```
3. If null, review `services/access-api/sql/mint_jobs.sql` with the DB operator, take a schema backup/rollback plan, and apply only after confirming the exact instance and permissions; then re-run the select. **Do not apply it to production automatically from an AI session.**
4. Optional count only (no PII):
   ```sql
   SELECT count(*) AS mint_jobs_count FROM mint_jobs;
   ```
5. Comment on #281: `mint_jobs present: yes/no` + whether instance is sandbox or production-named — **no connection string**.

## Still NO-GO
Checkout, live mint, claim HTTP issuer, LIA trade, TRO bridge.
