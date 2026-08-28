# Trinity → Frontend wire

## Fait

| Couche | Fichier |
|--------|--------|
| LIP + Guardian (mirror packages) | `apps/frontend/src/lib/lipBridge.ts` |
| IntentBar states | thinking / success / error + badge Guardian |
| Event | `lia-intent` detail `{ route, lip, guardian }` |

## Packages (source de vérité TS)

`packages/lia-intelligence/parser.ts` · `packages/core-protocol/*`

Le front **duplique** via `lipBridge` pour build Vite sans workspace link. Toute évolution LIP doit synchroniser les deux.

## Pas encore

- Relayer live broadcast
- LLM adapter
- Socket War Room metrics
