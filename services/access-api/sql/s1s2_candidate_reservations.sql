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

-- Require a genuine server-recorded paid state and a correlated *live* job.
-- These checks do not verify RSA PSP signatures or chain finality themselves:
-- caller must supply separately authenticated and reviewed S1/S2 evidence.
CREATE OR REPLACE FUNCTION s1s2_candidate_assert_correlated()
RETURNS TRIGGER AS $func$
DECLARE
  o paybox_orders%ROWTYPE;
  j mint_jobs%ROWTYPE;
BEGIN
  SELECT * INTO o FROM paybox_orders
    WHERE order_id = NEW.order_id FOR SHARE;
  SELECT * INTO j FROM mint_jobs
    WHERE order_id = NEW.order_id FOR SHARE;

  IF o.order_id IS NULL OR j.order_id IS NULL OR
     o.status <> 'paid' OR
     o.provider_tx_id IS DISTINCT FROM NEW.provider_tx_id OR
     o.pack_id IS DISTINCT FROM NEW.pack_id OR
     o.buyer_address IS DISTINCT FROM NEW.buyer_address OR
     o.amount_cents IS DISTINCT FROM NEW.amount_cents OR
     o.payload->>'status' <> 'paid' OR
     o.payload->>'server_confirmed' IS DISTINCT FROM 'true' OR
     o.payload->>'payment_verified' IS DISTINCT FROM 'true' OR
     o.payload->>'delivery_verified' = 'true' OR
     o.payload->>'delivery' = 'confirmed' OR
     o.payload->>'delivered_at' IS NOT NULL OR
     o.payload->>'currency' IS DISTINCT FROM 'EUR' OR
     j.status NOT IN ('submitted', 'confirmed') OR
     j.payload->>'mode' IS DISTINCT FROM 'live' OR
     j.payload->>'micro_price' = 'true' OR
     j.payload->>'github_dispatch_accepted' IS DISTINCT FROM 'true' OR
     j.payload->>'order_id' IS DISTINCT FROM NEW.order_id OR
     j.payload->>'provider_tx_id' IS DISTINCT FROM NEW.provider_tx_id OR
     j.payload->>'pack_id' IS DISTINCT FROM NEW.pack_id OR
     j.payload->>'buyer_address' IS DISTINCT FROM NEW.buyer_address OR
     j.payload->>'amount_cents' IS DISTINCT FROM NEW.amount_cents::text OR
     j.payload->>'chain_tx_hash' IS DISTINCT FROM NEW.chain_tx_hash OR
     j.payload->>'nft_identifier' IS DISTINCT FROM NEW.nft_identifier
  THEN
    RAISE EXCEPTION 'S1/S2 candidate ledger rejects uncorrelated payment or mint'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END
$func$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS s1s2_candidate_insert_gate ON s1s2_candidate_reservations;
CREATE TRIGGER s1s2_candidate_insert_gate
  BEFORE INSERT ON s1s2_candidate_reservations
  FOR EACH ROW EXECUTE FUNCTION s1s2_candidate_assert_correlated();

-- Audit evidence is immutable, even if a payment is subsequently refunded.
-- New rights / revocation are separate transactions and are never inferred
-- from this table. Corrections require independent migration approval.
CREATE OR REPLACE FUNCTION s1s2_candidate_block_mutations()
RETURNS TRIGGER AS $func$
BEGIN
  RAISE EXCEPTION 'S1/S2 candidate reservations are immutable'
    USING ERRCODE = '23514';
END
$func$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS s1s2_candidate_immutable ON s1s2_candidate_reservations;
CREATE TRIGGER s1s2_candidate_immutable
  BEFORE UPDATE OR DELETE ON s1s2_candidate_reservations
  FOR EACH ROW EXECUTE FUNCTION s1s2_candidate_block_mutations();

-- No changes to paybox_orders, mint_jobs, buyer entitlements or on-chain state.
-- Future atomic delivery requires a separately reviewed, one-transaction
-- state transition with refund controls; it is intentionally absent here.
