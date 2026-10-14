# agents-marketplace — mainnet status snapshot

**Queried:** 2026-10-14 (API MultiversX)

| Field | Value |
|-------|--------|
| Address | `erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg` |
| codeHash (live) | `tDIcnNMbDG5E7tpb7NTeJDnT6JxKs7faN7hyCALFUWs=` |
| Owner | `erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g` |
| `buyPack` | **not found** (pre-upgrade bytecode) |
| `getPackPrice` / `getPackCollection` | **not found** |
| Collections `xAiAx` / `xAiAy` / `xAiAs` | **not found** on mainnet search |

## Required before E2E mint works

1. Local build + upgrade with **owner PEM** (`scripts/upgrade-agents-marketplace.sh`)
2. Issue 3 NFT collections (or use existing full IDs)
3. Grant `ESDTRoleNFTCreate` on each collection **to the SC address**
4. `setPackCollection` + `setPackPrice` for pack types 1/2/3
5. `buyPack` test → NFT visible on admin `erd1mmh2j5y8esv2tmmyeau3hr4xa2u2te3zc3j9wumn3v5vm8uvsczqnucj5l`
6. Set dApp env `VITE_AGENTS_CODEHASH_OK` + `VITE_AGENT_PACK_COLLECTIONS`

Source with `buyPack`: `contracts/agents-marketplace/src/lib.rs` (main).  
Runbook: `BUY_PACK_UPGRADE.md` · script: `scripts/upgrade-agents-marketplace.sh`
