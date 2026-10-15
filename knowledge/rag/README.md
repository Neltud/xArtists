# knowledge/rag — Pipeline pédagogique ATC → TCA

Ingestion source pour le moteur RAG de LIA / TCA (`lia/tca/rag_engine.py`).

## Structure

```
knowledge/rag/
├── atc_transcripts/     # Transcriptions brutes des leçons ATC (markdown)
├── lia_curation/        # Chunks curés / enrichis par LIA avant indexation
└── README.md
```

## Flux

1. Push sur `knowledge/rag/**` (branche `main`) → workflow `rag-ingestion.yml`.
2. Extraction de chunks (titre, concept, tags, text).
3. Webhook optionnel vers Vellum / LIA Engine (secret `RAG_INGEST_WEBHOOK_URL`).
4. Les chunks alimentent `data/tca/knowledge/chunks.jsonl` (ou endpoint distant).

## Convention de fichier transcript

- Front-matter implicite : titre H1, métadonnées en gras.
- Sections : Concept, Technique, Application pédagogique, Chunks candidats.
- Tags : mots-clés pour retrieval lexical.

## Rôle multi-IA

- **Grok** : Dev/Ops local, scripts d’ingestion, workflows.
- **Gemini Flash** : revue d’architecture & cohérence pédagogique.
- **LIA (Vellum)** : curation, trading signals, persona professor.
