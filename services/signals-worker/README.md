# signals-worker

Daily **paper-only** signal generator for xArtists / xOrus.

## Outputs

| File | Role |
| --- | --- |
| `data/signals/daily_signal.json` | Widget-facing daily signal (`schema` v2, backward-compatible fields) |
| `data/signals/daily_dual_reports.json` | Full dual briefs + scores |
| Mirror under `apps/frontend/public/data/signals/` | GitHub Pages static read |

## Safety

- `executable=false`, `live_trading=false`, no mint, no signing
- ChatGPT external weight cap: **15%**
- Sentinel veto remains absolute
- Catalog: **120** signal **definitions**; only evidence-backed IDs are scored as `observed_unverified`

## Run

```bash
python3 services/signals-worker/generate_daily_signal.py
```

Optional LLM polish (narrative only):

```bash
export XORUS_LLM_BRIEFS=1
export XAI_API_KEY=...      # optional Grok polish
export OPENAI_API_KEY=...   # optional ChatGPT polish
python3 services/signals-worker/generate_daily_signal.py
```

Cron: `.github/workflows/daily-signals.yml` at 08:00 UTC.
