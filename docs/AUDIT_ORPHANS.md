# Audit pages orphelines (2026-09-24)

Fichiers sous `apps/frontend/src/pages/` **non routés** dans `App.tsx`.

| Fichier | Action recommandée |
|---------|-------------------|
| `BitcoinLayer2.tsx` | Legacy — ne pas router tant que scope BTC non prioritaire |
| `BridgeFeesDashboard.tsx` | Legacy bridge fees — garder hors nav |
| `ExplainCards.tsx` | Composant-page démo — optional embed |
| `LandingHero.tsx` | Remplacé par `Dashboard` |
| `PaymentHistory.tsx` | Brancher si Access API checkout history |
| `TipPage.tsx` | Doublon de `Tip.tsx` (route `/tip`) — ne pas router |
| `VoyageAgentPage.tsx` | Redirect déjà `/agents/voyage` → `/tours` |
| `Gallery.tsx` | Redirect `/gallery` → `/museum` |

**Politique :** pas de suppression massive sans revue CEO. SC marketplace/agents restent **OFF** (`scStatus.ts`) jusqu’à checklist `/go-live`.

## Validé dans cet audit
- SiteMap enrichi : `/ads`, `/slot`, `/venues`, `/tip`, `/museum`, `/go-live`
- `ads_active.json` sample `home_hero` + `drop_feature`
- `AdSlot` branché sur Dashboard
- DEMO_MODE = true
