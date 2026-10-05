# Capital scaling tiers

| Tier | Mode | Cap | Approval |
|------|------|-----|----------|
| **1 Dust** (current) | Autonomous if flags on | ≤ **0.01 EGLD** / trade | Risk enforcer only |
| **2 Standard** | Autonomous | ≤ **10%** wallet balance | Ops enables tier flag |
| **3 Institutional** | HITL | No fixed % | Human sign every TX |

Default remains Tier 1. Raising tier is an **ops config change**, not automatic.

Hard stops at every tier: NFT ban, daily loss, drawdown %, velocity limits.
