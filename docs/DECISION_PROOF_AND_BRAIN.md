# DecisionProof & LIA Brain modules

## DecisionProof (`lia/intent/decision_proof.py`)

Receipt LIA → exécuteur (Vellum / futur SC).

| Champ | Rôle |
|-------|------|
| decision_id | Anti-replay |
| action_type | 0 SWAP · 1 STAKE · 2 CLAIM · 3 REBALANCE · 4 BRIDGE |
| amount / target_price | Atomic + bound slippage |
| zk_proof | **Commitment hash** (pas un vrai SNARK on-chain) |
| agent_signature | HMAC si `LIA_AGENT_HMAC_SECRET`, sinon marque paper |

Vérification : replay · TTL · commitment · signature → `PaperOnly` ou `Valid` si `allow_live`.

**Live réel** : toujours `go_live_gates` + Guardian + PEM. Ce module ne débloque pas le live seul.

## Brain (`lia/brain/`)

| Module | Rôle |
|--------|------|
| probabilistic | Monte-Carlo EV + P(profit) |
| autotuner | Ajuste vol / latence / gas bias |
| conquest | Arb inter-chaînes net de frais (advisory) |
| portfolio | Exposition + flag rebalance |
| economy | Flux fees → proposition mutation |
| evolutionary | Mutation specialization |
| meta_lia | Predator vs Harvester |
| cycle | Un tour paper → `data/lia_brain_cycle.json` |

## Ops

```bash
PYTHONPATH=. python -m lia.intent.decision_proof
PYTHONPATH=. python -m lia.brain.cycle
# production_run inclut phase soft brain_cycle
```

## SC

Référence : `contracts/decision-proof/types_reference.rs` — pas déployable tel quel.
