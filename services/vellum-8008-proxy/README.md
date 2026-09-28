# Vellum 8008 Proxy

Front **never** holds the Vellum API key.

```bash
export VELLUM_API_KEY=…
export VELLUM_WORKFLOW_NAME=xartists-8008-intents
uvicorn main:app --port 8091
```

GitHub Pages build secret:

```
VITE_VELLUM_8008_WEBHOOK=https://{your-proxy}/vellum-8008
```

Health: `GET /health`
