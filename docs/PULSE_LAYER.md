# THE PULSE — architecture v2

```
X / mock → noise → sentiment → category → velocity
                         ↓
              signal + ENVIRONMENT_UPDATE
                         ↓
         Redis optional · WS · Strategist · GrokyversX · Home PulseStrip
```

## Categories
`MARKET_HYPE` · `SOCIAL_CRASH` · `ART_TREND` · `WHALE_MOVE` · `NEUTRAL`

## Environment payload
```json
{
  "type": "ENVIRONMENT_UPDATE",
  "sentiment": 0.85,
  "intensity": "high",
  "color_target": "#ffaa00",
  "vibe": "hype_event",
  "category": "MARKET_HYPE",
  "three": { "particleDensity": 0.9, "fogDensity": 0.2 }
}
```

## Demo
Home `PulseStrip` cycles fixtures (GH Pages has no Python host).  
Live: `uvicorn pulse.app:app --port 8787` + `X_BEARER_TOKEN`.

## Demo URL
https://neltud.github.io/xArtists/  · VERSION 3.9.1-pulse
