# Command Center — Gatekeeper (Phase 1)

## Dual-layer

| Zone | Route | Access |
|------|-------|--------|
| Museum (public) | `/museum` | **Unchanged** |
| Command Center | `/command-center` | **Agent IA Pack holder** |

## Ownership check

1. `useUserAccount` → NFTs on-chain
2. `matchOnChainPacks` → Pulse / Yield / Sentinel  
   - Collections: `xAiAx`, `xAiAy`, `xAiAs` (or `VITE_AGENT_PACK_COLLECTIONS`)
   - Name heuristics until mint tickers live
3. Paper device: `loadOwnedPacks()` localStorage
4. `setAgentAccess({ hasAgentAccess, packs, source })` in `empireStore`

## Components (extension only)

- `AgentAccessSync` — boot sync
- `AgentIA_Guard` — wrapper Access Denied / children
- `CommandCenterPage` — hub + rooms
- `ProjectionBridge` + `CommandWall` — canvas → THREE texture (no html2canvas)

## Security

- No PEM in browser
- Gate is UX + route; on-chain enforcement remains SC mint/roles when packs live
- Paper access is device-local (demo) — not a financial claim

## Ops

```bash
# optional: force collection match
VITE_AGENT_PACK_COLLECTIONS=xAiAx-xxxxxx,xAiAy-xxxxxx,xAiAs-xxxxxx
```
