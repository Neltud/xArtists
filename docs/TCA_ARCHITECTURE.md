# TCA — Techniques & Civilization of Art

**Layer 2 only.** Does not write pack equity, does not touch risk/execution.

## Stack

```
lia/tca/                    # backend content engine (Python)
  scheduler.py              # session windows + access gate
  curriculum_manager.py     # syllabus + learning paths
  avatar_controller.py      # script → gesture/TTS cues
data/tca/
  professors.json
  curriculum_leonardo_m1.json
  sessions_today.json       # written by scheduler
apps/frontend/
  src/pages/TcaClassroom.tsx     # (next) full-screen 3D
  src/components/tca/ObserverHud.tsx
```

## Access gate (honest)

| Rule | Meaning |
|------|--------|
| `public` | Anyone can preview lobby |
| `pack_holder` | Wallet holds configured pack NFT/token |
| `allowlist` | Ops list |

Gate is **read-only** against chain/index — no mint from TCA.

## Session windows (default Europe/Paris)

- Slot A: 18:00–20:00
- Slot B: 20:00–22:00

## Avatar pipeline (scalable 1 → 100 professors)

1. Curriculum emits `LessonBeat[]` (text, gesture_id, camera_target, duration_s)
2. Avatar controller maps beat → `{ lip_sync_key, animation, pan }`
3. Front plays GLB professor + optional TTS URL per locale
4. New professor = new row in `professors.json` + GLB path + voice id — **no engine change**

## 3D roadmap

| Phase | Deliverable |
|-------|-------------|
| T0 | Data models + scheduler CLI (this commit) |
| T1 | React full-screen canvas + static room + HUD |
| T2 | GLB professor + animation clips + beat scrubber |
| T3 | TTS per locale + subtitles |
| T4 | Multi-professor lobby + live slot sync |

**Three.js** preferred (already used in museum). Babylon optional later.

## Zero-ghost

TCA never calls `performance_tracker`, `yield_distributor`, or `record_mint/burn`.
