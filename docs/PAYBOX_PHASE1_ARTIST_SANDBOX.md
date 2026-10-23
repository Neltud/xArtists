# Paybox System phase 1 — artist sandbox (hardened)

**Branch:** `feat/paybox-artist-sandbox-p0`  
**Manual:** Verifone Paybox System v8.3 (2025-09)

## IPN signature policy (no SHA-1 fallback)

| Setting | Value |
|---------|-------|
| `PBX_IPNALGOSIGN` | **SHA_256** |
| `PBX_SIGN_KEYSIZE` | **2048** |
| OpenSSL verify | RSA-SHA256 |
| Public key file | `services/access-api/src/paybox_pubkey_rsa2048.pem` |
| Provenance | https://www.paybox.com/wp-content/uploads/2025/09/pubkey_RSA_2048.pem |
| DER SHA-256 fingerprint | `f4926805a6b5294a3b4523f260c51c412617d774e2a4ef27c4ec0eb85ecb93d6` |

Legacy 1024-bit / SHA-1 signatures are **rejected**.

IPN verifies the **raw query/body string** with `sign` stripped (`extractRawSignedData`). `PBX_RETOUR` ends with `sign:K`.

3DSv2 outbound: `PBX_BILLING` + `PBX_SHOPPINGCART` always set.

## Buyer identity

Checkout and order status require **server-verified** identity:

1. `Authorization: Bearer` access JWT (`verifyJwt` HS256, `sub` = erd1…)
2. or SIWX body (`verifySignedChallenge` — nonce one-use + expiry)

Client `buyer_address` alone is **rejected**. Token/sub mismatch → 403.

## Artist designation

If `artist_beneficiary` is set, it **must** pass `PAYBOX_ARTIST_ALLOWLIST` (even without payout split).

| Layer | Status |
|-------|--------|
| Merchant capture (Paybox account) | Session → IPN paid |
| Accounting attribution | `artist_beneficiary` on order |
| Effective payout / reversement | **not_implemented** |

## claimFees application guard

| Path | Guard |
|------|-------|
| `scripts/claim_fees_guard.mjs` | Blocks if treasury dest null / LIA live / Guardian / codehash / proof |
| `scripts/claim_fees_prepare.mjs` | **Only** prepare entry — always runs guard; never broadcasts |
| SC `claimFees` | `require_owner` only — does **not** enforce treasury dest on-chain |

**Limit:** human `mxpy` with PEM is outside code control.

## Order store limits

- File lock = single-host concurrent IPN only
- Survives restart on persistent volume; not multi-replica safe without external DB

## Tests

```bash
cd services/access-api && npm ci
node --test tests/paybox_*.test.mjs
# 19/19 pass (local RSA-2048 fixtures + HTTP JWT/IPN)
node scripts/test_claim_fees_guard.mjs
# claim_fees_guard tests OK
```

Covered: invalid signatures, altered encoded data, amount mismatch, buyer spoof, cross-user order access, concurrent IPN idempotence, restart persistence (same volume), artist allowlist without split, fail-closed without merchant config.

| Layer | Result |
|-------|--------|
| Local RSA-2048 fixtures + HTTP | **19/19 automated pass** (this branch) |
| Real PSP preprod | **Not run** — no merchant credentials in CI |
| Production | **Not activated** |

**Lock limits:** file lock protects concurrent IPNs on **one host only**. Multi-replica requires external DB. Persistence survives restart on same volume; not guaranteed across ephemeral redeploys without PVC.
