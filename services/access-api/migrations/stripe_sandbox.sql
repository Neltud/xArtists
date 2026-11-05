-- Apply only to an explicitly selected isolated test database; no automatic startup DDL.
BEGIN;
CREATE TABLE IF NOT EXISTS stripe_sandbox_orders (
  order_id TEXT PRIMARY KEY,
  buyer TEXT NOT NULL,
  pack_id TEXT NOT NULL CHECK (pack_id IN ('pulse','yield','sentinel')),
  amount_cents INT NOT NULL CHECK (
    (pack_id='pulse' AND amount_cents=11000) OR
    (pack_id='yield' AND amount_cents=7500) OR
    (pack_id='sentinel' AND amount_cents=5000)),
  created_ms BIGINT NOT NULL,
  session_id TEXT UNIQUE,
  session_url TEXT,
  payment_intent TEXT UNIQUE,
  payment_verified BOOLEAN NOT NULL DEFAULT FALSE,
  refunded_cents INT NOT NULL DEFAULT 0 CHECK (refunded_cents BETWEEN 0 AND amount_cents)
);
CREATE TABLE IF NOT EXISTS stripe_sandbox_events (
  event_id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES stripe_sandbox_orders(order_id),
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMIT;
