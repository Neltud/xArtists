/**
 * Deck Sponsoring PDF (4 pages) — sans dépendance externe.
 * PULSE / YIELD / SENTINEL · tiers Silver / Gold / Platinum.
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

/** Minimal PDF 1.4 text writer (Helvetica). */
function escapePdf(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function pageContent(lines: string[], pageW = 595, pageH = 842): string {
  const ops: string[] = ['BT', '/F1 11 Tf', '14 TL', `50 ${pageH - 56} Td`]
  lines.forEach((line, i) => {
    if (i === 0) {
      ops.push('/F1 16 Tf', `(${escapePdf(line)}) Tj`, '/F1 11 Tf', '0 -22 Td')
    } else {
      ops.push(`(${escapePdf(line)}) Tj`, '0 -16 Td')
    }
  })
  ops.push('ET')
  return ops.join('\n')
}

function buildPdf(pages: string[][]): Blob {
  const pageW = 595
  const pageH = 842
  const objects: string[] = []
  // 1 catalog, 2 pages tree, then per page: page obj + content
  const kids: string[] = []
  let objId = 3

  const contentIds: number[] = []
  const pageIds: number[] = []

  pages.forEach(lines => {
    const stream = pageContent(lines, pageW, pageH)
    const contentId = objId++
    contentIds.push(contentId)
    objects.push(
      `${contentId} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
    )
    const pageId = objId++
    pageIds.push(pageId)
    kids.push(`${pageId} 0 R`)
    objects.push(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents ${contentId} 0 R /Resources << /Font << /F1 3 0 R >> >> >>\nendobj\n`,
    )
  })

  // Font object id was claimed wrong - rebuild cleanly
  // Simpler sequential build:
  return buildPdfSequential(pages)
}

function buildPdfSequential(pages: string[][]): Blob {
  const pageW = 595
  const pageH = 842
  const parts: string[] = ['%PDF-1.4\n']
  const offsets: number[] = [0]

  const add = (s: string) => {
    offsets.push(parts.join('').length)
    parts.push(s)
  }

  // We'll collect objects in order: 1 font, 2 catalog, 3 pages, then page/content pairs
  // Actually standard: 1 Catalog, 2 Pages, 3 Font, 4.. content/pages

  const contentStreams = pages.map(lines => pageContent(lines, pageW, pageH))
  const n = pages.length

  // Object 1: Catalog
  // Object 2: Pages
  // Object 3: Font
  // Objects 4..: alternating content, page for each

  let body = ''
  const off: number[] = []
  const write = (s: string) => {
    off.push(body.length)
    body += s
  }

  write('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')

  const pageObjIds: number[] = []
  let nextId = 4
  const contentObjIds: number[] = []
  for (let i = 0; i < n; i++) {
    contentObjIds.push(nextId++)
    pageObjIds.push(nextId++)
  }

  write(
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjIds.map(id => `${id} 0 R`).join(' ')}] /Count ${n} >>\nendobj\n`,
  )
  write('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n')

  for (let i = 0; i < n; i++) {
    const stream = contentStreams[i]
    write(
      `${contentObjIds[i]} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
    )
    write(
      `${pageObjIds[i]} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents ${contentObjIds[i]} 0 R /Resources << /Font << /F1 3 0 R >> >> >>\nendobj\n`,
    )
  }

  const xrefPos = body.length
  let xref = `xref\n0 ${nextId}\n0000000000 65535 f \n`
  // rebuild offsets properly
  const objs = body.split(/(?=\d+ 0 obj)/)
  // simpler: recompute by scanning
  const reOff: number[] = [0]
  let pos = 0
  const full = body
  const re = /\d+ 0 obj/g
  let m: RegExpExecArray | null
  while ((m = re.exec(full))) {
    reOff.push(m.index)
  }
  // reOff[1] is obj1...
  xref = `xref\n0 ${nextId}\n0000000000 65535 f \n`
  for (let i = 1; i < nextId; i++) {
    const o = reOff[i] ?? 0
    xref += `${String(o).padStart(10, '0')} 00000 n \n`
  }

  const trailer = `trailer\n<< /Size ${nextId} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`
  const pdf = `%PDF-1.4\n${body}${xref}${trailer}`
  return new Blob([pdf], { type: 'application/pdf' })
}

export function buildSponsorDeckPdf(packId: PackId): { blob: Blob; filename: string } {
  const pack = AGENT_PACKS.find(p => p.id === packId)
  const name = pack?.name || packId.toUpperCase()
  const tier = PACK_TIER[packId]
  const tierName = TIER_LABEL[tier]
  const ents = (pack?.entitlements || []).slice(0, 8)
  const price =
    pack?.priceEur?.list != null
      ? `~${pack.priceEur.list} EUR / ~${pack.priceEgld?.list ?? '—'} EGLD (liste)`
      : 'Tarif liste — voir /agents'

  const pages: string[][] = [
    [
      `xArtists — Dossier Sponsor B2B`,
      `Pack ${name} · Niveau ${tierName}`,
      ``,
      `Document non contractuel · paper-first · non-custodial.`,
      `MultiversX · NFT packs PULSE / YIELD / SENTINEL.`,
      ``,
      `Contact parcours: /agents · Command Center: /command-center`,
      `LIA Hub: lecture signaux · execution via xPortal uniquement.`,
    ],
    [
      `1. Positionnement`,
      `${name}: ${pack?.tagline || ''}`,
      ``,
      `Tier suggéré: ${tierName}`,
      `- Silver: entrée salle + lecture`,
      `- Gold: hub command + tape multi-actifs`,
      `- Platinum: suite complète + priorité roadmap`,
      ``,
      `Prix indicatif: ${price}`,
    ],
    [
      `2. Inclus (extrait)`,
      ...ents.map(e => `- ${e}`),
      ents.length === 0 ? '- Voir fiche pack sur /agents' : '',
      ``,
      `Gates: ownership NFT pack · zero-trust access API si configuré.`,
    ],
    [
      `3. Engagement & limites`,
      `- Pas de conseil financier.`,
      `- LIA en paper-first par défaut (pas de live trading autonome).`,
      `- Mint / listing marketplace: sous SC déployés + codehash Pages.`,
      `- Sponsoring B2B: branding, accès démo, roadmap — hors custody fonds.`,
      ``,
      `4. Prochaine étape`,
      `Ouvrir /agents pour choisir le pack et finaliser via wallet.`,
      `PDF généré côté client · ${new Date().toISOString().slice(0, 10)}`,
    ],
  ].map(p => p.filter(line => line !== undefined)) as string[][]

  const blob = buildPdfSequential(pages)
  return {
    blob,
    filename: `xArtists_Sponsor_${name}_${tierName}.pdf`,
  }
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
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}

// silence unused
void buildPdf
