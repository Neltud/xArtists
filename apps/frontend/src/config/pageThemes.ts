/**
 * Per-route visual themes for the dApp shell.
 * Each page gets a unique gradient ambient + optional Tuduri panel rotation.
 * Decorative only — no market claims.
 */
import { TUDURI_WORKS } from './tuduriAtelier'

export type PageThemeId =
  | 'home'
  | 'trading'
  | 'market'
  | 'marketplace'
  | 'museum'
  | 'studio'
  | 'agents'
  | 'tours'
  | 'dao'
  | 'wallet'
  | 'portfolio'
  | 'staking'
  | 'tro'
  | 'burnify'
  | 'hatom'
  | 'sale'
  | 'demo'
  | 'sim'
  | 'ads'
  | 'legal'
  | 'entity'
  | 'default'

export type PageTheme = {
  id: PageThemeId
  label: string
  /** CSS custom properties applied on body / backdrop */
  vars: {
    '--page-a': string
    '--page-b': string
    '--page-c': string
    '--page-glow': string
  }
  /** Indices into TUDURI_WORKS for the ambient strip */
  panelIndices: [number, number, number, number]
  /** Optional accent for nav-active affinity */
  accent: string
}

const W = TUDURI_WORKS.length

function panels(a: number, b: number, c: number, d: number): [number, number, number, number] {
  return [a % W, b % W, c % W, d % W]
}

export const PAGE_THEMES: Record<PageThemeId, PageTheme> = {
  home: {
    id: 'home',
    label: 'Accueil',
    vars: {
      '--page-a': 'rgba(139, 92, 246, 0.22)',
      '--page-b': 'rgba(34, 211, 238, 0.12)',
      '--page-c': 'rgba(251, 113, 133, 0.08)',
      '--page-glow': 'rgba(139, 92, 246, 0.35)',
    },
    panelIndices: panels(0, 1, 2, 3),
    accent: '#8b5cf6',
  },
  trading: {
    id: 'trading',
    label: 'Trading LIA',
    vars: {
      '--page-a': 'rgba(16, 185, 129, 0.18)',
      '--page-b': 'rgba(34, 211, 238, 0.14)',
      '--page-c': 'rgba(245, 158, 11, 0.08)',
      '--page-glow': 'rgba(16, 185, 129, 0.4)',
    },
    panelIndices: panels(3, 0, 4, 1),
    accent: '#10b981',
  },
  market: {
    id: 'market',
    label: 'Analyse',
    vars: {
      '--page-a': 'rgba(56, 189, 248, 0.16)',
      '--page-b': 'rgba(99, 102, 241, 0.12)',
      '--page-c': 'rgba(14, 165, 233, 0.08)',
      '--page-glow': 'rgba(56, 189, 248, 0.35)',
    },
    panelIndices: panels(1, 4, 0, 2),
    accent: '#38bdf8',
  },
  marketplace: {
    id: 'marketplace',
    label: 'Marketplace',
    vars: {
      '--page-a': 'rgba(244, 114, 182, 0.16)',
      '--page-b': 'rgba(167, 139, 250, 0.14)',
      '--page-c': 'rgba(251, 113, 133, 0.1)',
      '--page-glow': 'rgba(244, 114, 182, 0.35)',
    },
    panelIndices: panels(2, 5, 1, 0),
    accent: '#f472b6',
  },
  museum: {
    id: 'museum',
    label: 'Musée',
    vars: {
      '--page-a': 'rgba(212, 160, 84, 0.2)',
      '--page-b': 'rgba(196, 92, 62, 0.14)',
      '--page-c': 'rgba(243, 230, 212, 0.06)',
      '--page-glow': 'rgba(212, 160, 84, 0.4)',
    },
    panelIndices: panels(0, 2, 5, 3),
    accent: '#d4a054',
  },
  studio: {
    id: 'studio',
    label: 'Studio',
    vars: {
      '--page-a': 'rgba(196, 92, 62, 0.2)',
      '--page-b': 'rgba(212, 160, 84, 0.12)',
      '--page-c': 'rgba(42, 111, 115, 0.1)',
      '--page-glow': 'rgba(196, 92, 62, 0.38)',
    },
    panelIndices: panels(5, 0, 1, 4),
    accent: '#c45c3e',
  },
  agents: {
    id: 'agents',
    label: 'Agents',
    vars: {
      '--page-a': 'rgba(124, 58, 237, 0.2)',
      '--page-b': 'rgba(6, 182, 212, 0.12)',
      '--page-c': 'rgba(167, 139, 250, 0.1)',
      '--page-glow': 'rgba(124, 58, 237, 0.4)',
    },
    panelIndices: panels(4, 1, 3, 0),
    accent: '#7c3aed',
  },
  tours: {
    id: 'tours',
    label: 'Art Tours',
    vars: {
      '--page-a': 'rgba(45, 212, 191, 0.16)',
      '--page-b': 'rgba(251, 191, 36, 0.1)',
      '--page-c': 'rgba(52, 211, 153, 0.08)',
      '--page-glow': 'rgba(45, 212, 191, 0.35)',
    },
    panelIndices: panels(1, 3, 5, 2),
    accent: '#2dd4bf',
  },
  dao: {
    id: 'dao',
    label: 'DAO',
    vars: {
      '--page-a': 'rgba(99, 102, 241, 0.18)',
      '--page-b': 'rgba(236, 72, 153, 0.1)',
      '--page-c': 'rgba(129, 140, 248, 0.08)',
      '--page-glow': 'rgba(99, 102, 241, 0.38)',
    },
    panelIndices: panels(2, 0, 4, 5),
    accent: '#6366f1',
  },
  wallet: {
    id: 'wallet',
    label: 'Wallet',
    vars: {
      '--page-a': 'rgba(34, 197, 94, 0.14)',
      '--page-b': 'rgba(59, 130, 246, 0.12)',
      '--page-c': 'rgba(16, 185, 129, 0.08)',
      '--page-glow': 'rgba(34, 197, 94, 0.32)',
    },
    panelIndices: panels(3, 5, 0, 1),
    accent: '#22c55e',
  },
  portfolio: {
    id: 'portfolio',
    label: 'Portfolio',
    vars: {
      '--page-a': 'rgba(14, 165, 233, 0.16)',
      '--page-b': 'rgba(168, 85, 247, 0.12)',
      '--page-c': 'rgba(56, 189, 248, 0.08)',
      '--page-glow': 'rgba(14, 165, 233, 0.35)',
    },
    panelIndices: panels(0, 4, 2, 5),
    accent: '#0ea5e9',
  },
  staking: {
    id: 'staking',
    label: 'Staking',
    vars: {
      '--page-a': 'rgba(234, 179, 8, 0.14)',
      '--page-b': 'rgba(249, 115, 22, 0.1)',
      '--page-c': 'rgba(202, 138, 4, 0.08)',
      '--page-glow': 'rgba(234, 179, 8, 0.35)',
    },
    panelIndices: panels(5, 1, 3, 2),
    accent: '#eab308',
  },
  tro: {
    id: 'tro',
    label: '$TRO',
    vars: {
      '--page-a': 'rgba(168, 85, 247, 0.18)',
      '--page-b': 'rgba(236, 72, 153, 0.12)',
      '--page-c': 'rgba(192, 132, 252, 0.08)',
      '--page-glow': 'rgba(168, 85, 247, 0.4)',
    },
    panelIndices: panels(1, 2, 0, 4),
    accent: '#a855f7',
  },
  burnify: {
    id: 'burnify',
    label: 'Burnify',
    vars: {
      '--page-a': 'rgba(239, 68, 68, 0.18)',
      '--page-b': 'rgba(249, 115, 22, 0.12)',
      '--page-c': 'rgba(220, 38, 38, 0.08)',
      '--page-glow': 'rgba(239, 68, 68, 0.4)',
    },
    panelIndices: panels(4, 5, 1, 0),
    accent: '#ef4444',
  },
  hatom: {
    id: 'hatom',
    label: 'Hatom',
    vars: {
      '--page-a': 'rgba(20, 184, 166, 0.16)',
      '--page-b': 'rgba(59, 130, 246, 0.1)',
      '--page-c': 'rgba(13, 148, 136, 0.08)',
      '--page-glow': 'rgba(20, 184, 166, 0.35)',
    },
    panelIndices: panels(2, 3, 5, 1),
    accent: '#14b8a6',
  },
  sale: {
    id: 'sale',
    label: 'Sale',
    vars: {
      '--page-a': 'rgba(251, 191, 36, 0.18)',
      '--page-b': 'rgba(244, 114, 182, 0.12)',
      '--page-c': 'rgba(253, 224, 71, 0.08)',
      '--page-glow': 'rgba(251, 191, 36, 0.4)',
    },
    panelIndices: panels(0, 5, 3, 2),
    accent: '#fbbf24',
  },
  demo: {
    id: 'demo',
    label: 'Démo',
    vars: {
      '--page-a': 'rgba(34, 211, 238, 0.16)',
      '--page-b': 'rgba(139, 92, 246, 0.14)',
      '--page-c': 'rgba(165, 243, 252, 0.06)',
      '--page-glow': 'rgba(34, 211, 238, 0.38)',
    },
    panelIndices: panels(3, 1, 4, 5),
    accent: '#22d3ee',
  },
  sim: {
    id: 'sim',
    label: 'Simulation',
    vars: {
      '--page-a': 'rgba(129, 140, 248, 0.16)',
      '--page-b': 'rgba(52, 211, 153, 0.1)',
      '--page-c': 'rgba(99, 102, 241, 0.08)',
      '--page-glow': 'rgba(129, 140, 248, 0.35)',
    },
    panelIndices: panels(4, 2, 0, 3),
    accent: '#818cf8',
  },
  ads: {
    id: 'ads',
    label: 'Ads',
    vars: {
      '--page-a': 'rgba(251, 146, 60, 0.14)',
      '--page-b': 'rgba(244, 63, 94, 0.1)',
      '--page-c': 'rgba(253, 186, 116, 0.06)',
      '--page-glow': 'rgba(251, 146, 60, 0.32)',
    },
    panelIndices: panels(5, 3, 1, 4),
    accent: '#fb923c',
  },
  legal: {
    id: 'legal',
    label: 'Légal',
    vars: {
      '--page-a': 'rgba(148, 163, 184, 0.12)',
      '--page-b': 'rgba(100, 116, 139, 0.1)',
      '--page-c': 'rgba(71, 85, 105, 0.06)',
      '--page-glow': 'rgba(148, 163, 184, 0.25)',
    },
    panelIndices: panels(2, 4, 0, 1),
    accent: '#94a3b8',
  },
  entity: {
    id: 'entity',
    label: 'Entity map',
    vars: {
      '--page-a': 'rgba(6, 182, 212, 0.14)',
      '--page-b': 'rgba(99, 102, 241, 0.12)',
      '--page-c': 'rgba(8, 145, 178, 0.08)',
      '--page-glow': 'rgba(6, 182, 212, 0.32)',
    },
    panelIndices: panels(1, 0, 5, 3),
    accent: '#06b6d4',
  },
  default: {
    id: 'default',
    label: 'xArtists',
    vars: {
      '--page-a': 'rgba(139, 92, 246, 0.18)',
      '--page-b': 'rgba(34, 211, 238, 0.1)',
      '--page-c': 'rgba(251, 113, 133, 0.06)',
      '--page-glow': 'rgba(139, 92, 246, 0.3)',
    },
    panelIndices: panels(0, 1, 2, 3),
    accent: '#8b5cf6',
  },
}

/** Map pathname (hash router) → theme id */
export function themeIdFromPath(pathname: string): PageThemeId {
  const p = (pathname || '/').replace(/\/+$/, '') || '/'
  if (p === '/') return 'home'
  if (p.startsWith('/trading')) return 'trading'
  if (p.startsWith('/market') && !p.startsWith('/marketplace')) return 'market'
  if (p.startsWith('/marketplace')) return 'marketplace'
  if (p.startsWith('/museum') || p.startsWith('/gallery') || p.startsWith('/musee')) return 'museum'
  if (p.startsWith('/studio')) return 'studio'
  if (p.startsWith('/agents') || p.startsWith('/my-packs')) return 'agents'
  if (p.startsWith('/tours')) return 'tours'
  if (p.startsWith('/dao')) return 'dao'
  if (p.startsWith('/wallet') || p.startsWith('/tip')) return 'wallet'
  if (p.startsWith('/portfolio')) return 'portfolio'
  if (p.startsWith('/staking') || p.startsWith('/lp')) return 'staking'
  if (p.startsWith('/tro')) return 'tro'
  if (p.startsWith('/burnify')) return 'burnify'
  if (p.startsWith('/hatom')) return 'hatom'
  if (p.startsWith('/sale')) return 'sale'
  if (p.startsWith('/demo') || p.startsWith('/go-live')) return 'demo'
  if (p.startsWith('/sim') || p.startsWith('/simulation') || p.startsWith('/slot')) return 'sim'
  if (p.startsWith('/ads')) return 'ads'
  if (p.startsWith('/legal') || p.startsWith('/mentions')) return 'legal'
  if (p.startsWith('/entity') || p.startsWith('/org') || p.startsWith('/sitemap')) return 'entity'
  if (p.startsWith('/editions') || p.startsWith('/soul')) return 'default'
  return 'default'
}

export function getPageTheme(pathname: string): PageTheme {
  return PAGE_THEMES[themeIdFromPath(pathname)]
}
