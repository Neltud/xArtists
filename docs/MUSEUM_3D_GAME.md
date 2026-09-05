# Musée 3D · architecture par lieu · galerie-jeu

## Réponse courte

**Oui** — [`blend-glade-wolf-grove`](https://github.com/Neltud/blend-glade-wolf-grove) construit **chaque bâtiment** (plan + volume).  
**xArtists** charge le plan, **place les œuvres**, gère **déplacement + interaction** (inspect / achat paper).

```
Studio (plans uniques)
   ↓ Export JSON (RoomBlueprint + artAnchors)
public/blueprints/*.json
   ↓ loadBlueprint(museumId)
Galerie 3D (CSS v1 · R3F v2) + œuvres + WASD/touch
```

## Rôles

| Repo | Responsabilité |
|------|----------------|
| **blend-glade-wolf-grove** | Dessin murs/portes/fenêtres, volume R3F, samples musée, **Export JSON** |
| **xArtists** | Carte monde, catalogue œuvres, wallet, déplacement, inspect, intention d’achat |

## Workflow pour un musée

1. Ouvrir le studio → modèle **Grande Galerie / Nef / Cabinet / Rotonde / Cyber** (ou tracer).
2. **Export JSON → xArtists** (télécharge `*-blueprint.json` avec `artAnchors`).
3. Copier vers `apps/frontend/public/blueprints/{id}.json`.
4. Lier dans `MUSEUM_BLUEPRINT_REF` (déjà fait pour les lieux majeurs).
5. La page Galerie charge le blueprint + œuvres du lieu + déplacement.

## Mapping

| Musée | Blueprint | Layout CSS fallback |
|-------|-----------|---------------------|
| Louvre / Prado / NG | `gallery-corridor` | grand_corridor |
| Orsay / Met | `glass-nave` | glass_nave |
| Rijks / Mauritshuis | `cabinet` | cabinet |
| Uffizi | `rotunda` | rotunda |
| xArtists | `cyber-grid` | cyber_grid |

## Interaction (déjà / à venir)

- **Déjà** : WASD / pad tactile, regard, inspect œuvre, intention d’achat paper, preload images.
- **V2** : collision sur polygone `rooms`, ancrages `artAnchors` pour position mur exacte, rendu R3F optionnel du même `FloorPlan`.
- **V3 jeu** : missions, score, multi-salles dans un même plan.

## Fichiers clés

**Studio**
- `src/lib/plan/export.ts` — `toRoomBlueprint` + `downloadPlanJson`
- `src/lib/plan/museum-samples.ts` — plans musée
- Chrome : bouton **Export JSON → xArtists**

**xArtists**
- `apps/frontend/src/lib/roomBlueprint.ts`
- `apps/frontend/src/lib/loadBlueprint.ts`
- `apps/frontend/src/lib/museumLayouts.ts` (fallback CSS)
- `MuseumGameHall.tsx` — gameplay visite
