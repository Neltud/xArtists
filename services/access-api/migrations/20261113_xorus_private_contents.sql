-- xOrus customer report body. DRAFT, NEVER AUTO-APPLY TO PRODUCTION.
-- Only allow-listed CURATED derived analysis JSON, with content digest independently
-- checked by the backend reader. No raw third-party datasets or credentials.
BEGIN;
CREATE TABLE IF NOT EXISTS xa_xorus_private_contents (
  report_id text PRIMARY KEY REFERENCES xa_xorus_private_reports(report_id) ON DELETE RESTRICT,
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload)='object' AND
    octet_length(payload::text) BETWEEN 100 AND 32768),
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;
