# agents-marketplace — claimPack V1 (design note)

Existing endpoints include `buyPack` (EGLD) and `setPackPrice`.  
**Fiat path must not use `setPackPrice` per sale** (#310 / B+A architecture).

Plan: add `claimPack` + signer registry + `claimed`/`revoked` maps on a **testnet** deployment first, or a dedicated claim SC that only holds collection roles — product decision open, security preference is **minimal surface** and fixed catalogue amounts in EUR cents mirrored on-chain as pack_type enum only (no EGLD price mutation).

See `docs/security/CLAIM_PACK_TESTNET_SPEC_2026-11-03.md`.
