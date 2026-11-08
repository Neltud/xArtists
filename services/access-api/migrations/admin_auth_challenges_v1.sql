-- CANDIDATE ONLY. Not applied to Neon or production automatically.
-- Durable single-use admin auth challenges (paper design for future server).
-- Application code must NOT grant privilege from this table alone without
-- MultiversX MessageComputer verification and an authenticated session binding.
BEGIN;
CREATE TABLE IF NOT EXISTS admin_auth_challenges_v1 (
  nonce text PRIMARY KEY CHECK (nonce ~ '^[A-Za-z0-9_-]{8,128}$'),
  admin_bech32 text NOT NULL CHECK (admin_bech32 ~ '^erd1[a-z0-9]{58}$'),
  action text NOT NULL CHECK (action IN (
    'resolveDispute','setAttestor','setPaused','refund','cancelByOwner','transferOwnership'
  )),
  domain text NOT NULL DEFAULT 'xArtists.admin.v1',
  chain_id text NOT NULL DEFAULT '1',
  contract_bech32 text,
  escrow_id text,
  favor_seller boolean,
  target_bech32 text,
  issued_at_ms bigint NOT NULL CHECK (issued_at_ms > 0),
  expires_at_ms bigint NOT NULL,
  consumed_at_ms bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_challenge_ttl CHECK (
    expires_at_ms > issued_at_ms
    AND expires_at_ms - issued_at_ms <= 600000
  ),
  CONSTRAINT admin_challenge_consume_order CHECK (
    consumed_at_ms IS NULL OR consumed_at_ms >= issued_at_ms
  )
);
CREATE INDEX IF NOT EXISTS admin_auth_challenges_open
  ON admin_auth_challenges_v1(admin_bech32, action, expires_at_ms)
  WHERE consumed_at_ms IS NULL;
COMMIT;
