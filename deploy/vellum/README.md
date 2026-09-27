# Vellum · Agent 8008 webhook

## Principe de sécurité

- **Jamais** de clé API Vellum (`X-API-KEY`) dans le front Vite / GitHub Pages.
- Le navigateur appelle uniquement `VITE_VELLUM_8008_WEBHOOK` = **proxy** (Cloudflare Worker, Akash, Railway…).
- Le proxy ajoute `X-API-KEY` côté serveur et appelle Vellum.

## Workflow Vellum

1. Créer / déployer le workflow **`xartists-8008-intents`**.
2. Inputs recommandés (STRING) :
   - `intent_type`
   - `agent_id`
   - `paper`
   - `payload_json`
   - `ts`
3. Logique : Guardian caps → journal → (optionnel) micro-tx via PEM Vellum **hors** dApp.

## GitHub Secret

```text
VITE_VELLUM_8008_WEBHOOK=https://ton-proxy.example.com/vellum/8008
```

Le workflow `static.yml` injecte ce secret au build (s’il est défini).

## Proxy minimal (Cloudflare Worker)

Voir `worker.js`. Variables d’environnement du worker :

- `VELLUM_API_KEY`
- `VELLUM_WORKFLOW_NAME` = `xartists-8008-intents` (défaut)

Endpoint Vellum :

`POST https://predict.vellum.ai/v1/execute-workflow`  
Header : `X-API-KEY: …`

## Test

1. Build local avec `VITE_VELLUM_8008_WEBHOOK=…`
2. Ouvrir `/lia` → « Ping intent test »
3. Journal 8008 doit afficher `vellum: sent`
