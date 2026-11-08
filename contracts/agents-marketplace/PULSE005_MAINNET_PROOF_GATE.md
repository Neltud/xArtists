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
