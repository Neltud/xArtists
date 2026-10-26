---
hidden: true
noIndex: true
---

# TCA Module 1 — Sfumato (first video course)

## Paths

| Path                                     | Role                                              |
| ---------------------------------------- | ------------------------------------------------- |
| `/tca` · `/classroom`                    | Gate (JWT FULL → classroom, else Module 1 SAMPLE) |
| `public/data/tca/module_01_sfumato.json` | Curriculum JSON                                   |
| `TcaModuleOne.tsx`                       | UI: video, sections, mentor notes, context bridge |

## Flow

1. SAMPLE: Module 1 video + theory + practice + local RAG notes
2. `saveTcaContext({ video_id, lesson_id })` for continuity
3. FULL (server JWT): 3D `TcaClassroom` behind `ImmersiveErrorBoundary`

## Ingest transcript (optional)

```bash
PYTHONPATH=. python -m lia.tca.youtube_transcript_ingest --from-sample
```
