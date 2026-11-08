# Genesis Pulse #005 — owner-only mint proof gate

**State: NO-GO / DRAFT.** The new owner-only endpoint is NOT deployed or invoked. Do not use public checkout or ask someone to transfer EGLD to trigger a mint.

The on-chain `mintGenesisPulse005` validates the exact Pulse collection, owner, recipient, one-shot marker, nonce == 5, four CIDv1 base32 directory paths, and 32-byte declared metadata hash. This syntax guard **does not query IPFS or prove that a CID is pinned**. It cannot independently attest ownership of the original media or legal transfer.

## Required before contract review and mainnet upgrade

1. Obtain rights-cleared exact image recto, verso, animation MP4 and canonical metadata JSON as byte-stable files. Manually confirm that NFT rights statements match the artist's licence.
2. Hash each file SHA-256. Pin all four to durable IPFS. Record each returned CID, provider receipt and full exact `ipfs://bafy.../<filename>` URI.
3. Read each file back through **two independent gateways** and compare bytes/hash. Confirm persistent independent pin redundancy, not only a single gateway cache.
4. Validate that `metadata_sha256` passed on-chain is the raw 32-byte SHA-256 of exactly the same `metadata.json` previously read back.
5. Independently check current mainnet contract address/codehash/owner, collection `XAIPLS-2cf72b`, nonce allocation (1–4 issued, no #005), ESDT NFTCreate local role, wallet balance and network chain ID.
6. Audit and simulate the contract **upgrade** against the current deployed state, then reproduce all scenario tests: missing create role, incorrect nonce, wrong caller, malformed CID, replay, failed transfer, atomic rollback. Require explicit independent reviewer sign-off.
7. Obtain explicit owner-wallet approval for the exact upgrade call, then the exact media mint call (recipient, hashes, URIs, gas and fees). No automated transaction submission or custodial key.
8. After mainnet finality, verify NFT nonce 5, recipient ownership, URI ordering, metadata and event with MultiversX Explorer/API. Capture transaction hashes and block height.

**Fail-closed:** if any step is missing, do not assert pin permanence, NFT mint, marketplace listing or delivery. This document is a release condition, not an authorization.


## Point-in-time MAINNET READ-ONLY verification — 2026-11-08

Observed on the public `api.multiversx.com` index (not a signed owner transaction):

| Fact | Read-only result |
|---|---|
| Collection | `XAIPLS-2cf72b` |
| Collection owner | `erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g` |
| NFT creator SC | `erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg` |
| Collection role at SC | `ESDTRoleNFTCreate` / `canCreate:true` |
| SC codeHash currently indexed | `igm9oUpgad+QO2cQqhphuLZuicEBNR7jdcQHk8YEe00=` |
| Indexed NFT nonces | 1, 2, 3, 4 only (four NFTs returned; their URIs are empty strings) |
| NFT nonce 5 lookup | HTTP 404 at time of query; **not proof of permanent absence** |
| Source commit containing new #005 endpoint | **NOT** deployed / not matched to the current codeHash |

Operator repeatable read-only evidence endpoints:
- `https://api.multiversx.com/accounts/erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg`
- `https://api.multiversx.com/accounts/erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg/roles/collections/XAIPLS-2cf72b`
- `https://api.multiversx.com/collections/XAIPLS-2cf72b/nfts?size=10`
- `https://api.multiversx.com/nfts/XAIPLS-2cf72b-05`

**Improved GO interpretation:** the creator role and four indexed NFT nonces are now provisionally corroborated, but this **does not** establish future nonce availability, deployed code upgrade safety, CIDs, artist signed authorization, or successful delivery. Re-run the same sources with block height and independent gateway at the moment of any proposed mainnet transaction. Never automatically upgrade or mint from this report.


## Exact-byte dual-gateway preflight tool (2026-11-08)

A new fail-closed, **read-only** script is available at
`contracts/agents-marketplace/scripts/pulse005_ipfs_readback.mjs`
with unit coverage at `contracts/agents-marketplace/tests/pulse005_ipfs_readback.test.mjs`.

Provide a local JSON manifest that names exactly four final source files
(`recto.png`, `verso.png`, `animation.mp4`, `metadata.json`), each with a
real **CIDv1 DAG-PB SHA2-256 directory root CID** and the source file's
64-character lowercase SHA-256 hex. Avoid copying example/test CIDs into live metadata.

Example invocation **after actual pinning**, from the owner-controlled workstation:

```bash
node contracts/agents-marketplace/scripts/pulse005_ipfs_readback.mjs \
  --manifest /secure/pulse005-manifest.json \
  --directory /secure/pulse005-final \
  --gateway https://gateway-one.example/ipfs \
  --gateway https://gateway-two.example/ipfs
```

The example gateway names are placeholders, **not real gateways**.
Select two truly independent real gateways with valid HTTPS endpoints, and audit
their operators; two different hostnames are not sufficient proof of
independent infrastructure.

The script validates CID structure, source file hash and size, metadata JSON
syntax, and byte-for-byte equality of every file via both gateways. It rejects
a deceptive HTML 200 page, missing bytes, differing hashes or reused gateway
hosts. It does not pin anything, verify IPFS pin permanence, authorize a
MultiversX upgrade, grant rights, or sign/mint a token.

A successful real run must be accompanied by both providers' **pin receipts**
and time-stamped independent reads. Any source change invalidates the manifest,
metadata hash, proof and owner transaction preflight. Use the raw decoded
32-byte metadata SHA-256 value for the future smart contract call; do not pass
the literal hex characters.
