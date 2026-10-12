/**
 * Deck Sponsoring PDF (4 pages) — pure client, zero deps.
 */
import type { PackId } from '../config/agentPacks'
import { AGENT_PACKS } from '../config/agentPacks'

type Tier = 'silver' | 'gold' | 'platinum'

const PACK_TIER: Record<PackId, Tier> = {
  pulse: 'silver',
  yield: 'gold',
  sentinel: 'platinum',
}

const TIER_LABEL: Record<Tier, string> = {
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
}

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function contentStream(lines: string[]): string {
  const chunks: string[] = ['BT', '/F1 12 Tf', '50 780 Td', '16 TL']
  lines.forEach((line, i) => {
    if (i === 0) {
      chunks.push('/F1 18 Tf', `(${esc(line)}) Tj`, '/F1 12 Tf', 'T*')
    } else if (line === '') {
      chunks.push('T*')
    } else {
      chunks.push(`(${esc(line)}) Tj`, 'T*')
    }
  })
  chunks.push('ET')
  return chunks.join('\n')
}

/** Build a valid PDF-1.4 with N text pages. */
export function buildSponsorDeckPdf(packId: PackId): { blob: Blob; filename: string } {
  const pack = AGENT_PACKS.find(p => p.id === packId)
  const name = pack?.name || packId.toUpperCase()
  const tier = TIER_LABEL[PACK_TIER[packId]]
  const ents = (pack?.entitlements || []).slice(0, 8)
  const price =
    pack?.priceEur?.list != null
      ? `~${pack.priceEur.list} EUR / ~${pack.priceEgld?.list ?? '-'} EGLD`
      : 'See /agents for list pricing'

  const pages: string[][] = [
    [
      'xArtists — Sponsor Deck B2B',
      `Pack ${name} · Tier ${tier}`,
      '',
      'Non-contractual · paper-first · non-custodial.',
      'MultiversX · NFT packs PULSE / YIELD / SENTINEL.',
      '',
      'Journey: /agents · Command Center: /command-center',
      'LIA Hub: signal read · on-chain via xPortal only.',
    ],
    [
      '1. Positioning',
      `${name}: ${pack?.tagline || ''}`,
      '',
      `Suggested tier: ${tier}`,
      '- Silver: room access + signal read',
      '- Gold: command hub + multi-asset tape',
      '- Platinum: full suite + roadmap priority',
      '',
      `Indicative price: ${price}`,
    ],
    [
      '2. Included (excerpt)',
      ...(ents.length ? ents.map(e => `- ${e}`) : ['- See pack card on /agents']),
      '',
      'Gates: pack NFT ownership · optional zero-trust access API.',
    ],
    [
      '3. Engagement & limits',
      '- Not financial advice.',
      '- LIA paper-first by default (no autonomous live trading).',
      '- Marketplace mint/list: deployed SC + Pages codehash.',
      '- B2B sponsoring: branding, demo access, roadmap — no fund custody.',
      '',
      '4. Next step',
      'Open /agents to select the pack and complete via wallet.',
      `Generated client-side · ${new Date().toISOString().slice(0, 10)}`,
    ],
  ]

  const encoder = new TextEncoder()
  const objs: Uint8Array[] = []
  const offsets: number[] = []

  let body = '%PDF-1.4\n'

  const addObj = (id: number, content: string) => {
    offsets[id] = body.length
    body += `${id} 0 obj\n${content}\nendobj\n`
  }

  const n = pages.length
  const contentIds: number[] = []
  const pageIds: number[] = []
  let id = 4
  for (let i = 0; i < n; i++) {
    contentIds.push(id++)
    pageIds.push(id++)
  }

  addObj(1, '<< /Type /Catalog /Pages 2 0 R >>')
  addObj(
    2,
    `<< /Type /Pages /Kids [${pageIds.map(p => `${p} 0 R`).join(' ')}] /Count ${n} >>`,
  )
  addObj(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')

  for (let i = 0; i < n; i++) {
    const stream = contentStream(pages[i])
    addObj(contentIds[i], `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)
    addObj(
      pageIds[i],
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${contentIds[i]} 0 R /Resources << /Font << /F1 3 0 R >> >> >>`,
    )
  }

  const xrefStart = body.length
  let xref = `xref\n0 ${id}\n0000000000 65535 f \n`
  for (let i = 1; i < id; i++) {
    xref += `${String(offsets[i] ?? 0).padStart(10, '0')} 00000 n \n`
  }
  body += xref
  body += `trailer\n<< /Size ${id} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`

  void objs
  void encoder
  const blob = new Blob([body], { type: 'application/pdf' })
  return { blob, filename: `xArtists_Sponsor_${name}_${tier}.pdf` }
}

export function downloadSponsorDeckPdf(packId: PackId): void {
  const { blob, filename } = buildSponsorDeckPdf(packId)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2500)
}
