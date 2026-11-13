-- xArtists recurring service subscriptions: TEST-MODE ledger BINDING ONLY.
-- Additive, manual migration on a disposable PostgreSQL instance ONLY.
-- Does not activate Stripe Checkout, create a payment, issue xOrus grants,
-- create an NFT, send an email or modify the live PayBox order store.
BEGIN;

CREATE TABLE IF NOT EXISTS xa_stripe_billing_bindings (
  provider text NOT NULL DEFAULT 'stripe' CHECK (provider = 'stripe'),
  subscription_id text PRIMARY KEY CHECK (subscription_id ~ '^sub_[A-Za-z0-9]{6,128}$'),
  account_id uuid NOT NULL REFERENCES xa_user_accounts(id) ON DELETE RESTRICT,
  customer_id text NOT NULL CHECK (customer_id ~ '^cus_[A-Za-z0-9]{6,128}$'),
  price_id text NOT NULL CHECK (price_id ~ '^price_[A-Za-z0-9]{6,128}$'),
  plan text NOT NULL CHECK (plan IN ('fiat_379','fiat_579','fiat_979')),
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'eur' CHECK (currency='eur'),
  interval_unit text NOT NULL DEFAULT 'month' CHECK (interval_unit='month'),
  stripe_mode text NOT NULL DEFAULT 'test' CHECK (stripe_mode='test'),
  terminal boolean NOT NULL DEFAULT false,
  last_event_created bigint NOT NULL DEFAULT 0 CHECK (last_event_created>=0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT xa_stripe_binding_plan_amount CHECK (
    (plan='fiat_379' AND amount_cents=379)
    OR (plan='fiat_579' AND amount_cents=579)
    OR (plan='fiat_979' AND amount_cents=979)
  ),
  FOREIGN KEY(provider,subscription_id)
    REFERENCES xa_fiat_subscriptions(provider,provider_subscription_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS xa_stripe_billing_account_idx
  ON xa_stripe_billing_bindings(account_id,subscription_id);

-- Immutable replay receipts. Never retain signed raw payloads or payment data.
CREATE TABLE IF NOT EXISTS xa_stripe_billing_receipts (
  provider text NOT NULL DEFAULT 'stripe' CHECK (provider='stripe'),
  event_id text PRIMARY KEY CHECK (event_id ~ '^evt_[A-Za-z0-9]{6,128}$'),
  subscription_id text NOT NULL REFERENCES xa_stripe_billing_bindings(subscription_id)
    ON DELETE RESTRICT,
  body_sha256 text NOT NULL CHECK (body_sha256 ~ '^[a-f0-9]{64}$'),
  event_type text NOT NULL CHECK (event_type IN (
    'invoice.paid','invoice.payment_failed',
    'customer.subscription.updated','customer.subscription.deleted'
  )),
  event_created bigint NOT NULL CHECK (event_created > 0),
  outcome text NOT NULL CHECK (outcome IN (
    'paid_test_ledger','payment_failed','status_review',
    'canceled','late_ignored','terminal_ignored'
  )),
  received_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS xa_stripe_billing_receipts_subscription_idx
  ON xa_stripe_billing_receipts(subscription_id,received_at DESC);

COMMIT;
