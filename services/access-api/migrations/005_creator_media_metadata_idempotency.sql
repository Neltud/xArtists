-- xArtists Studio P1: run ONLY against the verified Render-linked database,
-- after operator approval. Never run on an unrelated Neon sandbox.
-- Prerequisite: 004_creator_media_pinata.sql (media table exists).
-- The API must remain CREATOR_MEDIA_UPLOAD_ENABLED=0 until this migration is checked.
BEGIN;

ALTER TABLE public.xartists_studio_media
  ADD COLUMN IF NOT EXISTS metadata_sha256 TEXT;

-- Migration 004 allowed reserved/pinned/failed. The new transient state
-- prevents two concurrent pinJSONToIPFS requests for the same upload.
ALTER TABLE public.xartists_studio_media
  DROP CONSTRAINT IF EXISTS xartists_studio_media_status_check;
ALTER TABLE public.xartists_studio_media
  ADD CONSTRAINT xartists_studio_media_status_check
  CHECK (status IN ('reserved','pinned','failed','metadata_pinning'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname='xartists_studio_media_metadata_sha256_format_check'
      AND conrelid='public.xartists_studio_media'::regclass
  ) THEN
    ALTER TABLE public.xartists_studio_media
      ADD CONSTRAINT xartists_studio_media_metadata_sha256_format_check
      CHECK (metadata_sha256 IS NULL OR metadata_sha256 ~ '^[a-f0-9]{64}$');
  END IF;
END $$;

COMMIT;

-- SAFE verification (no wallet addresses or IPFS CIDs printed):
-- SELECT column_name FROM information_schema.columns
--   WHERE table_schema='public' AND table_name='xartists_studio_media'
--   AND column_name='metadata_sha256';
-- SELECT pg_get_constraintdef(oid) FROM pg_constraint
--   WHERE conrelid='public.xartists_studio_media'::regclass
--     AND conname='xartists_studio_media_status_check';
-- SELECT count(*) FROM public.xartists_studio_media
--   WHERE status='metadata_pinning'; -- must be reconciled before rollout
