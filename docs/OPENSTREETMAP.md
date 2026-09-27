# OpenStreetMap & Mapbox dans xArtists

## Couches

| Couche | Techno | Fichier |
|--------|--------|--------|
| Tuiles OSM / CARTO / topo | Leaflet | `ArtWorldMap.tsx` |
| POI live Overpass | `osmOverpass.ts` | cache session + localStorage |
| Match → salle virtuelle | `osmMuseumMatch.ts` | Louvre, Orsay, … |
| Mapbox GL (option) | CDN + `VITE_MAPBOX_TOKEN` | `MapboxArtMap.tsx` |
| Catalogue OSM offline | Akash indexer | `deploy/akash/indexer/osmCatalog.mjs` |

## Cache Overpass

```ts
import { configureOsmCache, clearOsmCache } from './osmOverpass'

configureOsmCache({
  sessionTtlMs: 30 * 60 * 1000,  // 30 min
  localTtlMs: 24 * 60 * 60 * 1000, // 24 h
  quantizeDeg: 0.05,
  maxPois: 80,
  minZoom: 10,
  maxBboxAreaDeg2: 4,
})
```

- **sessionStorage** : TTL court (navigation)
- **localStorage** : TTL 24 h (retour visite)
- `clearOsmCache()` pour invalider

## Matcher OSM → musée virtuel

`matchOsmToVirtualMuseum(poi)` :

1. Nom exact / inclusion
2. Aliases catalogue
3. Overlap tokens (≥ 0.55)
4. Ville → `museumIdForCity`

Popup / Mapbox : bouton **Entrer · {musée}** → `setTravelDestination` + `/museum?museum=`

## Mapbox GL JS

1. Secret Pages : `VITE_MAPBOX_TOKEN=pk.…`
2. Monter `<MapboxArtMap />` (ex. onglet Tours)
3. Sans token → message + rester sur Leaflet

## Indexeur Akash OSM offline

Voir `deploy/akash/indexer/osmCatalog.mjs` + `worker.osm-patch.md`.

`GET /osm-catalog` matérialise Paris, London, NYC, Tokyo, Amsterdam (extensible via `OSM_BBOXES`).

## Licence

© OpenStreetMap contributors — [ODbL](https://opendatacommons.org/licenses/odbl/).
