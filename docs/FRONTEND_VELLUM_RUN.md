# Frontend xArtists — prêt prochain run Vellum

## Routes

| Path | Contenu |
|------|---------|
| `/` | Dashboard ops (streak, contrats, budgets stratégies) |
| `/trading` | Router · guards · pipeline · allocation |
| `/portfolio` | Cibles LT 45/30/20 + policy |
| `/marketplace` | SC marketplace + Agents TBD |
| `/dao` | TRO governance |
| `/agents` | LIA + GreenSmoke |
| `/hatom` | Yield rules HF |
| `/tech` | Checklist run · nœuds · env · tokens |

## Données live (JSON public)

Vellum / reporters doivent publier vers `public/data/` (ou `docs/data/` servi en Pages) :

- `lia_compound_streak.json`
- `lia_guards_state.json`
- `lia_router_last.json` (optionnel — sortie OrchestratorRouter)

## Config unique

`src/config/contracts.ts` — wallet LIA, SC, tokens, budgets, guards labels.

## Build

```bash
npm ci && npm run build
```

Basename GitHub Pages: configurer `base` Vite si besoin (`/xArtists/`).
