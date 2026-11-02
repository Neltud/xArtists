-- xArtists first artist mint: apply to the *confirmed* Render-linked PostgreSQL database
-- after reviewed migration approval. Never apply to an unrelated Neon sandbox.
-- No private media content: only metadata/hash, public IPFS references and audit state.
BEGIN;

CREATE TABLE IF NOT EXISTS xartists_studio_media (
  id TEXT PRIMARY KEY,
  wallet TEXT NOT NULL CHECK (wallet ~ '^erd1[0-9a-z]{58}$'),
  mime TEXT NOT NULL CHECK (mime IN ('image/jpeg', 'image/png', 'image/webp', 'video/mp4')),
  bytes INTEGER NOT NULL CHECK (bytes > 0 AND bytes <= 50331648),
  sha256 TEXT CHECK (sha256 IS NULL OR sha256 ~ '^[0-9a-f]{64}$'),
  uri TEXT,
  status TEXT NOT NULL CHECK (status IN ('reserved', 'pinned', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata_uri TEXT
);
CREATE INDEX IF NOT EXISTS xartists_studio_media_wallet_created_idx
  ON xartists_studio_media (wallet, created_at DESC);

COMMIT;

-- Verify *without* printing wallet records:
-- SELECT to_regclass('public.xartists_studio_media') AS media_table;
-- SELECT indexname FROM pg_indexes WHERE tablename = 'xartists_studio_media';
