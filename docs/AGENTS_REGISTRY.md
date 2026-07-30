# Agents registry — xArtists (internal + external)

## Internal (dApp / LIA / Vellum)

| Agent | Role | Code / location |
|-------|------|------------------|
| **LIA** | Orchestrateur DeFi (Hatom, swaps, risk) | Vellum + `lia/executor/universal_executor.py` |
| **GreenSmoke Consumer** | Forecasts → signaux | `lia/agents/green_smoke_consumer.py` |
| **PolyLIA** | Prediction markets paper/live | `poly-lia/` + `/agents/polylia` |
| **RewardsAgent** | Distribution rewards stake | `nodes/rewards_agent.py` |
| **Swarm Yield** | Idle USDC → Hatom | `nodes/swarm_yield.py` |
| **Swarm Risk** | Veto HF / circuit breaker | `nodes/swarm_risk.py` |
| **Swarm Macro / Bull / Bear / Contrarian** | Décision multi-voix | `nodes/swarm_*.py` |
| **Swarm Aggregator** | Consensus | `nodes/swarm_aggregator.py` |

## GreenSmoke (external brains, consumed on-chain + JSON)

Lia, Macro, Politics, Tech, Sport, Liia — `public/data/greensmoke_forecasts.json` + SC GreenSmokeNetwork.

## External protocols (not our agents, LIA interacts)

| Protocol | Instruments |
|----------|-------------|
| **Hatom** | supply / borrow / collateral |
| **xExchange / jExchange** | swap / LP |
| **Xoxno** | NFT market |
| **Soul** | liquidity testnet only |
| **Burnify** | burn TRO/NFT → rewards (partner) |
| **Polymarket** | prediction (PolyLIA) |

## UI pages

- `/agents` — colony view
- `/agents/polylia` — PolyLIA dashboard
- `/hatom`, `/trading`, `/staking`, `/burnify`, `/soul-testnet`
