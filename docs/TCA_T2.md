# TCA T2 — Animation, projection, voice

## Sequence (Leonardo first word)

1. Ambient room + gold dust  
2. Idle professor (procedural or GLB if present)  
3. t≈5s close-up camera  
4. t≈6s TTS + subtitle + Explain gesture  
5. t≈12–13s **dim lights** + **PROJECT** on board  
6. Slow camera to board / analysis note  
7. Lights restore · class end  

## Projection pedagogy

| Cue | Effect |
|-----|--------|
| `LIGHTS` `{ ambient, dim }` | Lerps room intensity |
| `PROJECT` `{ on, title, analysis }` | Canvas texture on board + emissive |
| Board color | `warm_white` or `dark` per professor room |

## Agenda Season 1

| Month | Professor | Arc |
|-------|-----------|-----|
| M1 | Leonardo | Science of seeing |
| M2 | Rembrandt | Faces of conscience |
| M3 | Repin | History in the flesh |
| M4 | Turner | Weather as subject |

Each: 4 weeks · themes in `data/tca/agenda_season.json`.

## GLB

Place files at `public/models/tca/{leonardo,rembrandt,repin,turner}.glb` with clips `Idle`, `Explain`, `PointRight`, …  
Until then: procedural capsule + jaw lip approx.

## TTS

Browser `speechSynthesis` (no external key). Locale from cue / professor.

## Rule

TCA still **does not** write trading ledger.
