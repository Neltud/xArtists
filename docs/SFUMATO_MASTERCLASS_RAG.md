# Masterclass Sfumato + Volatile RAG

## Data

- `data/masterclasses/da_vinci_sfumato.json` — chapters + timed segments + demo embeddings terms
- Public copy: `apps/frontend/public/data/masterclasses/`

## API

```
POST /v1/rag/query
{ "query": "Pourquoi le sourire de la Joconde est ambigu ?" }

→ answer, citations[{t,text}], seek_sec, chapter
```

```
GET /v1/masterclass/da_vinci_sfumato
```

## Front

- `MentorAskBar` → remote RAG then local cues fallback
- `SfumatoChapterPlayer` → YouTube embed + chapter buttons + seek from RAG
- Wire player on SAMPLE gate / FULL classroom as needed

## Honesty

Volatile lexical RAG over demo transcript — not a full vector DB / LLM production stack.
