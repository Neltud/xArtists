# Commander Layout — Task 1 (Trust Interface)

**Stack réelle :** Vite + React 18 + Tailwind + sdk-dapp. Next.js/Wagmi = migration optionnelle.

## Two-speed data flow

```
SLOW PATH 30–120s  desk_last.json / vellum_last_run  → BrainActivityFeed
FAST PATH 3–8s     lia_v6_status.json guardian/kill  → GuardianKillBadge + RiskMetrics
```

Adaptive poll: healthy 5s fast / 60s slow; on KILL 3s; on error backoff.
AbortController; memoized components; alert aria-live on kill transition.

| State | UI |
|-------|-----|
| ARMED+allow | emerald |
| ARMED+deny | amber |
| TRIPPED | orange |
| KILLED | red pulse |

Components: `CommanderStrip`, `GuardianKillBadge`, `BrainActivityFeed`, `RiskMetricsPanel`
Hooks: `useLiaFastPath`, `useLiaSlowPath`
