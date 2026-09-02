# Master Protocol → Vite mapping (xArtists)

**Rule:** implement on `apps/frontend` (Vite + React Router + sdk-dapp).  
Do **not** migrate to Next.js / Wagmi for GH Pages continuity.

| Protocol task | Vite / monorepo equivalent | Status |
|---------------|----------------------------|--------|
| **T1 Guardian** | `lia/guardian/preflight.py`, `math_core.py`, `spiral.py`, `kill_reset.py` | ✅ |
| **T2 Treasury Splitter** | `contracts/treasury-splitter` + `scripts/deploy_treasury_splitter.sh` 40/30/20/10 | ✅ code · ⏳ deploy |
| **T3 RWA Escrow** | `contracts/rwa-escrow-bridge` + docs | ✅ code · experimental |
| **T4 Shell + Guardian UI** | `App.tsx` + `GuardianStatusBar` + `store/riskStore.ts` + Commander | ✅ |
| **T5 Commander Dashboard** | `Dashboard` + `commander/*` + fast/slow hooks | ✅ base |
| **T6 Transparency** | `/tro` `/dao` + `TreasurySplitViz` · burn feed TBD | ⚠️ partial |
| **T7 RWA Marketplace** | `Marketplace` + `EscrowTimeline` · SC empty | ⚠️ |

## State map

| Protocol | Vite |
|----------|------|
| useRiskStore | `store/riskStore.ts` |
| useLIAStore | `useLiaFastPath` / `useLiaSlowPath` |
| useUserStore | `WalletContext` |

Real-time v1 = JSON poll; `setRiskState` ready for WS later.
