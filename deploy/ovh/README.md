# OVH — standalone xArtists Access API (parallel / NO-GO commerce)

This deploy is a **portable API package**, not a claim that the user's OVH server, DNS,
email, account database, Pinata or checkout are configured. It leaves GitHub Pages
and the current Render API untouched until a separate, proven cutover.

## Architecture

- **GitHub Pages** keeps the public dapp while the backend is moved.
- **OVH** runs the existing Node Access API behind Caddy HTTPS (port 8787 is
  private to Docker). Persistent HTTPS certificate state uses named volumes.
- **PostgreSQL** stays on the already-identified, *verified* database during the
  first cutover. Do not confuse Neon sandbox projects with the production DB or
  migrate data without a tested restore.
- **Akash** may later run stateless xOrus/3D batch workers. Do not attach customer
  accounts, wallet signing or the only database to an expiring Akash lease.

## Operator preflight

1. Confirm OVH server ownership and access, x86_64/aarch64 Docker Engine +
   Compose v2, firewall for ports 80/443, and a DNS host under your control.
   Use a **staging host** first; do not point the public frontend at it yet.
2. Copy `api.env.template` to `.env.api` **on the server only**. Set
   `DATABASE_URL` to the confirmed API database after validating TLS,
   backups, user privileges and data retention; set a strong server-only
   `ACCESS_JWT_SECRET`. Do not print credentials or copy the Render URL blindly.
3. Keep all compose-injected financial and mint flags at `0`. The sample file
   is deliberately noncommercial. Do not mount wallets, PEMs or seeds.
4. Set `API_HOSTNAME` to the exact staging DNS host (no scheme or path).
   Then run the commands below from `deploy/ovh/`.

```bash
cp api.env.template .env.api
# Edit .env.api privately on the server; the template has no secrets.
export API_HOSTNAME=api-staging.example.org   # replace with YOUR actual DNS host
docker compose config --quiet
docker compose up -d --build
docker compose ps
curl --fail-with-body "https://$API_HOSTNAME/health"
# A 503 here is an expected NO-GO if the schema is not ready:
curl -i "https://$API_HOSTNAME/v1/ops/studio-store/status"
```

The `/health` response proves only that the process is responding. A
PostgreSQL `orders_backend` label alone does not certify the database identity,
order reconciliation or NFT delivery. The Studio endpoint reports only schema
readiness, not upload approval.

## Validation and production cutover

- Match the configured API database to independent operator evidence;
  verify database migration versions 004/005/006 and SELECT-only schema probes.
- Test backups by restoring to a disposable database, then apply migrations
  separately with an authorized operator. **Compose startup never migrates.**
- Test SIWX challenge, wallet change and expired JWT; verify XPortal on a
  real browser and confirm Reown exact-origin allowlist. Test account login
  only after the approved auth service and DB mapping exist.
- Run API tests, CORS checks from `https://xartists.art`, mobile/desktop
  browser tests, and wallet/fiat rejection paths. Verify no checkout, mint,
  bridge, auction settlement or LIA trading can execute from staging.
- Update the Pages `VITE_ACCESS_API_BASE` **only after** an operator-approved
  cutover and a proven rollback URL. Observe errors, order idempotency, and
  signed request behavior. Revert the frontend API base if verification fails;
  leave Render running through the validation window.
- Caddy TLS requires functioning DNS and inbound 80/443; no OVH console or
  registrar changes are made by this repository.

## Stop conditions

Missing valid DNS/HTTPS, unknown database identity, ineffective backup,
auth failures, unexpected non-readonly capability, leakage of credentials,
or a failed wallet/order regression = **NO-GO**. Never report sales or
NFT delivery as live merely because the API health check is green.
