---
hidden: true
noIndex: true
---

# Sprint 1 — Zero-Trust Access & Contextual Bridge

**Status:** implemented on `main` (client + API paths + ingest CLI + immersive boundaries)

## Module A — Zero-Trust Gatekeeper

| Piece                  | Location                                                     |
| ---------------------- | ------------------------------------------------------------ |
| Chain read + JWT issue | `services/access-api/src/verifyAccess.mjs`                   |
| HTTP API               | `POST /v1/verify-access` and alias `POST /api/verify-access` |
| Front client           | `apps/frontend/src/lib/accessGate.ts`                        |
| Hook                   | `apps/frontend/src/hooks/useAccessGate.ts`                   |

**Rule:** UI never decides `FULL` from `localStorage` flags alone. A non-expired JWT with `level: FULL` (and matching `sub` wallet) is required.

Env (server):

```bash
ACCESS_JWT_SECRET=...          # min 16 chars
PULSE_COLLECTION=...           # NFT collection ticker(s)
PULSE_ALLOWLIST=               # optional erd1 list
ACCESS_JWT_TTL_SEC=900
MVX_API_URL=https://api.multiversx.com
```

Env (front):

```bash
VITE_ACCESS_API_BASE=https://<your-access-api>
```

## Module B — Contextual Knowledge Loop

| Piece                          | Location                                                    |
| ------------------------------ | ----------------------------------------------------------- |
| Session bridge video→classroom | `apps/frontend/src/lib/tcaVideoContext.ts`                  |
| Ingest CLI                     | `python -m lia.tca.youtube_transcript_ingest`               |
| Output                         | `data/tca/knowledge/youtube_<id>.jsonl`                     |
| Existing RAG                   | `apps/frontend/src/lib/tcaRag.ts` + `lia/tca/rag_engine.py` |

```bash
PYTHONPATH=. python -m lia.tca.youtube_transcript_ingest --from-sample
```

## Module C — Immersive Fallback

| Piece    | Location                                                  |
| -------- | --------------------------------------------------------- |
| Boundary | `apps/frontend/src/components/ImmersiveErrorBoundary.tsx` |
| Existing | `ErrorBoundary.tsx` / `RouteErrorBoundary.tsx`            |

Wrap WebGL classroom / RAG panels:

```tsx
<ImmersiveErrorBoundary area="webgl">{/* canvas */}</ImmersiveErrorBoundary>
<ImmersiveErrorBoundary area="rag"><MentorAskBar ... /></ImmersiveErrorBoundary>
```

## Security notes

* No client-side JWT signing secrets.
* GitHub Pages remains static; access-api must be deployed separately with secrets.
* SIWX signature can be required via access-api env when hardening further.
