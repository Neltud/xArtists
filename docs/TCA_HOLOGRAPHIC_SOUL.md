# TCA Phase 13 — Holographic mentor (soul)

## Design thesis

The professor is **not** a solid actor. It is a **memory of light**: translucent, slightly unstable, always “almost there.”  
Personality is not random noise — it is a **constraint system** that shapes speech, gesture, gaze, and silence.

| Layer | Responsibility |
|-------|----------------|
| Soul profile (JSON) | Stable traits per master |
| Beat cues | Timed emotion / gaze / text |
| Micro-life loop | Breathing, flicker, idle gaze — even in silence |
| Front renderer | Hologram material + prosody TTS |

**Zero impact on trading.** TCA remains a silent observer of capital.

## Unexpected behavior (alive ghost)

| Situation | Response |
|-----------|----------|
| Long pause between beats | Micro head tilt + slower breath + soft flicker |
| After PROJECT on | Gaze → board; speech rate −5% (contemplative) |
| Emotion `curious` | Gaze drifts off-camera then returns |
| Emotion `dramatic` | Wider gesture amplitude + deeper pitch |
| Silence > 2s | Optional “thinking” idle — no forced chatter |

## Four masters — behavioral spine

1. **Leonardo** — calm precision; high eye contact; analytical pauses (0.8–1.2s).  
2. **Rembrandt** — slow weight; low ambient; long silences; voice low.  
3. **Repin** — wide gestures; epic cadence; gaze on “crowd” (stage).  
4. **Turner** — quick shifts; brighter hologram; erratic micro-moves; high energy.

## Hologram look (implementation)

- Custom fragment: scanlines + opacity pulse + fresnel edge glow.  
- Primary glow from `personality.color_palette.primary_glow`.  
- Bloom optional (composer) — keep mobile path without full bloom.
