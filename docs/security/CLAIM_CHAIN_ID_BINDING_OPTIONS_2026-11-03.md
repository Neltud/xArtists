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

1. Option A checklist signed by human  
2. At least one of B/C/D implemented and tested  
3. Post-deploy: explorer shows testnet + first claimPack tx + NFT receipt  
4. Still **NO** commercial checkout / mainnet mint  

ChatGPT leads SC changes; Grok owns this gate language + Node cross-chain encode tests.
