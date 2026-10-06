/**
 * Client-side TCA knowledge retrieve (mirrors lia/tca/rag_engine extractive path).
 * Used until a hosted RAG endpoint exists. No wallet / trading calls.
 */

export type KnowledgeChunk = {
  id: string
  concept?: string
  technique?: string
  visual_ref?: string
  epoch?: string
  cite?: string
  text?: string
  professors?: string[]
  tags?: string[]
}

export type RagCue = {
  timestamp: number
  type: string
  payload: Record<string, unknown>
}

const FALLBACK_CHUNKS: KnowledgeChunk[] = [
  {
    id: 'sfumato_01',
    concept: 'sfumato',
    text: 'Sfumato is not blur for its own sake. It is the graduated absence of hard contour so that form emerges from air. Value transitions do the drawing.',
    cite: 'TCA · optics of soft contour',
    visual_ref: 'study_plate_sfumato',
    professors: ['leonardo'],
    tags: ['sfumato', 'edge', 'value'],
  },
  {
    id: 'sfumato_02',
    concept: 'sfumato',
    text: 'On a cheek, seek at least three values rather than a binary light/dark split. The middle value carries the sfumato.',
    cite: 'TCA · portrait planes',
    visual_ref: 'study_plate_sfumato',
    professors: ['leonardo'],
  },
  {
    id: 'chiaroscuro_01',
    concept: 'chiaroscuro',
    text: 'One dominant light creates hierarchy. Equal twin lights flatten conscience. Shadow is not absence — it is volume and judgment.',
    cite: 'TCA · moral light',
    visual_ref: 'study_plate_rembrandt',
    professors: ['rembrandt', 'leonardo'],
  },
  {
    id: 'anatomy_01',
    concept: 'portrait anatomy',
    text: 'Block the head as planes: forehead, zygomatic, jaw. Expression rides on muscle; muscle rides on bone.',
    cite: 'TCA · structural seeing',
    professors: ['leonardo'],
  },
  {
    id: 'atmosphere_01',
    concept: 'atmospheric dissolve',
    text: 'When weather becomes the subject, edges surrender to temperature. Steam, spray, and glare replace form.',
    cite: 'TCA · light dissolves form',
    visual_ref: 'study_plate_turner',
    professors: ['turner'],
  },
  {
    id: 'crowd_01',
    concept: 'narrative crowd',
    text: 'In a crowd scene, each hand and spine is a sentence. Labor can be shown without caricature when weight and rhythm are observed honestly.',
    cite: 'TCA · labor and dignity',
    professors: ['repin'],
  },
  {
    id: 'composition_01',
    concept: 'golden ratio',
    text: 'Proportion is a path for the eye, not decoration. Place one focus on a harmonic division, then justify why it earns that place.',
    cite: 'TCA · quiet geometry',
    professors: ['leonardo'],
  },
]

function tokens(s: string): Set<string> {
  return new Set((s.toLowerCase().match(/[a-z0-9àâäéèêëïîôùûüç]{3,}/g) || []))
}

function retrieve(query: string, professorId: string, chunks: KnowledgeChunk[]): KnowledgeChunk[] {
  const q = tokens(query)
  const scored: { s: number; c: KnowledgeChunk }[] = []
  for (const c of chunks) {
    if (professorId && c.professors?.length && !c.professors.includes(professorId)) continue
    const blob = [c.concept, c.technique, c.text, ...(c.tags || [])].join(' ')
    const t = tokens(blob)
    let inter = 0
    q.forEach(w => {
      if (t.has(w)) inter++
    })
    if (inter > 0) scored.push({ s: inter / Math.max(1, q.size), c })
  }
  scored.sort((a, b) => b.s - a.s)
  if (!scored.length) {
    // retry without professor filter
    return retrieve(query, '', chunks).slice(0, 3)
  }
  return scored.slice(0, 3).map(x => x.c)
}

export function askMentor(
  query: string,
  professorId: string,
  chunks: KnowledgeChunk[] = FALLBACK_CHUNKS,
): { answer: string; cite?: string; emotion: string; visual_ref?: string; cues: RagCue[] } {
  const hit = retrieve(query, professorId, chunks)
  const thinking_s = 1.6 + Math.random() * 0.6
  if (!hit.length) {
    const answer =
      'I do not find that in the studio notes yet. Try sfumato, light, anatomy, composition, or atmosphere.'
    return {
      answer,
      emotion: 'thinking',
      cues: [
        { timestamp: 0, type: 'THINKING', payload: { duration_s: thinking_s } },
        { timestamp: 0, type: 'EMOTION', payload: { emotion: 'thinking' } },
        { timestamp: thinking_s, type: 'DYNAMIC_TEXT', payload: { text: answer } },
        { timestamp: thinking_s, type: 'AUDIO', payload: { text: answer } },
      ],
    }
  }
  const primary = hit[0]
  let answer = primary.text || ''
  if (hit[1]?.text && answer.length < 220) answer = answer.replace(/\.?$/, '.') + ' ' + hit[1].text
  if (professorId === 'rembrandt') answer = 'Consider the shadow first. ' + answer
  if (professorId === 'turner') answer = 'Watch how light eats the edge. ' + answer
  if (professorId === 'repin') answer = 'See the human weight in the gesture. ' + answer
  const emotion = primary.concept === 'chiaroscuro' ? 'authoritative' : 'curious'
  const t = thinking_s
  const cues: RagCue[] = [
    { timestamp: 0, type: 'THINKING', payload: { duration_s: thinking_s } },
    { timestamp: 0, type: 'EMOTION', payload: { emotion: 'thinking' } },
    { timestamp: t, type: 'EMOTIONAL_SHIFT', payload: { from: 'thinking', to: emotion } },
    { timestamp: t, type: 'EMOTION', payload: { emotion } },
    { timestamp: t, type: 'DYNAMIC_TEXT', payload: { text: answer, cite: primary.cite } },
    { timestamp: t, type: 'AUDIO', payload: { text: answer } },
  ]
  if (primary.visual_ref) {
    cues.push({
      timestamp: t + 0.3,
      type: 'VISUAL_HIGHLIGHT',
      payload: { plate_id: primary.visual_ref, region: 'full' },
    })
    cues.push({
      timestamp: t + 0.3,
      type: 'PROJECT',
      payload: { on: true, title: primary.concept || 'Study', analysis: primary.cite || '' },
    })
  }
  return { answer, cite: primary.cite, emotion, visual_ref: primary.visual_ref, cues }
}
