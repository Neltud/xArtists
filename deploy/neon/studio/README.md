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

## First disabled deployment — operator workflow

The operator workflow `Studio Neon — deploy disabled (operator only)` builds from main and uses the reviewed multipart Neon API. Configure an environment named `studio-neon` with the secret `NEON_STUDIO_API_KEY` (minimal dedicated operator access where available). Do not put credentials in variables, source files, chat, logs or pull requests. The workflow never runs on a PR or schedule. It refuses to overwrite an existing function and generates a new private session secret. Both upload flags stay at 0 and Pinata is absent until configured separately.

Alternatively, run the reviewed script with the inner candidate ZIP (not the enclosing GitHub artifact):

```sh
python3 scripts/ops/deploy-neon-studio.py neon-studio.zip --expected-source <verified-checkout-sha>
python3 scripts/ops/deploy-neon-studio.py neon-studio.zip --expected-source <verified-checkout-sha> --deploy-disabled
```

The first command is offline, prints only package and target metadata. The second prompts invisibly for the Neon API key when not in the environment. It will only deploy the fixed dedicated project, never a sandbox or xOrus. After completion inspect the exact invocation URL and ensure the config still reports enabled:false. Configure Pinata only in the function's secure environment, then validate storage and the browser before enabling artist uploads. No automatic replay on ambiguous deployment errors.

## Sustainable releases — bootstrap or code-only update

The same protected `studio-neon` environment is used for future releases. Prefer a project-scoped organization API key restricted to xartists-studio (Neon Console → organization settings → API keys); keep it only in the GitHub environment secret `NEON_STUDIO_API_KEY`. Never use the Stripe or access sandbox key. No CLI installation or artifact transfer from chat is necessary. Manual release jobs build on a GitHub runner and test against disposable PostgreSQL first. The `bootstrap` mode requires no existing function and generates a new session secret with upload flags off. `update` requires the exact current and active completed deployment ID and sends only the code ZIP, retaining environment/runtime. Never submit the key, Pinata JWT or session secret in workflow inputs.

Every release verifies the exact accepted deployment ID, public /health source SHA, CORS allow/deny, config, no checkout and preserved upload readiness before emitting a non-secret JSON receipt. No automatic replay after ambiguous HTTP or smoke failures. Use Neon MCP for inspection and read-only diagnosis. Configure Pinata and upload approval independently after the first disabled receipt. To roll back, first review the prior known-good source and environment, use a separately reviewed release commit on main, then dispatch a code-only update against the exact currently active ID. No automatic rollback or financial activation. Keep GitHub environment protection and branch protections enabled. If the confirmed invocation origin differs from the candidate in code, stop and update the reviewed origin before switching the frontend.

## First release from the reviewed workflow change

The owner has requested the first deployment after configuring the protected studio-neon environment. A push to main changing neon-studio-deploy.yml starts the disabled bootstrap only (ordinary commits do not trigger it). The deploy runner still needs the existing environment secret, disposable Postgres tests and exact artifact checks; it refuses to overwrite an existing function. After the initial receipt, future code releases use the explicit update mode. Never enable uploads automatically or infer a successful release from CI. The automatic trigger is limited to this workflow file, and can be removed once the first receipt has been checked.

## Studio commercial UX

The published quantity schedule is a target service price, including standard compatible-file hosting, decentralized publication and metadata preparation, not a separately sold hosting add-on. Network charges remain separately disclosed before wallet confirmation. No payment at the estimate stage. Confirm retention duration, replicated storage, size limits, tax and collection capacity before paid service activation. The existing pilot remains capped at 2 MiB/image and 100 reservations; neither the target price nor the estimate for 10,000 NFTs establishes capacity or lifetime storage. Do not instruct novice artists to obtain their own hosting. The existing advanced URI path remains optional for already-published work.

## Pilot media verification

A Pinata CID alone is not a successful upload. The pilot stores the SHA-256 at reservation time, saves the returned URI before a bounded, credential-free public IPFS readback, and only transitions to pinned after exact length/hash verification. Metadata is compared structurally with the expected JSON before commit. Unknown outcomes retain the reservation and block another upload of the same bytes from that wallet until operator reconciliation. Failed or uncertain reservations still consume capacity. Never reset a reservation solely because a gateway timed out. The public ipfs.io readback is a pilot availability/integrity check, not an SLA, second persistent copy, or permission to rely on that gateway commercially. Production needs a verified backup and a suitable gateway/retention policy before paid activation. This does not enable uploads or minting.

## First live deployment receipt — 2026-11-28

Deployment `1` is active on `shy-tooth-63227941`, branch `br-sparkling-breeze-bh8gp2jl`, function `studio`, runtime Node 24. Source `c0719b88b0328626c2cd34497d313b30bcc27e43`. The temporary reviewed compact bundle was 85,702 bytes (SHA-256 `7dd86067d231ea2d683a9799bf26cc33542163fb6f1e1dbb0235fed6e3e44721`), produced by [handoff run 46127492243](https://github.com/Neltud/xArtists/actions/runs/46127492243). Deployed through existing Neon connector without a GitHub administrative login or new API key. Both active and current deployment IDs confirmed completed. [HTTPS receipt 46127651560](https://github.com/Neltud/xArtists/actions/runs/46127651560): health and config 200, foreign origin 403, OPTIONS 204, four write routes 503, checkout 404. Uploads and commerce disabled. Exact invocation origin `https://br-sparkling-breeze-bh8gp2jl-studio.compute.c-10.eu-central-1.aws.neon.tech` is now the Pages build target; no change to payment/access API. The temporary connector handoff branch is not a permanent production release system. Keep protected operator release workflow manual; a project-scoped GitHub environment secret remains required if using that workflow. No automatic bootstrap after deployment 1. Pinata authorization, backup and actual image readback are still required before activation; the successful health receipt is not a publication receipt.
