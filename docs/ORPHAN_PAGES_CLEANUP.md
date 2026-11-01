# Orphan pages cleanup plan

**Contexte** : ~22 fichiers sous `apps/frontend/src/pages/` non référencés dans `experience/modules.ts`.

## Règle

- Ne pas supprimer en masse sans grep des imports dynamiques.  
- Soft-launch : routes lab restent accessibles par URL ; browse UI filtrée.  

## Candidats archive (`pages/_legacy/`)

| Fichier | Notes |
|---------|--------|
| Agents.tsx / AgentsPage.tsx doublon | Garder celui branché modules (`Agents` path via intelligence/agents) |
| MyPacks.tsx / MyPacksPage.tsx | Idem |
| DAO.tsx / DaoPage.tsx | Idem |
| Portfolio.tsx / PortfolioPage.tsx | Idem |
| Tip.tsx / TipPage.tsx | Idem |
| MarketPage.tsx vs MarketplacePage | modules → MarketplacePage |
| GalleryPage.tsx | alias museum |
| LandingHero.tsx | Home dans experience/Pages |
| SiteMapPage.tsx | Alias directory |
| NotFoundPage.tsx | NotFound in Pages.tsx |
| AgentsPolyliaPage / VoyageAgentPage | redirects PolyLIA |
| SoulTestnetPage / MuseumLabPage | lab |

## Passes

1. **Passe 1 (docs)** — cette liste  
2. **Passe 2** — `rg` imports + déplacer non référencés vers `_legacy`  
3. **Passe 3** — supprimer `_legacy` après 1 sprint sans régression Pages  

**Ne pas faire** dans le même PR qu’un deploy commercial.
