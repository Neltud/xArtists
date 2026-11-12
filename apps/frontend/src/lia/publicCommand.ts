/**
 * Public command bar. Language in, route or refusal out.
 * Never builds a transaction and never flips a live flag.
 */
import { upbitPosture } from '../lib/protocolPulse'

export type PublicCommandLane = 'read' | 'paper' | 'blocked'

export type PublicCommand = {
  lane: PublicCommandLane
  title: string
  detail: string
  href: string | null
}

/** Hard-closed in the public client. A CI variable cannot reopen this. */
export function publicOpsBroadcastAllowed(): false {
  return false
}

const BLOCKED =
  /\b(achet\w*|buy|swap|trade|trad\w*|mint|stak\w*|claim\s*fees|claimfees|payer|pay\b|paybox|bridge|bridg\w*|liquidat\w*|withdraw|retrait)\b/i

function postureLine(now: number): string {
  const p = upbitPosture(now)
  return (
    `Revue EGLD Upbit/Bithumb ouverte jusqu'au 16–20 nov 2026 ` +
    `(${p.daysUntilDecisionWeek} j avant le 16 nov, ${p.daysUntilHardEnd} j avant le 21 nov). ` +
    'Aucune intention de cette barre ne signe et ne broadcast.'
  )
}

export function classifyPublicCommand(raw: string, now = Date.now()): PublicCommand {
  const text = raw.replace(/\s+/g, ' ').trim()
  const clock = postureLine(now)
  if (!text) {
    return {
      lane: 'paper',
      title: 'Command bar en attente',
      detail: `Décris une visite : musée, studio, marché, packs ou $TRO. ${clock}`,
      href: null,
    }
  }
  if (BLOCKED.test(text)) {
    return {
      lane: 'blocked',
      title: 'Intention refusée',
      detail:
        'Achat, swap, mint, staking, paiement, bridge, retrait et claimFees restent fermés. ' +
        'Le client public ne prépare pas cette transaction. ' +
        clock,
      href: '/go-live',
    }
  }
  if (/mus[eé]e|museum|galerie\s*3d/i.test(text)) {
    return {
      lane: 'read',
      title: 'Musée · lecture',
      detail: `Parcours public, sans wallet. ${clock}`,
      href: '/museum',
    }
  }
  if (/studio|cr[eé]er|sculpt/i.test(text)) {
    return {
      lane: 'read',
      title: 'Studio · préparation',
      detail: `Le studio se visite. Le mint mainnet n'est pas lancé depuis cette barre. ${clock}`,
      href: '/studio',
    }
  }
  if (/march[eé]|market|nft|ench[eè]re|auction/i.test(text)) {
    return {
      lane: 'read',
      title: 'Marché · lecture',
      detail: `Grille publique. Un prix affiché n'est pas une offre exécutable. ${clock}`,
      href: '/marketplace',
    }
  }
  if (/\$tro|\btro\b|gouvernance|dao/i.test(text)) {
    return {
      lane: 'read',
      title: '$TRO · découverte',
      detail: `Page de lecture. Pas de vente directe, pas de bridge Solana. ${clock}`,
      href: '/tro/sale',
    }
  }
  if (/pack|agent|pulse|yield|sentinel|lia|xorus|signal/i.test(text)) {
    return {
      lane: 'paper',
      title: 'LIA · paper',
      detail: `Les packs et le board se lisent. Aucun ordre n'est envoyé. ${clock}`,
      href: '/agents',
    }
  }
  return {
    lane: 'paper',
    title: 'Intention conservée en paper',
    detail: `Je ne reconnais pas une action exécutable. Rien n'est signé. ${clock}`,
    href: '/go-live',
  }
}
