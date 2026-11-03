-- xArtists P0 S1/S2 candidate reservation ledger (REVIEW ONLY).
-- Do not apply to production without a migration review and a backup.
-- This file is NOT run at API startup or by Render auto-deploy.
-- This table NEVER marks orders fulfilled and has no delivery_verified column.
--
-- Before applying: paybox_orders and mint_jobs must exist, and the PSP,
-- buyer/pack/amount and NFT receipt have been separately reviewed.
-- Uniqueness is deliberately conservative: a chain tx and a NFT identifier
-- can be reserved for only one order (batch delivery unsupported).
CREATE TABLE IF NOT EXISTS s1s2_candidate_reservations (
  order_id        TEXT PRIMARY KEY
    REFERENCES paybox_orders(order_id) ON DELETE RESTRICT,
  provider_tx_id  TEXT NOT NULL UNIQUE
    CHECK (provider_tx_id ~ '^[A-Za-z0-9_:.-]{1,128}$'),
  chain_tx_hash   TEXT NOT NULL UNIQUE
    CHECK (chain_tx_hash ~ '^[a-f0-9]{64}$'),
  nft_identifier  TEXT NOT NULL UNIQUE
    CHECK (nft_identifier ~ '^[A-Z0-9]{3,20}-[a-f0-9]{6}-[a-f0-9]{2,}$'),
  buyer_address   TEXT NOT NULL
    CHECK (buyer_address ~ '^erd1[a-z0-9]{58}$'),
  pack_id         TEXT NOT NULL
    CHECK (pack_id IN ('pulse', 'yield', 'sentinel')),
  amount_cents    INTEGER NOT NULL
    CHECK (amount_cents > 0),
  source          TEXT NOT NULL DEFAULT 'operator_s1s2_candidate'
    CHECK (source = 'operator_s1s2_candidate'),
  state           TEXT NOT NULL DEFAULT 'review_pending'
    CHECK (state = 'review_pending'),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT s1s2_candidate_mint_job_order_fkey FOREIGN KEY (order_id)
    REFERENCES mint_jobs(order_id) ON DELETE RESTRICT
);
-- No changes to paybox_orders, mint_jobs, buyer entitlements or on-chain state.
-- Future atomic delivery requires a separately reviewed, one-transaction
-- state transition with refund controls; it is intentionally absent here.
