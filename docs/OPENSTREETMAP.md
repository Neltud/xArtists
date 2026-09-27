# OpenStreetMap dans xArtists

## Rôle

Couche **monde réel** pour le « Google Earth de l’art » :

1. **Tuiles** — fonds de carte OSM / OpenTopoMap / CARTO (déjà dans `ArtWorldMap`)
2. **POIs culturels** — Overpass API : `tourism=museum`, `tourism=gallery`, `amenity=arts_centre`

## Fichiers

| Fichier | Rôle |
|---------|------|
| `apps/frontend/src/lib/osmOverpass.ts` | Client Overpass + cache session |
| `apps/frontend/src/components/ArtWorldMap.tsx` | Carte Leaflet + couche OSM POI |

## Règles d’usage

- Attribution **© OpenStreetMap contributors** (ODbL) affichée sur la carte
- User-Agent `xArtists-dApp`
- Zoom ≥ 10 avant requête Overpass
- Bbox max ~2°×2°
- Cache session 30 min
- Endpoints de secours si overpass-api.de saturé

## Licence

Données géographiques : [ODbL](https://opendatacommons.org/licenses/odbl/).  
Tuiles : selon le fournisseur (OSM, OpenTopoMap CC-BY-SA, CARTO, Esri imagery).

## Suite

- Lier POI OSM → salle virtuelle si `museumWorldCatalog` match (nom / ville)
- Export bbox pour indexeur Akash (catalogue lieux)
- Events OSM `tourism=attraction` filtrés art (optionnel)
