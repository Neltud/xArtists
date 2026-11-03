# claimPack — binding voucher domain to runtime chain (#328)

**Status:** design / gate language. Contract still **not deployed**.

## Proven today

| Layer | Evidence |
|-------|----------|
| Public gateways | Network id `T` (testnet) and `1` (mainnet) observed read-only (#327) |
| Codec Node | `chain_id ∈ {1,T,D}` encoded in voucher preimage |
| SC prototype | Compiles literal domain byte `T` into signature message |
| VM tests | Local scenarios; **not** a proof of which chain the WASM will run on |

## Gap (#328)

Hardcoding `T` in the preimage proves the **signer intended testnet**.  
It does **not** prove the **execution environment** is MultiversX testnet.  
A binary built for testnet could still be deployed on another network if ops fail open.

## Options before human-signed testnet deploy

### A — Ops control (minimum, required anyway)
- Separate deployer keys per network  
- CI/CD refuses mainnet endpoint for this artifact  
- Human checklist: explorer network badge = testnet before first tx  

### B — SC constructor freeze
- `init(network_tag: u8)` stores allowed tag once  
- `claimPack` requires `network_tag == b'T'` (or matches voucher byte)  
- Still does not read a “cosmic” chain id from the VM if the framework does not expose one  

### C — Framework / runtime identity (preferred if available in 0.66.x)
- Prefer an official API that returns the chain identifier the node believes it is on  
- Reject claim if runtime ≠ voucher chain byte  
- Document exact API + version; do not invent a fake opcode  

### D — Separate codehashes
- Distinct WASM / codehash for testnet vs mainnet builds  
- Mainnet never stores the testnet codehash in governance allowlists  

## GO criteria for “testnet deploy”

1. Option A checklist signed by human, **including independent, testnet-specific owner and claim-only signer identities**, no secrets in repo/CI, plus a post-deployment bytecode and network check.  
2. **Crypto-level on-chain chain binding:** require C if the available framework/VM can attest runtime chain identity. If C is unavailable, escalate to independent security review and an explicit documented exception/modified protocol; **A+B or A+D do not independently prove the chain**, and are not interchangeable with C.  
3. B is a useful immutable configuration assertion only; an attacker or accidental operator can set the same `T` in a copied contract on another chain. D enables auditing bytecode policy only; the code hash alone does not bind the execution network. Neither should silently clear issue #328.  
4. After a separately approved testnet-only deployment, prove network badge + tx chainID, contract address, code hash, owner, initial paused state, signer epoch, allowed NFT collection and local role, NFT receipt and anti-replay from the actual public testnet.  
5. Still **NO** commercial checkout, PayBox-based issuer, mainnet mint, or automatic authenticity certification.  

ChatGPT leads SC changes; Grok owns this gate language + Node cross-chain encode tests.

## Threat model and acceptance boundary

A malicious or accidental deployment to another MultiversX network can
reproduce the same **WASM, address and verification key**. The contract
rebuilds the voucher with its own hardcoded `T`, so it can accept a
testnet-authorized signature **without knowing its runtime network**.
Cross-chain Node encoder inequality tests alone do not catch this copy.

Do **not** infer a runtime chain ID API from a block header, external
gateway config, SDK transaction chainID or an `init(network_tag)` argument.
No verified runtime getter is currently established for this contract
using `multiversx-sc = 0.66.2`; issue #328 stays a hard release gate.
The existing read-only public probe, CI build hash and off-chain test
vectors are necessary **preflight evidence, never sufficient deployment
authorization**.

If a VM getter is unavailable, investigate alternative voucher V2
deployment-specific commitments (e.g. genesis-bound domain data under a
separate trust model) and validate their threat model independently.
Even a deployment-specific init value supplied only by an operator
is not, on its own, unforgeable evidence of the network.

**State now:** review/design only, SC source remains not deployed.

## Contract code hash vs build checksum

MultiversX computes a deployed contract `codeHash` using **BLAKE2b-256** of
the WASM bytes. It is **not** the SHA-256 artifact checksum printed by
the GitHub Actions offline build (#327). To corroborate a future
testnet deployment, independently compute `b2sum -l 256` over the
reviewed WASM and compare against the on-chain `codeHash` decoded
from base64, then additionally match owner, address and deployment
transaction on the **testnet** explorer.

Reference: [MultiversX reproducible contract builds](https://docs.multiversx.com/developers/reproducible-contract-builds/).
A matching BLAKE2b codeHash confirms bytecode identity only. It does
not certify the network where the VM is running and does not remove
the #328 blocker.
