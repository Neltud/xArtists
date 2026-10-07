/** Client for POST /v1/rag/query (volatile masterclass RAG). */

export type RagQueryResult = {
  ok: boolean
  answer?: string
  seek_sec?: number | null
  chapter?: { id: string; title: string; start_sec: number; end_sec: number } | null
  citations?: { t: number; text: string; score: number }[]
  error?: string
  mode?: string
}

function apiBase() {
  return ((import.meta.env.VITE_ACCESS_API_BASE as string) || '').replace(/\/$/, '')
}

export async function queryRagRemote(
  query: string,
  opts?: { professor_id?: string; masterclass_id?: string },
): Promise<RagQueryResult> {
  const base = apiBase()
  if (!base) {
    return { ok: false, error: 'no_access_api_base' }
  }
  try {
    const r = await fetch(`${base}/v1/rag/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        professor_id: opts?.professor_id || 'leonardo',
        masterclass_id: opts?.masterclass_id || 'da_vinci_sfumato',
      }),
    })
    const j = (await r.json()) as RagQueryResult
    return j
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'network' }
  }
}
