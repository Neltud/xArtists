# Vellum workflow map (public — no secrets)

Secrets (PEM, HMAC, API keys) stay **only** in Vellum vault. This doc maps **public repo modules** to secret workflows.

## Workflow A — Paper brain (every few minutes)

```bash
git pull origin main
export PYTHONPATH=. CHAIN=1 LIA_LIVE_TRADING=0
python -m lia.vellum.production_run
python -m lia.vellum.dapp_sync
```

| Phase | Module | Output |
|-------|--------|--------|
| gates | `lia.security.go_live_gates` | `go_live_gates.json` |
| pipeline | `lia.vellum.pipeline` | board, oracle, desk, **guardian** |
| compounding | `lia.compounding` | `compounding_echelons.json` |
| signals | `lia.signals.fusion` | `lia_signal_fusion.json` |
| pretrade | `lia.signals.pretrade_gate` | `lia_pretrade_gate.json` |
| brain | `lia.brain.cycle` | `lia_brain_cycle.json` |
| paper_leg | `lia.executor.paper_with_proof` | `lia_paper_legs.json` |
| dapp_sync | `lia.vellum.dapp_sync` | `vellum_dapp_map.json` |
| grok_mcp | `lia.vellum.grok_mcp_ingest` | `cross_score.json` |
| mirror | `publish_data_for_frontend` | `public/data/*` |

**No PEM required.**

## Workflow B — DecisionProof demo

```bash
PYTHONPATH=. python -m lia.intent.decision_proof
PYTHONPATH=. python -m lia.executor.paper_with_proof
```

Optional: `LIA_AGENT_HMAC_SECRET` for non-paper signature mark (still not live TX).

## Workflow C — Deploy SC (rare, manual)

Secrets: `LIA_WALLET_PEM`, `VELLUM_DEPLOY_SCS=1`, `CHAIN=1`  
Module: `lia.vellum.deploy_scs_node`  
Then: verify codeHash on-chain → update `data/contracts.json` addresses only → never commit PEM.

## Workflow D — Micro-live (later)

Only if `go_live_gates.allow_live_trading == true` + micro-proofs + Guardian ARMED + PEM LIA ops.  
User wallets never used for LIA ops TX.

## Frontend mapping

| UI | Data |
|----|------|
| Trading BrainCyclePanel | `lia_brain_cycle.json` |
| PaperLegsPanel | `lia_paper_legs.json` |
| SignalsFusionPanel | `lia_signal_fusion.json` |
| CompoundingPanel | `compounding_echelons.json` |
| SignalTicker | `signal_ticker.json` |
| Guardian / Commander | `lia_v6_status.json` |
| CrossAgentPanel | `cross_score.json` |
| dApp route map | `vellum_dapp_map.json` |

See **[VELLUM_DAPP_SYNC.md](./VELLUM_DAPP_SYNC.md)** for full page ↔ Guardian ↔ sign matrix.

## Doctrine

- Paper-first · fail-closed gates · DecisionProof = commitment not SNARK until real circuit
- One live orchestrator at a time (prefer `production_run` as master cadence)
- **User TxShell** signs marketplace/studio/wallet; **LIA PEM** only in Vellum vault for ops
