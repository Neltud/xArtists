-- CANDIDATE ONLY — xArtists claim voucher V1, NO AUTOMATIC MIGRATION.
-- No production apply, signing or entitlement change in this pull request.
-- Requires an explicit testnet SC, audited issuer, real S1 and S2 tests first.
BEGIN;

CREATE TABLE IF NOT EXISTS claim_voucher_reservations (
  order_id         TEXT PRIMARY KEY REFERENCES paybox_orders(order_id) ON DELETE RESTRICT,
  provider_tx_id   TEXT NOT NULL UNIQUE,
  order_hash       BYTEA NOT NULL UNIQUE CHECK (octet_length(order_hash) = 32),
  chain_id         TEXT NOT NULL CHECK (chain_id IN ('1', 'T', 'D')),
  sc_address       BYTEA NOT NULL CHECK (octet_length(sc_address) = 32),
  signer_epoch     BIGINT NOT NULL CHECK (signer_epoch > 0 AND signer_epoch <= 4294967295),
  pack_type        SMALLINT NOT NULL CHECK (pack_type IN (1, 2, 3)),
  buyer_address    TEXT NOT NULL CHECK (buyer_address ~ '^erd1[a-z0-9]{58}$'),
  currency         TEXT NOT NULL DEFAULT 'EUR' CHECK (currency = 'EUR'),
  amount_cents     INTEGER NOT NULL CHECK (
    (pack_type = 1 AND amount_cents = 11000) OR
    (pack_type = 2 AND amount_cents = 7500) OR
    (pack_type = 3 AND amount_cents = 5000)
  ),
  catalog_version  SMALLINT NOT NULL DEFAULT 1 CHECK (catalog_version = 1),
  not_before       TIMESTAMPTZ NOT NULL,
  expires_at       TIMESTAMPTZ NOT NULL,
  state            TEXT NOT NULL DEFAULT 'reserved'
                     CHECK (state IN ('reserved','signed','claimed','revoked','expired','failed')),
  claim_tx_hash    TEXT UNIQUE,
  delivery_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (expires_at > not_before),
  CHECK (expires_at <= not_before + INTERVAL '15 minutes'),
  CHECK (state <> 'claimed' OR claim_tx_hash IS NOT NULL),
  CHECK (delivery_verified IS FALSE OR (state = 'claimed' AND claim_tx_hash IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS claim_voucher_reservations_state_expiry_idx
  ON claim_voucher_reservations (state, expires_at);

COMMIT;

-- IMPORTANT ISSUER TRANSACTION (NOT IMPLEMENTED):
-- BEGIN; SELECT ... FROM paybox_orders WHERE order_id=$1 FOR UPDATE;
--   Re-read the trusted JSON payload, PSP payment details, refunds/disputes,
--   buyer, exact Rule1 amount, and all S1 evidence under the same transaction.
--   Validate the provider_tx_id is unique, reserve only one order_hash/order_id,
--   and commit. Crash recovery must NEVER mint or deliver a second NFT.
-- Sign with the claim-only Ed25519 key in a separate audited service.
-- Reconcile S2 chain transaction, NFT nonce and owner independently before
-- setting state=claimed and delivery_verified=true in a SECOND locked commit.
-- A cancellation/refund after signature must revoke on-chain BEFORE refund.
-- Status columns on their own are not on-chain claims or revocations.
