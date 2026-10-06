# Voice + lip-sync (TCA)

## Modules (on main)

| File | Role |
|------|------|
| `components/tca/lipSync.ts` | Visemes A/E/I/O/U/M/F/S · TTS word boundaries · track |
| `components/tca/applyMouthShape.ts` | Jaw / upperLip / lowerLip transforms |

## Flow

```
AUDIO cue
  → speakWithLipSync(text, { pitch, rate, lip })
  → Web Speech utterance + startLipSync track
  → each frame: tickLipSync → applyMouthShape(jaw, lower, upper)
  → onend: stopLipSync → rest mouth
```

## Viseme map (approx)

| Viseme | Shape |
|--------|-------|
| A | open jaw |
| E / I | wider lips |
| O / U | round |
| M | closed |
| F / S | slight open |

## Honest limit

Browser TTS has **no phoneme stream**. We approximate from characters + `onboundary` word events.  
True studio lip-sync = recorded audio + viseme timeline or Rhubarb/Oculus lip-sync offline.

## GLB upgrade

Map `MouthShape.open/width/round` to morph target weights when Leonardo GLB includes mouth blendshapes.
