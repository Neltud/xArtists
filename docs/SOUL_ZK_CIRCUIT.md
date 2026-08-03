# Soul zk proof circuit — configuration

## Status

**Configured, disabled.** No live prover/verifier. Safe for production MVX builds.

## Config file

`config/soul_zk_circuit.json`

| Key | Meaning |
|-----|--------|
| `scheme.primary` | groth16 (bn254) default |
| `prover.enabled` | false until endpoint ready |
| `verifier.address` | null → set `erd1…` after SC deploy |
| `circuits.credit` | score ≥ threshold without revealing score |
| `circuits.restake` | position commitment |
| `circuits.eligibility` | merkle / soulbound cohort |
| `gates.size_boost_max` | 1.5× size if proof valid |
| `nullifier_store` | `data/soul_zk_nullifiers.json` |

## Env overrides (Vellum secrets)

```bash
export SOUL_ZK_PROVER_ENABLED=0          # 1 only when prover live
export SOUL_ZK_VERIFIER_ADDRESS=         # erd1… verifier SC
```

## Pipeline

```text
build_proof_request(subject, claim_type, amount)
  → public_inputs + commitment + nullifier
  → [off-chain prover] proof_bytes_hex
verify_pipeline(proof, subject, claim_type)
  → encoding check → nullifier replay → (future) SC verifyProof
  → gate_size_with_zk / yield unlock
record_nullifier(nf)  # after successful on-chain verify
```

## Claims

| claim_type | Circuit id | Use |
|------------|------------|-----|
| `credit` | soul_credit_v1 | Size boost / agent gate |
| `restake` | soul_restake_v1 | Yield sleeve unlock |
| `eligibility` | soul_elig_v1 | Limited agent pack access |

## Activation checklist

1. Audit circuit + trusted setup (if groth16)
2. Deploy verifier SC on MultiversX mainnet
3. Set `verifier.address` + env
4. Prover endpoint + `SOUL_ZK_PROVER_ENABLED=1`
5. Integration test on micro size only
6. Wire `mvx_agent` optional boost via `gate_size_with_zk`

## Code

```bash
python -m lia.venues.soul_zk
```

Module: `lia/venues/soul_zk.py`
