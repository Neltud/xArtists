# Public light-first & truthful pack signals — 2026-11-06

## Decision / deployment gate

**Paper-first / fail-closed.** Public signals are **unavailable** unless an independently verified, source-timestamped read-only producer exists. No change to payment, minting, relayer, DAO permissions or `VITE_LIA_LIVE_TRADING`. No evidence of autonomous live trading is claimed.

## Root causes and exact files

| Source | Previously displayed | Remediation |
| --- | --- | --- |
| `apps/frontend/src/components/lia/holoRenderers.ts` | Pulse fabricated TPS/latency and Pulse Index using time-based waves; Yield fabricated candle movement and APR; Sentinel fabricated SHA/ZK scores | Now static, inert, explicit UNVERIFIED panels |
| `apps/frontend/src/components/lia/LiaHubControlRoom.tsx` | Three.js canvas + continuous 30 FPS redraw | Replaced with static `HoloDataRoom` cards |
| `apps/frontend/src/components/lia/LiaHubControlRoomLazy.tsx` | Optional entry to those animated panels | Immersive scene suspended; timestamped 2D snapshots remain |
| `apps/frontend/src/hooks/usePulse.ts` + `apps/frontend/src/lib/pulseDemo.ts` | 8-second browser demo rotation emitted `xartists:pulse` and global Pulse state | Hook returns unavailable neutral compatibility state; emits no events |
| `services/pulse-api/main.py` | 8-second server-side fixture rotation | JSON payloads explicitly include `source: simulated`, `verified: false`, `demo: true`; public UI does not consume |
| `apps/frontend/src/components/PulseStrip.tsx` | Pulsing dot and fake sentiment percentage | Static unavailable |
| `apps/frontend/src/command-center/CommandWall.tsx` + `pages/CommandCenterPage.tsx` | Preset sentiment and volatility per pack + derived volume proxy | Static missing-data status |
| `apps/frontend/src/command-center/MarketTape.tsx` | Locally created paper ticks every 4.2 seconds | Static disclosure |
| `apps/frontend/src/command-center/AgentNftOrb.tsx` | Scanning aura and unverified staking indication | Static pack identity |
| `apps/frontend/src/command-center/DashboardSource.tsx` | Bull/bear classification inferred from synthetic Pulse | Source unavailable |
| `apps/frontend/src/lib/agent8008Bridge.ts` | Demo Pulse could create paper `PULSE_HYPE` intents | Subscriber removed |
| `apps/frontend/src/components/museum/museumPulseBind.ts` + `lib/pulseMuseum.ts` | Demo driven museum atmospheric values | Event subscription removed; fetch returns no verified signal |

Existing `HoloDataRoom`, `PackAgentMonitor`, `Pack3DCockpit` and `GenesisPackShelf` already supported static paper-first disclosures; kept intact.

## Theme and public design

`apps/frontend/index.html` sets light as default and reads only a saved, explicit dark preference before Vite/React; inline critical backgrounds prevent a light/dark repaint flash. `experience/state.tsx` preserves the accessible header/mobile toggle. `experience/public-finish.css` gives the first-visit home a white/off-white, dark-typography, premium layout with calm transitions disabled for reduced-motion users.

## Future verification contract (required before any animation returns)

1. Read-only API with explicit source identity, evidence link, signed/authenticated producer, chain/network/agent identity, measurement name, unit and source timestamp. Do not use client `Date.now()` as the producer timestamp.
2. Age/TTL checks and error states; fail closed on null, stale, untrusted, wrong-network or structurally invalid data. A merely reachable HTTP server does not establish data authenticity.
3. Independent mapping of each visual variable to its source metric, with no invented fallback samples, volume, APR, profitability, buy/sell order, SHA success or ZK compliance.
4. Re-enable only with automated tests confirming that fabricated data cannot generate bus events, browser intents or apparent agent execution.
5. `$TRO` governance voting power is proportional to **staked $TRO**; liquidity pairs/chains are a strategy vision, not proof of live pools. NFT / $TRO operations for agents remain subject to DAO permissions and separate transaction approval. No live trading promise.

## Checks

Source-level checks: 9/9 pass in connector inspection. `apps/frontend/tests/public-fail-closed-signals.test.mjs` and updated `lia-public-first.test.mjs` provide regressions. Full frontend typecheck, build, browser accessibility and deployment smoke must pass CI before merge or any production claim.
