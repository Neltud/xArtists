-- xOrus private report metadata + access quotas, CANDIDATE ONLY.
-- NOT auto-applied to Neon, Render or any production database.
-- The only permitted writer is a separately audited service that verifies PSP events,
-- MVX ownership, commercial-source licences and SHA-256 report digests before INSERT.
BEGIN;

CREATE TABLE IF NOT EXISTS xa_xorus_private_reports (
  report_id text PRIMARY KEY CHECK (report_id ~ '^[a-f0-9]{64}$'),
  offer text NOT NULL CHECK (offer IN ('pulse','yield','sentinel')),
  scope text NOT NULL,
  kind text NOT NULL DEFAULT 'derived_xartists_analysis' CHECK (kind = 'derived_xartists_analysis'),
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility = 'private'),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','ready','revoked')),
  raw_data_included boolean NOT NULL DEFAULT false CHECK (raw_data_included = false),
  commercial_usage_approved boolean NOT NULL DEFAULT false,
  source_ts timestamptz NOT NULL,
  generated_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT xa_xorus_report_scope CHECK (
    (offer='pulse' AND scope='analysis:markets') OR
    (offer='yield' AND scope='analysis:defi') OR
    (offer='sentinel' AND scope='analysis:risk')
  ),
  CONSTRAINT xa_xorus_report_window CHECK (source_ts <= generated_at AND generated_at < expires_at)
);
CREATE INDEX IF NOT EXISTS xa_xorus_reports_ready_idx
  ON xa_xorus_private_reports(offer, expires_at)
  WHERE status = 'ready' AND commercial_usage_approved = true;

CREATE TABLE IF NOT EXISTS xa_xorus_grants (
  grant_id text PRIMARY KEY CHECK (grant_id ~ '^xag_[A-Za-z0-9_-]{12,80}$'),
  subject_kind text NOT NULL CHECK (subject_kind IN ('email','wallet')),
  subject text NOT NULL,
  account_id uuid REFERENCES xa_user_accounts(id) ON DELETE RESTRICT,
  offer text NOT NULL CHECK (offer IN ('pulse','yield','sentinel')),
  scope text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','revoked','refunded','expired')),
  issued_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  ledger_checked_at timestamptz NOT NULL,
  revoked_at timestamptz,
  refunded_at timestamptz,
  evidence_kind text NOT NULL CHECK (evidence_kind IN ('verified_psp_subscription','verified_mvx_nft_ownership')),
  evidence_verified boolean NOT NULL DEFAULT false,
  evidence_checked_at timestamptz NOT NULL,
  issuer_reference text,
  billing_status text,
  settlement text,
  chain_id text,
  nft_owner text,
  token_identifier text,
  nft_contract text,
  quota_limit integer NOT NULL CHECK (quota_limit > 0 AND quota_limit <= 1000000),
  quota_used integer NOT NULL DEFAULT 0 CHECK (quota_used >= 0 AND quota_used <= quota_limit),
  quota_reset_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT xa_xorus_grant_subject CHECK (
    (subject_kind='email' AND account_id IS NOT NULL AND subject = account_id::text)
    OR (subject_kind='wallet' AND account_id IS NULL AND subject ~ '^erd1[a-z0-9]{58}
  CONSTRAINT xa_xorus_grant_scope CHECK (
    (offer='pulse' AND scope='analysis:markets') OR
    (offer='yield' AND scope='analysis:defi') OR
    (offer='sentinel' AND scope='analysis:risk')
  ),
  CONSTRAINT xa_xorus_grant_window CHECK (
    issued_at < expires_at AND expires_at <= issued_at + interval '366 days' AND
    quota_reset_at > issued_at
  ),
  CONSTRAINT xa_xorus_evidence_kind CHECK (
    (subject_kind='email' AND evidence_kind='verified_psp_subscription') OR
    (subject_kind='wallet' AND evidence_kind='verified_mvx_nft_ownership')
  )
);
CREATE INDEX IF NOT EXISTS xa_xorus_grants_subject_idx
  ON xa_xorus_grants(subject_kind,subject,offer,expires_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS xa_xorus_grants_issuer_idx
  ON xa_xorus_grants(evidence_kind,issuer_reference)
  WHERE issuer_reference IS NOT NULL;

CREATE TABLE IF NOT EXISTS xa_xorus_read_reservations (
  request_id uuid PRIMARY KEY,
  grant_id text NOT NULL REFERENCES xa_xorus_grants(grant_id) ON DELETE RESTRICT,
  report_id text NOT NULL REFERENCES xa_xorus_private_reports(report_id) ON DELETE RESTRICT,
  subject text NOT NULL,
  reserved_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS xa_xorus_reservations_grant_idx
  ON xa_xorus_read_reservations(grant_id,reserved_at DESC);

COMMIT;
)
  ),
  CONSTRAINT xa_xorus_grant_scope CHECK (
    (offer='pulse' AND scope='analysis:markets') OR
    (offer='yield' AND scope='analysis:defi') OR
    (offer='sentinel' AND scope='analysis:risk')
  ),
  CONSTRAINT xa_xorus_grant_window CHECK (
    issued_at < expires_at AND expires_at <= issued_at + interval '366 days' AND
    quota_reset_at > issued_at
  ),
  CONSTRAINT xa_xorus_evidence_kind CHECK (
    (subject_kind='email' AND evidence_kind='verified_psp_subscription') OR
    (subject_kind='wallet' AND evidence_kind='verified_mvx_nft_ownership')
  )
);
CREATE INDEX IF NOT EXISTS xa_xorus_grants_subject_idx
  ON xa_xorus_grants(subject_kind,subject,offer,expires_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS xa_xorus_grants_issuer_idx
  ON xa_xorus_grants(evidence_kind,issuer_reference)
  WHERE issuer_reference IS NOT NULL;

CREATE TABLE IF NOT EXISTS xa_xorus_read_reservations (
  request_id uuid PRIMARY KEY,
  grant_id text NOT NULL REFERENCES xa_xorus_grants(grant_id) ON DELETE RESTRICT,
  report_id text NOT NULL REFERENCES xa_xorus_private_reports(report_id) ON DELETE RESTRICT,
  subject text NOT NULL,
  reserved_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS xa_xorus_reservations_grant_idx
  ON xa_xorus_read_reservations(grant_id,reserved_at DESC);

COMMIT;
