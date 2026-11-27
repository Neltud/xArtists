# Studio media on Neon — isolated free pilot

Created 27 November 2026: project `xartists-studio` (`shy-tooth-63227941`), Frankfurt, branch `br-sparkling-breeze-bh8gp2jl`. The two empty tables were created directly with the final schema; no migration of existing user records and no change to Stripe or xOrus. This service is **not the existing Access API** and must not replace its base URL.

## Activation checklist

- Build the ZIP using the CI workflow, verify entrypoint and digest, deploy only to the project above.
- Configure a dedicated, minimally scoped Pinata server JWT using the provider console (never frontend, chat, logs or Git). Confirm Free limits and available capacity; use a dedicated account or budget. No subscription upgrade authorized.
- Set a new random >=32-character server JWT secret; do not share with Access API. Set STUDIO_FREE_PILOT=1, STUDIO_IPFS_PROVIDER=pinata, XARTISTS_STUDIO_PROJECT_CONFIRMED=shy-tooth-63227941, STUDIO_GLB_UPLOAD_ENABLED=0. Neon provides DATABASE_URL and branch identity. Keep CREATOR_MEDIA_UPLOAD_ENABLED=0 and XARTISTS_STUDIO_UPLOAD_APPROVED=0 for initial deployment.
- Confirm TLS, schema, auth preflight, CORS, content-length/stream support, wallet signature, persistent one-use challenge, 2 MiB maximum. Free pilot accepts JPEG/PNG/WebP only. Lifetime reservation ceiling 100 media/200 MiB conservatively counts failed/uncertain rows. No automatic budget resets. This is not a proof of provider quota or durability.
- Enable the two explicit upload flags only after the above checks, then test one authorized image and metadata, verify byte readback and prepare independent backups. Do not mint or pay on behalf of an artist.
- Frontend integration is a separate PR: studio-only HTTPS origin, exact CSP, server-reported supported types/limits, rights header, no fallback on mutations, no reuse of Access API tokens. Do not point the public frontend at this candidate until real browser and wallet checks pass.
- A public 200 on /health does not certify publication. Keep the public UI truthful. Video/music/3D support requires an independent load/quotas review before release.

No payment, card, trading, mint, or wallet-key route exists in this service. No secrets included in the repository.
