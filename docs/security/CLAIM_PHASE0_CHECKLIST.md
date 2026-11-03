# Claim phase checklist — dual agent (updated 2026-11-03)

| Item | Owner | Status |
|------|-------|--------|
| Architecture B+A doc | ChatGPT | Done (merged) |
| `assessPaidClaimCandidate` | ChatGPT | Done |
| Canonical `claimVoucherCodec` | ChatGPT | Done |
| Domain facade + revoke + compose | Grok → merged | Done |
| TTL ≤ 15 min | shared | Done |
| Isolated SC `claim-pack-testnet` | ChatGPT | Done in repo |
| VM scenario matrix | ChatGPT | Reported 12/12 (local) |
| Public testnet deploy + chain-id | ChatGPT lead | **TODO** |
| Shared hex Node↔Rust golden lock | shared | **TODO** confirm on main |
| Ed25519 claim-only key in vault | ops | **TODO** |
| Neon/Render `mint_jobs` | ops | **TODO** (#281 SQL) |
| HTTP issuer endpoint | later | **NO** until testnet+revoke proven |
| #310 live mint lock | both | **KEEP** |
| xArt-ID pHash candidate | ChatGPT #326 | Done (candidate only) |
| xArt-ID file decode + C2PA | #324 | **TODO** |

See `CLAIM_VM_VS_TESTNET_GATES_2026-11-03.md`.
