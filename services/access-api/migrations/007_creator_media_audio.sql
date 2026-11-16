-- Audio upload support: operator-reviewed and applied ONLY to the identified API database.
-- Requires migrations 004, 005 and 006; uploads remain disabled throughout.
-- Idempotent: reapply without changing the effective allowed MIME set.
BEGIN;

ALTER TABLE public.xartists_studio_media
  DROP CONSTRAINT IF EXISTS xartists_studio_media_mime_check;
ALTER TABLE public.xartists_studio_media
  ADD CONSTRAINT xartists_studio_media_mime_check
  CHECK (mime IN (
    'image/jpeg','image/png','image/webp','video/mp4','model/gltf-binary',
    'audio/mpeg','audio/wav','audio/flac'
  ));

ALTER TABLE public.xartists_studio_media
  DROP CONSTRAINT IF EXISTS xartists_studio_media_audio_mp3_bytes_check;
ALTER TABLE public.xartists_studio_media
  ADD CONSTRAINT xartists_studio_media_audio_mp3_bytes_check
  CHECK (mime <> 'audio/mpeg' OR bytes <= 25165824);

COMMIT;

-- Safe schema verification only, no artist rows or private URIs:
-- SELECT pg_get_constraintdef(oid) FROM pg_constraint
--   WHERE conrelid='public.xartists_studio_media'::regclass
--     AND conname IN ('xartists_studio_media_mime_check',
--                     'xartists_studio_media_audio_mp3_bytes_check');
