# Phase 6.5 — Decision chain stress test

**Machine proposes. Human decides. Test logic, not money.**

```bash
PYTHONPATH=. python -m lia.genesis.decision_chain --cycles 5
```

Pipeline: `DECISION_MADE → SIZING_CALCULATED → PAYLOAD_GENERATED → PREFLIGHT_* → PROPOSAL_READY`

- Output: `data/decision_proposals.json` (+ public mirror)
- Black box: `data/decision_chain.log`
- Virtual impact updates `data/decision_shadow_portfolio.json`
- UI: `ProposedActions` (Sign locked while live=0)
