# Agent de Voyage

**Pack id :** `voyage` · **list** ~14 € · corridor 9–22 €  
**Route UI :** `/#/agents/voyage`  
**Données :** `data/voyage_agent.json`

## Rôle v1 (paper)

- Signaux destinations / saisonnalité
- Corrélation crypto × tourisme (lecture)
- Veille RWA hospitality / culture
- Soft bias LIA (poids plafonné ~12 %, jamais exécution auto)

## Hors scope v1

- Réservation hôtel / vol réelle
- Custodie fonds voyage
- Assurance voyage

## Intégration

| Couche | Fichier |
|--------|--------|
| Config packs | `apps/frontend/src/config/agentPacks.ts` |
| Panel | `VoyageAgentPanel.tsx` |
| Page | `VoyageAgentPage.tsx` |
| Intent ⌘K | `intentParser` → `VIEW_VOYAGE` |
| Catalogue SC (pending) | `agents_catalog.json` → `lia-voyage-01` |

Après deploy SC : mint NFT pack Voyage comme Pulse/Yield/Sentinel.
