# Tranche verticale Pulse + 8008 (Phase 1)

```
pulse-api (FastAPI) → usePulse → xartists:pulse → Musée 3D
                              ↘ agent8008Bridge (PULSE_HYPE si sentiment ≥ 0.55)
```

## Services
- `GET /health` · `GET /pulse` · `WS /ws/pulse`
- Docker: `docker compose up pulse-api`

## Frontend
- `VITE_PULSE_API=https://…` (sinon démo cycle + `data/pulse_state.json`)
- Hook: `usePulse` / `onPulse`
- Musée: écoute unique `xartists:pulse`
- 8008: intent `PULSE_HYPE` paper → journal + webhook Vellum si `VITE_VELLUM_8008_WEBHOOK`

## Dashboard user
- Rewards (daily points scopés adresse)
- Vue packs owned (paper) + liens My Packs / Agents

## Mainnet prep
- SC flags OFF jusqu’à codeHash verify
- PEM hors front / hors Akash
- Points & packs paper ≠ autorisation on-chain
