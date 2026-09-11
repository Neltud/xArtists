# Vellum — prochaines améliorations (après validation workflows)

**Contexte :** demo **paper live** sur mainnet (lecture). Pas de fonds protocole.

## En attente validation CI / Pages

1. Workflow **Deploy Vite / static** vert sur `main`
2. Live https://neltud.github.io/xArtists/ = SHA récent + `/VERSION`
3. Branche `feat/sdk-dapp-v5` isolée (ne casse pas Pages)

## Implémenter côté Vellum (ordre)

| Priorité | Item | Note |
|----------|------|------|
| P0 | Board paper cycle | `lia.board.publish` — paper only |
| P0 | `LIA_LIVE_TRADING=0` | Hard gate |
| P1 | Signaux lecture | TRO / market — display only |
| P1 | Discord webhook ops | Secret env, pas front |
| P2 | sdk-dapp v5 | Après merge branche |
| P2 | SC **devnet** | Avant mainnet value |
| P3 | Mainnet SC | Seulement post-verify + DEMO off |

## Build in public

Comms OK :
- Demo live mainnet **lecture**
- Supernova live
- 3 packs paper
- Galerie 3D avatar
- SC / trading **pas** live

Comms **interdit** : APY promis, swap auto, gasless non déployé.

## Trigger message pour run Vellum

```
RUN VELLUM paper cycle:
- confirm Pages green
- board.publish paper only
- no mainnet value TX
- optional: draft X build-in-public (demo URL + #MultiversX #Supernova)
```
