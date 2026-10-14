# agents-marketplace — mainnet status

**Updated:** 2026-10-14 after CI run [#38578412565](https://github.com/Neltud/xArtists/actions/runs/38578412565)

## Upgrade — SUCCESS

| Field | Value |
|-------|--------|
| Address | `erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg` |
| **Upgrade TX** | [`3e400b5132314cd55f050e14918c03cbd4ef5c3fd32da1f10a88f3d7db08021a`](https://explorer.multiversx.com/transactions/3e400b5132314cd55f050e14918c03cbd4ef5c3fd32da1f10a88f3d7db08021a) |
| **codeHash (new)** | `igm9oUpgad+QO2cQqhphuLZuicEBNR7jdcQHk8YEe00=` |
| codeHash (old) | `tDIcnNMbDG5E7tpb7NTeJDnT6JxKs7faN7hyCALFUWs=` |
| Owner | `erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g` |

### Endpoints live

| Function | Status |
|----------|--------|
| `getPackPrice(01/02/03)` | **ok** — 1 / 2 / 3 EGLD |
| `getPackCollection` | **ok** but empty (not configured) |
| `buyPack` | exists — reverts `pack collection not configured` |
| `isPaused` / `getOwner` / `getFeeBps` | ok |

## Blockers for mint (B / C)

1. **Collections not issued** — no `xAiAx` / `xAiAy` / `xAiAs` on mainnet search.
2. After issue: grant **`ESDTRoleNFTCreate`** to the SC on each collection.
3. `setPackCollection` via workflow inputs `col_pulse` / `col_yield` / `col_sentinel` or mxpy.
4. Then `buyPack@01` with value ≥ 1 EGLD.

Admin wallet for verification: `erd1mmh2j5y8esv2tmmyeau3hr4xa2u2te3zc3j9wumn3v5vm8uvsczqnucj5l`

## dApp env (after collections exist)

```bash
VITE_AGENTS_CODEHASH_OK=true
VITE_AGENT_PACK_COLLECTIONS=<pulse-id>,<yield-id>,<sentinel-id>
```

Runbook: `BUY_PACK_UPGRADE.md` · CI: `.github/workflows/deploy-agents-marketplace.yml`
