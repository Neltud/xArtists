# TCA Phase 13 — The Brain (RAG)

## Goal

Move from **scripted actor** → **mentor that retrieves + speaks in persona**.
Trading / risk / ledger: **never touched**.

## Architecture

```
User question
    → TcaClassroom (EMOTION=thinking, cognitive delay)
    → POST-like local call: lia/tca/rag_engine.py
        1. embed/query (keyword + optional vectors)
        2. retrieve top-k chunks from data/tca/knowledge/
        3. persona prompt (professor soul profile)
        4. generate answer (LLM if key; else extractive synthesis)
        5. response → cue list (DYNAMIC_TEXT, VISUAL_HIGHLIGHT, EMOTIONAL_SHIFT)
    → Beat player applies cues
```

## Knowledge unit (chunk)

```json
{
  "id": "sfumato_01",
  "concept": "sfumato",
  "technique": "soft edge / atmospheric transition",
  "visual_ref": "study_plate_sfumato",
  "epoch": "High Renaissance",
  "source": "curated_note",
  "cite": "TCA knowledge pack — optics of soft contour",
  "text": "...",
  "professors": ["leonardo"]
}
```

**Copyright:** do not bulk-ingest full commercial PDFs into the public repo.  
Ops may add licensed extracts under `data/tca/knowledge/private/` (gitignored).

## Vector path (optional scale)

| Stage | Choice |
|-------|--------|
| Dev | Keyword + TF-lite over JSONL (shipped) |
| Prod | Chroma local or Pinecone — same chunk schema |
| Embed | sentence-transformers or API — behind `TCA_EMBED_URL` |

## Cognitive delay

Front always plays **thinking** (1.2–2.5s) before applying answer cues — even if retrieval is instant.

## New cues

| Type | Payload |
|------|---------|
| `DYNAMIC_TEXT` | `{ text, cite? }` |
| `VISUAL_HIGHLIGHT` | `{ region, plate_id }` |
| `EMOTIONAL_SHIFT` | `{ from, to }` |
| `THINKING` | `{ duration_s }` |
