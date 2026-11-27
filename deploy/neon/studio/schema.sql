-- New dedicated xartists-studio project ONLY. No changes to Render, Stripe or xOrus.
-- Empty-project equivalent of creator media migrations 004-007, plus persistent challenges.
BEGIN;
CREATE TABLE public.xartists_studio_media (
 id TEXT PRIMARY KEY,wallet TEXT NOT NULL CHECK (wallet ~ '^erd1[0-9a-z]{58}$'),
 mime TEXT NOT NULL CONSTRAINT xartists_studio_media_mime_check CHECK (mime IN ('image/jpeg','image/png','image/webp','video/mp4','model/gltf-binary','audio/mpeg','audio/wav','audio/flac')),
 bytes INTEGER NOT NULL CHECK(bytes>0 AND bytes<=50331648),
 sha256 TEXT CHECK(sha256 IS NULL OR sha256 ~ '^[0-9a-f]{64}$'),uri TEXT,
 status TEXT NOT NULL CONSTRAINT xartists_studio_media_status_check CHECK(status IN ('reserved','pinned','failed','metadata_pinning')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),metadata_uri TEXT,
 metadata_sha256 TEXT CONSTRAINT xartists_studio_media_metadata_sha256_format_check CHECK(metadata_sha256 IS NULL OR metadata_sha256 ~ '^[a-f0-9]{64}$'),
 CONSTRAINT xartists_studio_media_glb_bytes_check CHECK(mime<>'model/gltf-binary' OR bytes<=33554432),
 CONSTRAINT xartists_studio_media_audio_mp3_bytes_check CHECK(mime<>'audio/mpeg' OR bytes<=25165824)
);
CREATE INDEX xartists_studio_media_wallet_created_idx ON public.xartists_studio_media(wallet,created_at DESC);
CREATE TABLE public.xartists_studio_challenges (
 nonce TEXT PRIMARY KEY CHECK(nonce ~ '^[0-9a-f]{32}$'),wallet TEXT NOT NULL CHECK(wallet ~ '^erd1[0-9a-z]{58}$'),
 message TEXT NOT NULL CHECK(length(message)<=512),created_at TIMESTAMPTZ NOT NULL DEFAULT now(),expires_at TIMESTAMPTZ NOT NULL,used_at TIMESTAMPTZ
);
CREATE INDEX xartists_studio_challenges_wallet_created_idx ON public.xartists_studio_challenges(wallet,created_at DESC);
COMMIT;
