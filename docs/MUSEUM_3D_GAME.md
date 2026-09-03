# Musée 3D · architecture par lieu · galerie-jeu

## Intention

Chaque **musée / lieu / galerie** a un **plan et une architecture différents**.

| Couche | Où |
|--------|-----|
| **Studio plan → volume 3D** | [`Neltud/blend-glade-wolf-grove`](https://github.com/Neltud/blend-glade-wolf-grove) |
| **Galerie dApp + œuvres** | `Neltud/xArtists` (`MuseumGameHall`, `museumLayouts`) |

---

## Outil dédié : blend-glade-wolf-grove

Stack : **React Three Fiber** + **Three.js**, édition plan 2D, extrusion 3D.

### Modèle de données (`src/lib/plan/types.ts`)

```ts
FloorPlan {
  walls: Wall[]      // segments x1,y1,x2,y2 + height + thickness
  openings: Opening[] // portes / fenêtres sur wallId
  rooms: Room[]      // polygones + sol
  furniture: Furniture[]
  wallHeight, wallThickness
}
```

Géométrie 3D : `wallSolids()` découpe les murs autour des ouvertures (`src/lib/plan/geometry.ts`).

Samples prêts : **Haussmann**, **Villa Claire**, **Atelier** (`samples.ts`).

UI : plan 2D (`plan-canvas`) · scène 3D (`scene-3d`) · chrome studio.

### Rôle pour xArtists

1. Dessiner / importer le **plan réel** d’un musée (ou approximation).
2. Exporter `FloorPlan` JSON (= `RoomBlueprint` côté xArtists).
3. xArtists charge le blueprint + place les **œuvres** sur `artAnchors`.
4. Fallback live actuel : layouts CSS paramétriques (`museumLayouts.ts`) si pas de mesh.

Contrat TypeScript miroir : `apps/frontend/src/lib/roomBlueprint.ts`.

---

## Mapping actuel (layout CSS v1)

| Lieu | Layout CSS | Plan sample (proxy) |
|------|------------|---------------------|
| xArtists | `cyber_grid` | studio |
| Louvre | `grand_corridor` | haussmann |
| Orsay | `glass_nave` | villa |
| National Gallery | `dual_gallery` | haussmann |
| Rijks | `cabinet` | studio |
| Uffizi | `rotunda` | villa |
| Met | `courtyard` | villa |

---

## Roadmap intégration

**V1 (live)** — layouts CSS distincts + preload œuvres.  
**V2** — import `RoomBlueprint` / `FloorPlan` JSON depuis le studio ; rendu R3F optionnel dans la galerie.  
**V3 jeu** — monde ouvert culturel : villes → bâtiments (plans) → salles → missions / score / packs (paper-first).

### Export minimal à ajouter dans blend-glade-wolf-grove

```ts
// ex. exportPlanJson(plan: FloorPlan): string
JSON.stringify(plan)
```

Puis dépôt sous `xArtists/apps/frontend/public/blueprints/{museumId}.json`.

---

## Direction « galerie jeu »

- Exploration type open-world **culturel** (pas FPS réel).
- Boucle : se déplacer, entrer dans un bâtiment unique, inspecter, missions, earn (points / NFT d’accès).
- « Capture » = claim / parcours / intention d’achat paper — aligné soft launch.

---

## Fichiers xArtists

- `apps/frontend/src/lib/museumLayouts.ts`
- `apps/frontend/src/lib/roomBlueprint.ts`
- `apps/frontend/src/components/museum/MuseumGameHall.tsx`
- `apps/frontend/src/lib/museumWorldCatalog.ts`
