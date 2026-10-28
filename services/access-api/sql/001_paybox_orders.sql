-- Neon / Postgres — paybox orders (auto-applied on first connect via ensureSchema)
CREATE TABLE IF NOT EXISTS paybox_orders (
  order_id       TEXT PRIMARY KEY,
  pack_id        TEXT NOT NULL,
  amount_cents   INT  NOT NULL,
  buyer_address  TEXT NOT NULL,
  status         TEXT NOT NULL,
  provider_tx_id TEXT,
  payload        JSONB NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS paybox_orders_provider_tx_uidx
  ON paybox_orders (provider_tx_id) WHERE provider_tx_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS paybox_orders_buyer_idx ON paybox_orders (buyer_address);
