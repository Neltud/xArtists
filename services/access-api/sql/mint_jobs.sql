-- xArtists mint_jobs — standalone DDL for Render/Neon ops (#281)
-- Safe to run multiple times. Does NOT enable mint dispatch or live mint.
-- Runtime mintDispatch.mjs also CREATE TABLE IF NOT EXISTS on first PG use;
-- this file exists so operators can prove table presence without a dispatch call.

CREATE TABLE IF NOT EXISTS mint_jobs (
  order_id   text PRIMARY KEY,
  status     text NOT NULL,
  payload    jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mint_jobs_status_idx ON mint_jobs (status);
CREATE INDEX IF NOT EXISTS mint_jobs_updated_idx ON mint_jobs (updated_at DESC);

-- Advisory lock key space is application-level (see mintDispatch.mjs);
-- no extra grants beyond the API role that already owns paybox_orders.
