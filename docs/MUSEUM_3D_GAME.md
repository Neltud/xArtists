---
hidden: true
noIndex: true
---

# Musée 3D · architecture par lieu · galerie-jeu

## Réponse courte

**Oui** — [`blend-glade-wolf-grove`](https://github.com/Neltud/blend-glade-wolf-grove) construit **chaque bâtiment** (plan + volume).\
**xArtists** charge le plan, **place les œuvres**, gère **déplacement + interaction** (inspection ; achat sur la Marketplace après vérification mainnet).

```
Studio (plans uniques)
   ↓ Export JSON (RoomBlueprint + artAnchors)
public/blueprints/*.json
   ↓ loadBlueprint(museumId)
Galerie 3D (Three.js · secours CSS) + œuvres + WASD/touch
```

## Rôles

| Repo                       | Responsabilité                                                                 |
| -------------------------- | ------------------------------------------------------------------------------ |
| **blend-glade-wolf-grove** | Dessin murs/portes/fenêtres, volume R3F, samples musée, **Export JSON**        |
| **xArtists**               | Carte monde, catalogue œuvres, wallet, déplacement, inspect, accès Marketplace |

## Workflow pour un musée

1. Ouvrir le studio → modèle **Grande Galerie / Nef / Cabinet / Rotonde / Cyber** (ou tracer).
2. **Export JSON → xArtists** (télécharge `*-blueprint.json` avec `artAnchors`).
3. Copier vers `apps/frontend/public/blueprints/{id}.json`.
4. Lier dans `MUSEUM_BLUEPRINT_REF` (déjà fait pour les lieux majeurs).
5. La page Galerie charge le blueprint + œuvres du lieu + déplacement.

## Mapping

| Musée               | Blueprint          | Layout CSS fallback |
| ------------------- | ------------------ | ------------------- |
| Louvre / Prado / NG | `gallery-corridor` | grand\_corridor     |
| Orsay / Met         | `glass-nave`       | glass\_nave         |
| Rijks / Mauritshuis | `cabinet`          | cabinet             |
| Uffizi              | `rotunda`          | rotunda             |
| xArtists            | `cyber-grid`       | cyber\_grid         |

## Interaction (déjà / à venir)

* **Déjà** : WASD / pad tactile, regard, inspect œuvre, accès Marketplace, preload images.
* **Moteur actif** : `MuseumWebGLHallLive.tsx` (Three.js) et `MuseumBlueprintRoom.tsx` (secours CSS).
* **Art World (PR #639)** : sept espaces distincts, défi de découverte, carnet sauvegardé localement. Pas de monde ouvert continu ni de synchronisation serveur.

## Fichiers clés

**Studio**

* `src/lib/plan/export.ts` — `toRoomBlueprint` + `downloadPlanJson`
* `src/lib/plan/museum-samples.ts` — plans musée
* Chrome : bouton **Export JSON → xArtists**

**xArtists**

* `apps/frontend/src/lib/roomBlueprint.ts`
* `apps/frontend/src/lib/loadBlueprint.ts`
* `apps/frontend/src/lib/museumLayouts.ts` (fallback CSS)
* `MuseumHall.tsx` — sélection du moteur et repli
* `MuseumWebGLHallLive.tsx` — déplacement et rendu WebGL
* `MuseumBlueprintRoom.tsx` — secours CSS
* `artWorldProgress.mjs` — progression locale sans valeur financière
