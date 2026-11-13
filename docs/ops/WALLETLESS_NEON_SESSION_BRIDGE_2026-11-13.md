# Walletless Neon session bridge — candidate, NO-GO production

The POST /v1/account/session route is now present but **disabled by default**. It does not sign a new JWT, mint NFTs, create subscriptions, grant xOrus access or authorize checkout. It accepts only a short-lived **Bearer Neon EdDSA JWT** after an explicit browser login via Neon Auth, not a wallet address or email string.

When an operator confirms the exact intended DB, backup+restore, migrations, Neon verified-email/JWKS configuration, cross-origin controls and a real session rehearsal, the server can be configured with:
- WALLETLESS_ACCOUNT_SESSION_ENABLED=1
- WALLETLESS_DATABASE_TARGET_CONFIRMED=1
- NEON_AUTH_BASE_URL=<operator-pinned exact Neon Auth instance HTTPS URL>
- DATABASE_URL=<operator-verified PostgreSQL target> (server-only)
Both flags are required. Never put credentials, tokens, private endpoints or DSNs into VITE_, GitHub comments or logs.

The server verifies issuer/audience/expiry, Ed25519 signature and confirmed email with the existing Neon adapter before creating or finding a stable account UUID under advisory PostgreSQL locks. The API exposes only UUID and verified-email *account type*; wallet link, subscription and NFT status are explicitly unverified/no entitlement. The verified Neon bearer never becomes a MultiversX wallet JWT.

Future production readiness requires: real OTP signup/login frontend, provider-session revocation and rotation policy, authorization on every protected request, anti-abuse and account deletion/export, verified links to the correct DB instance, SIWX optional wallet association, Stripe signed test webhook / refund replay, PostgreSQL quota and private report access integrated behind a separately reviewed feature gate. The current route must not be enabled until the operator independently verifies these prerequisites. 
