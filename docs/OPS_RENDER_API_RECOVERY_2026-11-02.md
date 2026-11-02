# P0 — Render access-api serves frontend instead of JSON (2026-11-02)

**Incident:** [GitHub #287](https://github.com/Neltud/xArtists/issues/287)

## Observed (not a hypothesis)

Render service `xartists-access-api` (`srv-dbh35rt9fdbs73a4i100`) was configured with:
- `rootDir=""` (monorepo root)
- `dockerfilePath="./Dockerfile"`
- `dockerContext="."`

The **root Dockerfile** builds the xArtists Nginx frontend and redirects to
`/xArtists/`. It does **not** start the Access API. The actual API image is
defined in `services/access-api/Dockerfile` and starts
`node src/server.mjs`.

After the PR #286 deployment, `/health` returned frontend HTML rather than
the expected JSON. [GitHub run #41521292719](https://github.com/Neltud/xArtists/actions/runs/41521292719)
correctly failed **before dispatch**. Render reporting a deploy as `live`
does not establish application correctness.

**Impact:** Treat real PayBox/IPN, mint dispatch, and all commercial claims of
Access API availability as **NO-GO** until the correct image is deployed.

## One-service repair — Render Dashboard (human-authorized)

Open [xartists-access-api on Render](https://dashboard.render.com/web/srv-dbh35rt9fdbs73a4i100)
→ **Settings** → **Build & Deploy** (edit the existing service, not the frontend service):

| Setting | Correct value |
|---------|---------------|
| Root Directory | `services/access-api` |
| Dockerfile Path | `./Dockerfile` |
| Docker Build Context Directory | `.` |
| Docker Command | unset (use Dockerfile `CMD`) |
| Health Check Path | `/health` |
| Branch | `main` |

Root Directory makes paths relative to `services/access-api` in Render's
Dashboard configuration. The Dockerfile's `COPY package.json` and `COPY src`
therefore resolve to Access API files, not monorepo frontend files.
Do **not** change the root Dockerfile: a different frontend service may use it.

Preserve the closed commercial configuration:
`PAYBOX_CHECKOUT_ENABLED=0` (no new real PayBox card sessions),
`MINT_DISPATCH_ENABLED=0`, `MINT_DRY_RUN=1`,
`MINT_LIVE_ENABLED=0`, `LIA_LIVE_TRADING=0`,
and `MINT_GITHUB_PAT` empty until a new credential is created securely.
The backend itself now requires an explicit `PAYBOX_CHECKOUT_ENABLED=1`
before creating a card session, regardless of the installed PayBox keys.
This must remain OFF until a separate controlled S1/S2 commercial GO.
Verified signed IPNs for already-existing orders continue to be processed.
The previously exposed PAT must be revoked **on GitHub**; clearing Render
does not revoke a GitHub token.

Save settings and deploy a new image. Do not inject keys through GitHub
issues, pull requests or chat.

## Verification after deploy (no payment)

```bash
curl -i --max-time 45 https://xartists-access-api.onrender.com/health
```

Require HTTP 200, `Content-Type: application/json` and at least:
- `ok: true`
- `service: "access-api"`
- `mint_dry_run: true`, `mint_live_enabled: false`
- `mint_dispatch_enabled: false`, `lia_live_trading: "0"`
- `paybox_checkout_enabled: false`
- `tro_solana_bridge: "off"`

Then run [GO public smoke](https://github.com/Neltud/xArtists/actions/workflows/go-public-smoke.yml)
and [Mint dispatch dry-run probe](https://github.com/Neltud/xArtists/actions/workflows/mint-dispatch-dryrun-probe.yml).
The latter may dispatch a **synthetic** GitHub Actions dry-run using its own
short-lived runner token; it never uses Render's PAT or a signer PEM.
Its successful run is *not* proof of PayBox S1, real NFT delivery or refunds.

**Completion:** attach the Render deploy SHA, `/health` safe JSON evidence,
and green smoke links to issue #287. Continue S1/S2 only under a separate GO.

Render references: https://render.com/docs/monorepo-support and
https://render.com/docs/docker.
