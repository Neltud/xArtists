# Sensory layer (Phase 2 & 3) — status

## Phase 2 — Interaction

| Task | Status | Module |
|------|--------|--------|
| 2.1 Raycaster + Direct Execution | OK | `CommandWall` → `empireTxStart` + routes |
| 2.1 TransactionOverlay | OK | `TransactionOverlay` ← `useEmpireTx` |
| 2.2 Atmospheric Feedback | OK | emissive/lights + `PulseAtmosphere` ShaderMaterial |
| 2.3 Data Tunnel | OK | `DataTunnelTransition` (no GSAP dep) |

## Phase 3 — Immersion

| Task | Status | Module |
|------|--------|--------|
| 3.1 BackgroundMusicPlayer | OK | YouTube iframe + zone volumes |
| Cross-fade | OK | ~900ms volume ramp on zone change |
| LowPassFilter | Approximated | deeper duck on command (iframe limit) |

## Rules

- Museum code not modified (extension mode).
- All TX feedback via `empireStore`.
- Paper-testable: click CommandWall nodes without live SC.

## Test

1. `/command-center` (pack paper) → tunnel → clic nœud vert → overlay « Stake TRO ».
2. Pulse demo cycle → mur + shader change color/speed.
3. 🎵 Music on → `/museum` (100%) → `/command-center` (20% fade).
