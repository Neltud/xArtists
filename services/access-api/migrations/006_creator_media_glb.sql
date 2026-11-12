-- Apply to the confirmed API database after checking 004 + 005 and its backup.
-- Uploads remain disabled during migration. This file never enables an API gate.
BEGIN;

ALTER TABLE public.xartists_studio_media
  DROP CONSTRAINT IF EXISTS xartists_studio_media_mime_check;
ALTER TABLE public.xartists_studio_media
  ADD CONSTRAINT xartists_studio_media_mime_check
  CHECK (mime IN ('image/jpeg','image/png','image/webp','video/mp4','model/gltf-binary'));

ALTER TABLE public.xartists_studio_media
  DROP CONSTRAINT IF EXISTS xartists_studio_media_glb_bytes_check;
ALTER TABLE public.xartists_studio_media
  ADD CONSTRAINT xartists_studio_media_glb_bytes_check
  CHECK (mime <> 'model/gltf-binary' OR bytes <= 33554432);

COMMIT;
