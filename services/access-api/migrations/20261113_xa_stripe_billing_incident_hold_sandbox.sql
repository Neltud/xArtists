-- SAFETY-ONLY ADDITIVE migration: synthetic Stripe incident holds in disposable DB.
-- No live gateway calls, grants, checkout, pricing, production migration, or payout.
BEGIN;

CREATE TABLE IF NOT EXISTS xa_stripe_billing_payments (
  payment_intent_id TEXT PRIMARY KEY CHECK (payment_intent_id ~ '^pi_[A-Za-z0-9]{6,128}$'),
  invoice_id TEXT NOT NULL UNIQUE CHECK (invoice_id ~ '^in_[A-Za-z0-9]{6,128}$'),
  subscription_id TEXT NOT NULL REFERENCES xa_stripe_billing_bindings(subscription_id) ON DELETE RESTRICT,
  customer_id TEXT NOT NULL CHECK (customer_id ~ '^cus_[A-Za-z0-9]{6,128}$'),
  amount_cents INTEGER NOT NULL CHECK (amount_cents IN (379,579,979)),
  currency TEXT NOT NULL DEFAULT 'eur' CHECK (currency='eur'),
  stripe_mode TEXT NOT NULL DEFAULT 'test' CHECK (stripe_mode='test'),
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS xa_stripe_billing_payments_subscription_idx
  ON xa_stripe_billing_payments(subscription_id);

-- A Stripe event id is shared globally by xa_subscription_events; never
-- reuse the id after a refund, dispute, renewal or cancellation.
CREATE TABLE IF NOT EXISTS xa_stripe_billing_incident_receipts (
  event_id TEXT PRIMARY KEY CHECK (event_id ~ '^evt_[A-Za-z0-9]{6,128}$'),
  subscription_id TEXT NOT NULL REFERENCES xa_stripe_billing_bindings(subscription_id) ON DELETE RESTRICT,
  payment_intent_id TEXT NOT NULL REFERENCES xa_stripe_billing_payments(payment_intent_id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL CHECK (event_type IN ('charge.refunded','charge.dispute.created')),
  body_sha256 TEXT NOT NULL CHECK (body_sha256 ~ '^[a-f0-9]{64}$'),
  event_created BIGINT NOT NULL CHECK (event_created > 0),
  outcome TEXT NOT NULL CHECK (outcome IN ('refund_revoked','dispute_held','terminal_ignored')),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS xa_stripe_billing_incident_receipts_subscription_idx
  ON xa_stripe_billing_incident_receipts(subscription_id,received_at DESC);

COMMIT;
