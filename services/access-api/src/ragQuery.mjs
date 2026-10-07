/**
 * Volatile RAG over masterclass JSON (no persistent vector DB).
 * POST /v1/rag/query → answer + chapter timestamps for player seek.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadMasterclass(id = 'da_vinci_sfumato') {
  const candidates = [
    path.resolve(__dirname, `../../../data/masterclasses/${id}.json`),
    path.resolve(__dirname, `../../data/masterclasses/${id}.json`),
  ]
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'))
    } catch {
      /* */
    }
  }
  return null
}

function tokens(s) {
  return new Set(
    String(s || '')
      .toLowerCase()
      .match(/[a-z0-9àâäéèêëïîôùûüç]{3,}/g) || [],
  )
}

function scoreOverlap(q, text) {
  const a = tokens(q)
  const b = tokens(text)
  if (!a.size || !b.size) return 0
  let n = 0
  for (const t of a) if (b.has(t)) n++
  return n / Math.sqrt(a.size * b.size)
}

/**
 * @param {{ query: string, masterclass_id?: string, professor_id?: string }}
 */
export function queryMasterclassRag(body) {
  const query = String(body.query || body.q || '').trim()
  if (!query) {
    return { ok: false, error: 'query_required' }
  }
  const mc = loadMasterclass(body.masterclass_id || 'da_vinci_sfumato')
  if (!mc) {
    return { ok: false, error: 'masterclass_not_found' }
  }

  const scored = (mc.segments || [])
    .map(seg => ({
      ...seg,
      score: scoreOverlap(query, `${seg.text} ${(seg.tags || []).join(' ')}`),
    }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  // chapter match
  const chapters = (mc.chapters || [])
    .map(ch => ({
      ...ch,
      score: scoreOverlap(query, `${ch.title} ${ch.summary}`),
    }))
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)

  const topChapter = chapters[0] || null
  const cites = scored.map(s => ({
    t: s.t,
    text: s.text,
    score: Number(s.score.toFixed(3)),
  }))

  let answer
  if (cites.length) {
    const primary = cites[0]
    answer =
      `Selon la masterclass « ${mc.title} » (≈ ${primary.t}s) : ${primary.text}` +
      (cites[1] ? ` Également (≈ ${cites[1].t}s) : ${cites[1].text}` : '')
  } else if (topChapter) {
    answer = `Chapitre « ${topChapter.title} » (${topChapter.start_sec}s–${topChapter.end_sec}s) : ${topChapter.summary}`
  } else {
    answer =
      'Je n\'ai pas trouvé de passage précis sur ce point dans la démonstration Sfumato. Reformulez (Joconde, Sainte Anne, glacis…).'
  }

  const seek_sec = cites[0]?.t ?? topChapter?.start_sec ?? null

  return {
    ok: true,
    masterclass_id: mc.id,
    professor_id: mc.professor_id || body.professor_id || 'leonardo',
    answer,
    citations: cites,
    chapter: topChapter
      ? {
          id: topChapter.id,
          title: topChapter.title,
          start_sec: topChapter.start_sec,
          end_sec: topChapter.end_sec,
        }
      : null,
    seek_sec,
    youtube_id: mc.youtube_id || null,
    mode: 'volatile_demo',
  }
}
