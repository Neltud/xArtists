# Wire RAG into TcaClassroom

## Already on main

- `lia/tca/rag_engine.py` — retrieve + persona synthesis + cue emission
- `apps/frontend/src/lib/tcaRag.ts` — client mirror (`askMentor`)
- `apps/frontend/src/components/tca/MentorAskBar.tsx` — UI + 1.5s cognitive delay
- `data/tca/knowledge/chunks.jsonl` — curated notes (not full copyrighted books)

## Minimal graft in TcaClassroom

```tsx
import { MentorAskBar } from '../components/tca/MentorAskBar'

// inside HUD:
<MentorAskBar
  professorId={professorId}
  onCues={(cues) => {
    clockRef.current = 0
    appliedRef.current = new Set()
    cuesRef.current = cues
    playingRef.current = true
    setPlaying(true)
    setEmotionLabel('thinking')
  }}
/>
```

Handle in `applyCue`:

- `DYNAMIC_TEXT` → subtitle (+ cite → analysisNote)
- `THINKING` / `EMOTIONAL_SHIFT` → emotionRef
- `VISUAL_HIGHLIGHT` → optional PROJECT

## CLI test

```bash
PYTHONPATH=. python -m lia.tca.rag_engine --q "What is sfumato?" --professor leonardo
```

## Scale

Set `TCA_LLM_URL` for generative answers; chunks schema stays stable for Chroma/Pinecone later.
