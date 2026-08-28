# Vellum Integration Kit — Plug & Play

**Pilier 2 · Alliance**

Vellum = cerveau LIA (service payant). Repo `Neltud/xArtists` = corps (UI, types, doctrine, data).

## Branchement minimal

```
Vellum workflow
  → parse NL → LIP-1 JSON (packages/ ou docs/prompts)
  → POST / validate mirror doctrine rules
  → si paper: log data/lia_trades.json style
  → si live: policy + wallet ops LIA (secrets Vellum only)
Front xArtists
  → lit JSON GitHub Pages
  → IntentBar / useLIA pour parcours user
```

## Artefacts à consommer

| Path | Usage Vellum |
|------|----------------|
| `docs/prompts/LIA_SYSTEM_PROMPT.md` | System prompt |
| `packages/core-protocol/*` | LIP / Guardian types |
| `apps/frontend/src/core/doctrine.ts` | Règles validation |
| `apps/frontend/src/types/intent.ts` | Schéma intent |
| `docs/marketing/VELLUM_SOCIAL_WORKFLOW_SPEC.json` | Social 30m |
| `data/*.json` | Board paper |

## Secrets (vault Vellum uniquement)

- Wallet ops LIA PEM / seed — **jamais** dans le repo
- `X_*` ou Zapier hook pour social
- OpenAI / model keys

## Sync cadence

1. `git pull` main avant run prod Vellum
2. Respecter `LIA_LIVE_*` gates du repo
3. Demo commune : Pages + workflow paper d’abord
