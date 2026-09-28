# pulse-api on Akash

1. Build & push image:
```bash
docker build -f deploy/akash/pulse-api/Dockerfile -t ghcr.io/neltud/xartists-pulse-api:latest .
docker push ghcr.io/neltud/xartists-pulse-api:latest
```

2. Deploy via Akash Console with `deploy.yaml` (same flow as indexer).

3. Test: `https://{ingress}/health` and `/pulse`

4. GitHub Pages / Vite build secret:
```
VITE_PULSE_API=https://{ingress}
```
(HTTPS if provider supports it)

No PEM on Akash. Signals only.
