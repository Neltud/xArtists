# Claim phase 0 checklist — dual agent

| Item | Owner | Status |
|------|-------|--------|
| Architecture B+A doc | ChatGPT #312 | Done (draft PR) |
| `assessPaidClaimCandidate` | ChatGPT #312 | Done + tests |
| Domain codec 17-byte + orderHash | Grok | Done on symbiosis branch |
| Revocation / TTL policy pure | Grok | Done |
| CI green on #312 | shared | Was green |
| SC claimPack testnet | ChatGPT lead | **TODO** |
| Ed25519 claim-only key in vault | ops + ChatGPT | **TODO** |
| Neon/Render DB has mint_jobs | ops | **TODO** (sandbox gap noted) |
| HTTP issuer endpoint | later | **NO** until SC+revoke |
| #310 live mint lock | both | **KEEP** |
| Marketing #311 | ChatGPT | parallel OK |

**Merge order:** #312 → codec/revocation branch → SC PR séparée.
