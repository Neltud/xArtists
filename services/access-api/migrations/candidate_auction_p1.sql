-- CANDIDATE ONLY — do not apply to production without explicit ops GO.
-- xArtists auction P1: physical / digital_nft / hybrid English auctions.

CREATE TABLE IF NOT EXISTS auction_listings (
  id              TEXT PRIMARY KEY,
  seller_address  TEXT NOT NULL,
  listing_type    TEXT NOT NULL CHECK (listing_type IN ('physical', 'digital_nft', 'hybrid')),
  title           TEXT NOT NULL,
  description     TEXT,
  condition_sha256 TEXT,
  nft_identifier  TEXT,
  start_bid_cents INTEGER NOT NULL CHECK (start_bid_cents > 0),
  reserve_cents   INTEGER CHECK (reserve_cents IS NULL OR reserve_cents >= start_bid_cents),
  bid_increment_cents INTEGER NOT NULL DEFAULT 1000 CHECK (bid_increment_cents > 0),
  currency        TEXT NOT NULL DEFAULT 'EUR',
  start_at        TIMESTAMPTZ NOT NULL,
  end_at          TIMESTAMPTZ NOT NULL,
  state           TEXT NOT NULL DEFAULT 'draft',
  high_bid_cents  INTEGER,
  high_bidder     TEXT,
  winner_address  TEXT,
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_at > start_at)
);

CREATE INDEX IF NOT EXISTS auction_listings_state_end ON auction_listings (state, end_at);

CREATE TABLE IF NOT EXISTS auction_bids (
  id              BIGSERIAL PRIMARY KEY,
  listing_id      TEXT NOT NULL REFERENCES auction_listings(id),
  bidder_address  TEXT NOT NULL,
  amount_cents    INTEGER NOT NULL CHECK (amount_cents > 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS auction_bids_listing ON auction_bids (listing_id, created_at DESC);

CREATE TABLE IF NOT EXISTS auction_orders (
  order_id        TEXT PRIMARY KEY,
  listing_id      TEXT NOT NULL REFERENCES auction_listings(id),
  buyer_address   TEXT NOT NULL,
  amount_cents    INTEGER NOT NULL,
  status          TEXT NOT NULL DEFAULT 'created',
  server_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  provider_tx_id  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
