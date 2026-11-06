-- CANDIDATE ONLY. Not applied to Neon or production automatically.
-- Server-only plugin entitlement ledger, independent of NFT mint/delivery.
-- Provider events MUST be signature-verified and durably reserved upstream.
BEGIN;
CREATE TABLE IF NOT EXISTS plugin_entitlements_v1 (
  grant_id text PRIMARY KEY,
  product text NOT NULL CHECK (product ~ '^[a-z][a-z0-9-]{2,63}$'),
  subject text NOT NULL CHECK (length(subject) BETWEEN 8 AND 128),
  environment text NOT NULL CHECK (environment IN ('sandbox','production')),
  provider text NOT NULL CHECK (provider IN ('stripe','paybox','whop')),
  issuer_event text NOT NULL,
  key_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending','active','revoked','refunded','expired')),
  settlement_verification text NOT NULL CHECK (settlement_verification IN ('unverified','verified_provider_event')),
  issued_at_ms bigint NOT NULL CHECK (issued_at_ms > 0),
  expires_at_ms bigint NOT NULL,
  revoked_at_ms bigint,
  refunded_at_ms bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT plugin_grant_time_window CHECK (
    expires_at_ms > issued_at_ms AND expires_at_ms - issued_at_ms <= 31622400000
  ),
  CONSTRAINT plugin_grant_active_proof CHECK (
    status <> 'active' OR settlement_verification = 'verified_provider_event'
  ),
  -- An event cannot mint a second independent plugin access grant.
  CONSTRAINT plugin_grant_unique_provider_event UNIQUE(environment, provider, issuer_event)
);
CREATE INDEX IF NOT EXISTS plugin_grants_subject_product
  ON plugin_entitlements_v1(environment, subject, product, expires_at_ms DESC);
COMMIT;
