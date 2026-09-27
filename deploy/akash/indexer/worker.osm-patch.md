# Brancher le catalogue OSM offline sur l’indexeur

Dans `worker.mjs` (ou image déployée) :

```js
import { buildOsmOfflineCatalog } from './osmCatalog.mjs'

let osmCatalog = { generatedAt: null, regions: [], totalPois: 0 }

async function refreshOsm() {
  try {
    osmCatalog = await buildOsmOfflineCatalog()
    console.log('OSM offline', osmCatalog.totalPois)
  } catch (e) {
    console.warn('OSM refresh', e)
  }
}

// GET /osm-catalog → osmCatalog
// Cron: setInterval(refreshOsm, 6 * 3600 * 1000) + refreshOsm() au boot
```

Env optionnelle :

- `OVERPASS_URL`
- `OSM_BBOXES` — JSON array `{id,name,south,west,north,east}`

Front (optionnel) : `VITE_CATALOG_API=/osm-catalog` ou merge dans `/catalog`.
