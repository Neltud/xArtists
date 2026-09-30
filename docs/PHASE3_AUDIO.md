# Phase 3 — Immersion audio (Nelson Tuduri)

## Components

| File | Role |
|------|------|
| `BackgroundMusicPlayer.tsx` | YouTube IFrame API, loop, user toggle |
| `ZoneRouteSync.tsx` | route → `empireStore.zone` |
| `config/nelsonAudio.ts` | track IDs + zone volumes |

## Mix

| Zone | Volume |
|------|--------|
| museum | 100% |
| command (`/command-center`, `/room/*`, `/my-packs`, `/trading`) | 20% |
| transition | 50% |

Low-pass filter: not available on YouTube iframe; approximated by volume ducking in Command Center.

## Ops

```bash
# Pages secret / local .env — official Nelson Tuduri video ID
VITE_NELSON_YOUTUBE_ID=xxxxxxxxxxx
```

Default ID is a placeholder ambient stream until ops sets the real track.

## UX

- Music **off** by default (autoplay policy + respect).
- Button `🎵 Music on/off` bottom-right (left of SFX dock).
- SFX dock remains independent.
