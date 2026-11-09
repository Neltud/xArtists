-- xArtists accounts v1 — additive, deliberately NOT auto-applied.
-- Apply only after DBA review. Does not alter legacy PayBox, Stripe sandbox or mint tables.
BEGIN;

CREATE TABLE IF NOT EXISTS xa_user_accounts (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  disabled_at TIMESTAMPTZ,
  CONSTRAINT xa_user_accounts_disabled_after_creation CHECK (disabled_at IS NULL OR disabled_at >= created_at)
);

-- Only a trusted OIDC backend may insert provider subjects after signature,
-- issuer, audience, nonce and email verification; no passwords are stored here.
CREATE TABLE IF NOT EXISTS xa_account_identities (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES xa_user_accounts(id) ON DELETE RESTRICT,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'email_oidc')),
  provider_subject TEXT NOT NULL CHECK (length(provider_subject) BETWEEN 1 AND 512),
  verified_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT xa_identity_unique_subject UNIQUE (provider, provider_subject)
);
CREATE INDEX IF NOT EXISTS xa_account_identities_user_idx ON xa_account_identities(user_id);

-- Wallet linking requires independent fresh SIWX verification and a
-- PostgreSQL-backed one-use challenge; no client-submitted verified_at.
CREATE TABLE IF NOT EXISTS xa_account_wallets (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES xa_user_accounts(id) ON DELETE RESTRICT,
  network TEXT NOT NULL CHECK (network = 'multiversx'),
  address TEXT NOT NULL CHECK (address ~ '^erd1[a-z0-9]{58}$'),
  verified_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT xa_wallet_unique_address UNIQUE (network, address)
);
CREATE INDEX IF NOT EXISTS xa_account_wallets_user_idx ON xa_account_wallets(user_id);

-- Subscriptions grant service access only, NEVER NFT ownership.
-- provider_subscription_id must come from verified payment-provider events.
CREATE TABLE IF NOT EXISTS xa_fiat_subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES xa_user_accounts(id) ON DELETE RESTRICT,
  provider TEXT NOT NULL CHECK (provider = 'stripe'),
  provider_subscription_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN
    ('incomplete','trialing','active','past_due','canceled','unpaid')),
  period_end TIMESTAMPTZ NOT NULL,
  provider_verified_at TIMESTAMPTZ NOT NULL,
  canceled_at TIMESTAMPTZ,
  refunded BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT xa_subscription_unique_provider UNIQUE (provider, provider_subscription_id)
);
CREATE INDEX IF NOT EXISTS xa_fiat_subscriptions_user_idx ON xa_fiat_subscriptions(user_id);

-- Replay guard for verified subscription events; write event and state in ONE transaction.
CREATE TABLE IF NOT EXISTS xa_subscription_events (
  provider TEXT NOT NULL CHECK (provider = 'stripe'),
  provider_event_id TEXT NOT NULL,
  provider_subscription_id TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, provider_event_id)
);

COMMIT;
