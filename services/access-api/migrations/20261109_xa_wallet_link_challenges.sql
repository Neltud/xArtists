-- Replay-resistant wallet-link challenges, isolated from legacy SIWX auth.
-- This migration is NOT automatically applied.
BEGIN;
CREATE TABLE IF NOT EXISTS xa_wallet_link_challenges (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES xa_user_accounts(id) ON DELETE CASCADE,
  nonce_hash TEXT NOT NULL UNIQUE CHECK (nonce_hash ~ '^[a-f0-9]{64}$'),
  domain TEXT NOT NULL CHECK (length(domain) BETWEEN 3 AND 255),
  address TEXT NOT NULL CHECK (address ~ '^erd1[a-z0-9]{58}$'),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  CONSTRAINT xa_wallet_link_expiry CHECK (expires_at > issued_at),
  CONSTRAINT xa_wallet_link_consumed_after_issue CHECK (consumed_at IS NULL OR consumed_at >= issued_at)
);
CREATE INDEX IF NOT EXISTS xa_wallet_link_user_idx ON xa_wallet_link_challenges(user_id);
COMMIT;
