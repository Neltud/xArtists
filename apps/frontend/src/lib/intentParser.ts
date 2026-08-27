/**
 * Lightweight intent parser (rules) — Sovereign LIA-Parser subset.
 * No remote LLM. Maps FR/EN phrases → structured intent + route.
 */

export type IntentAction =
  | 'BUY_NFT'
  | 'BUY_AGENT'
  | 'VIEW_TRADING'
  | 'VIEW_WALLET'
  | 'VIEW_PACKS'
  | 'TIP'
  | 'STAKE'
  | 'SIMULATE'
  | 'DAO'
  | 'UNKNOWN'

export type StructuredIntent = {
  action: IntentAction
  raw: string
  confidence: number
  route: string
  summary: string
  payment_asset?: string
  notes?: string
  paper: true
}

const RULES: { re: RegExp; action: IntentAction; route: string; summary: string; conf: number }[] =
  [
    {
      re: /\b(agent|pack|oracle|sentinel)\b/i,
      action: 'BUY_AGENT',
      route: '/agents',
      summary: 'Ouvrir le catalogue Agents / packs',
      conf: 0.85,
    },
    {
      re: /\b(nft|œuvre|oeuvre|marketplace|acheter.*(art|nft))\b/i,
      action: 'BUY_NFT',
      route: '/marketplace',
      summary: 'Marketplace NFT (SC soon — preview only)',
      conf: 0.8,
    },
    {
      re: /\b(trad|lia|board|compound|signal)\b/i,
      action: 'VIEW_TRADING',
      route: '/trading',
      summary: 'Terminal LIA paper',
      conf: 0.9,
    },
    {
      re: /\b(wallet|solde|balance|portefeuille)\b/i,
      action: 'VIEW_WALLET',
      route: '/wallet',
      summary: 'Wallet utilisateur',
      conf: 0.9,
    },
    {
      re: /\b(mes packs|my packs|access)\b/i,
      action: 'VIEW_PACKS',
      route: '/my-packs',
      summary: 'My Packs',
      conf: 0.85,
    },
    {
      re: /\b(tip|don|donation)\b/i,
      action: 'TIP',
      route: '/tip',
      summary: 'Tip vers LIA ops',
      conf: 0.85,
    },
    {
      re: /\b(stake|staking)\b/i,
      action: 'STAKE',
      route: '/staking',
      summary: 'Staking (SC selon déploiement)',
      conf: 0.8,
    },
    {
      re: /\b(sim|simulation|lab)\b/i,
      action: 'SIMULATE',
      route: '/sim',
      summary: 'Simulation Lab',
      conf: 0.9,
    },
    {
      re: /\b(dao|vote|gouvern)\b/i,
      action: 'DAO',
      route: '/dao',
      summary: 'DAO $TRO',
      conf: 0.85,
    },
  ]

export function parseIntent(raw: string): StructuredIntent {
  const text = raw.trim()
  if (!text) {
    return {
      action: 'UNKNOWN',
      raw: text,
      confidence: 0,
      route: '/',
      summary: 'Intention vide',
      paper: true,
    }
  }
  for (const rule of RULES) {
    if (rule.re.test(text)) {
      const tro = /\b(tro|\$tro)\b/i.test(text)
      return {
        action: rule.action,
        raw: text,
        confidence: rule.conf,
        route: rule.route,
        summary: rule.summary,
        payment_asset: tro ? 'TRO' : undefined,
        notes: 'Paper orchestration — pas d’exécution omnichain automatique',
        paper: true,
      }
    }
  }
  return {
    action: 'UNKNOWN',
    raw: text,
    confidence: 0.3,
    route: '/sim',
    summary: 'Intention ambiguë — ouvrir Simulation Lab ou reformuler',
    notes: 'Essayez : trading, agent, nft, wallet, tip, stake, dao, sim',
    paper: true,
  }
}
