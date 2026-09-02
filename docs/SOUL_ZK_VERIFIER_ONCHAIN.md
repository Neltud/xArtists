# Soul zk verifier on-chain + Halo2

## Honest scope

| Phase | What |
|-------|------|
| **Phase 1 (implemented)** | SC `soul-zk-verifier`: scheme Halo2/Groth16, `vk_hash`, **nullifiers**, structural proof bounds, **attestor** cosign |
| **Phase 2 (future)** | Full Halo2/Groth16 pairing verify inside SC or precompile |

MultiversX has **no** production Halo2 precompile. Running full Halo2 verify in a user SC is not practical today. Phase 1 = **cryptography off-chain (Halo2 prover) + on-chain anti-replay + attestor gate**.

## Contract

`contracts/soul-zk-verifier`

| Endpoint | Role |
|----------|------|
| `init(scheme)` | 1 = Halo2, 2 = Groth16 |
| `setVkHash` | SHA-256 (or circuit id hash) of verifying key |
| `setAttestor` | Address allowed to call `verifyProof` |
| `setAttestationRequired` | default true |
| `verifyProof(proof, commitment, nullifier, claim_type, epoch, subject)` | consumes nullifier, emits event |
| `previewVerify` | view, no state change |

## Halo2 off-chain

`lia/venues/soul_zk_halo2.py`

- Envelope validation (lengths / hex)
- Placeholder proof **for tests only**
- Real prover: set `SOUL_ZK_HALO2_PROVER` path later (ezkl / pse / custom)

## Deploy (mainnet)

```bash
cd contracts/soul-zk-verifier && sc-meta all build
# scheme 1 = Halo2
mxpy contract deploy --bytecode output/*.wasm \\
  --arguments 1 \\
  --pem $PEM --proxy https://gateway.multiversx.com --chain 1 \\
  --gas-limit 200000000 --send

# then
# setVkHash <32-byte-hash>
# setAttestor <prover-relay-erd1>
export SOUL_ZK_VERIFIER_ADDRESS=erd1...
```

## Security

- Attestor key = trust root for Phase 1 — protect like PEM
- Nullifier prevents double-claim
- Pause + 2-step ownership
- Never submit placeholder proofs on mainnet
