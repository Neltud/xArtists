# Musée 3D · architecture par lieu · galerie-jeu

## Intention

Chaque **musée / lieu / galerie** a un **plan et une architecture différents** (pas un seul corridor teinté).

- **V1 (live)** : schémas CSS-3D paramétrés (`museumLayouts.ts`) — nef, rotonde, double aile, cour, cabinet…
- **V2** : brancher le **repo dédié plan + élévation → mesh 3D** (floorplan / elevation viewer) pour générer les salles à partir de vrais plans.
- **V3 jeu** : mode exploration type open-world culturel (parcours, missions, collecte d’œuvres / score), pas un FPS réaliste.

## Mapping actuel (layout)

| Lieu | Layout |
|------|--------|
| Musée xArtists | `cyber_grid` |
| Louvre | `grand_corridor` |
| Orsay | `glass_nave` |
| National Gallery | `dual_gallery` |
| Rijksmuseum | `cabinet` |
| Van Gogh Museum | `sky_hall` |
| Uffizi | `rotunda` |
| Prado | `grand_corridor` |
| The Met | `courtyard` |
| … | voir `MUSEUM_LAYOUT` |

## Pipeline plan → salle (V2)

1. Source : plan SVG / raster + élévation (hauteur murs, ouvertures).
2. Extrusion (murs, sols, plafonds) — outil type *floorplan-to-3d* / Pascal Editor / export glTF.
3. Export **glTF** ou JSON walls `{segments, height, openings[]}`.
4. Chargeur xArtists : `MuseumGameHall` ou R3F (`@react-three/fiber`) consomme le layout.
5. Placement œuvres : ancres sur les murs (UV ou points `artAnchors[]`).

## Direction « galerie jeu »

- Exploration **GTA-like** au sens *monde ouvert culturel* : se déplacer, entrer dans les bâtiments, découvrir des salles.
- Boucle économique dApp : **missions**, **collecte / score**, packs, NFT d’accès — pas de violence réelle ni de « kill » IRL.
- « Capture » d’œuvre = intention paper / claim / quiz / parcours guidé, pas destruction.
- Earn : points culture, entitlement packs, badges on-chain — aligné paper-first jusqu’aux SC.

## Fichiers

- `apps/frontend/src/lib/museumLayouts.ts` — plans paramétriques
- `apps/frontend/src/components/museum/MuseumGameHall.tsx` — rendu par layout
- `apps/frontend/src/lib/museumWorldCatalog.ts` — lieux + œuvres

## Prochaine étape technique

1. Brancher le repo plan→3D (URL / submodule) dès qu’il est public ou partagé.
2. Format d’import minimal `RoomBlueprint` (murs + ancrages).
3. Mode jeu : objectifs par salle (visiter N œuvres, compléter un parcours ville).
