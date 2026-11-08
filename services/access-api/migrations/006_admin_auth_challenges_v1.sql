-- 006 — admin auth challenges (durable single-use nonces)
-- CANDIDATE / operator-reviewed. Not applied to Neon or production automatically.
-- Privilege still requires MultiversX MessageComputer verification + session binding.
-- Do not grant SC owner powers from this table alone.

BEGIN;

CREATE TABLE IF NOT EXISTS admin_auth_challenges_v1 (
  nonce text PRIMARY KEY
    CHECK (nonce ~ '^[A-Za-z0-9_-]{8,128}$'),
  admin_bech32 text NOT NULL
    CHECK (admin_bech32 ~ '^erd1[a-z0-9]{58}$'),
  action text NOT NULL
    CHECK (action IN (
      'resolveDispute',
      'setAttestor',
      'setPaused',
      'refund',
      'cancelByOwner',
      'transferOwnership'
    )),
  domain text NOT NULL DEFAULT 'xArtists.admin.v1'
    CHECK (domain = 'xArtists.admin.v1'),
  chain_id text NOT NULL DEFAULT '1'
    CHECK (chain_id = '1'),
  contract_bech32 text
    CHECK (contract_bech32 IS NULL OR contract_bech32 ~ '^erd1[a-z0-9]{58}$'),
  escrow_id text
    CHECK (escrow_id IS NULL OR escrow_id ~ '^(0|[1-9][0-9]*)$'),
  favor_seller boolean,
  target_bech32 text
    CHECK (target_bech32 IS NULL OR target_bech32 ~ '^erd1[a-z0-9]{58}$'),
  issued_at_ms bigint NOT NULL
    CHECK (issued_at_ms > 0),
  expires_at_ms bigint NOT NULL,
  consumed_at_ms bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_challenge_ttl CHECK (
    expires_at_ms > issued_at_ms
    AND expires_at_ms - issued_at_ms >= 30000
    AND expires_at_ms - issued_at_ms <= 600000
  ),
  CONSTRAINT admin_challenge_consume_order CHECK (
    consumed_at_ms IS NULL OR consumed_at_ms >= issued_at_ms
  ),
  CONSTRAINT admin_challenge_dispute_fields CHECK (
    action <> 'resolveDispute'
    OR (escrow_id IS NOT NULL AND favor_seller IS NOT NULL)
  ),
  CONSTRAINT admin_challenge_escrow_actions CHECK (
    action NOT IN ('refund', 'cancelByOwner')
    OR escrow_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS admin_auth_challenges_open
  ON admin_auth_challenges_v1 (admin_bech32, action, expires_at_ms)
  WHERE consumed_at_ms IS NULL;

CREATE INDEX IF NOT EXISTS admin_auth_challenges_expiry
  ON admin_auth_challenges_v1 (expires_at_ms)
  WHERE consumed_at_ms IS NULL;

COMMIT;
