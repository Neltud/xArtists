/**
 * Agent 8008 — intents Vellum / ops (paper → micro-tx quand SC ON).
 * Pas de PEM dans le front. Signatures : wallet user ou Vellum own PEM hors dApp.
 */

export const AGENT_8008 = {
  id: '8008',
  name: 'Agent 8008',
  role: 'router_intents',
  description:
    'Route les intents LIA (BUY_NFT, VENUE_RENTAL, STAKE, VOTE) vers workflows Vellum. Paper par défaut.',
  endpoints: {
    /** MCP / Vellum workflow id — à binder en ops */
    vellumWorkflow: 'xartists-8008-intents',
    mcp: null as string | null,
  },
  intents: [
    'BUY_NFT',
    'VENUE_RENTAL',
    'VENUE_REGISTER',
    'STAKE_TRO_LP',
    'UNSTAKE_TRO_LP',
    'VOTE_DAO',
    'TIP_LIA',
    'SLOT_SPIN',
    'ADS_BID',
  ] as const,
  risk: {
    mainnetTx: false,
    requiresGuardian: true,
    paperUntilGoLive: true,
  },
} as const

export type Agent8008Intent = (typeof AGENT_8008.intents)[number]

export function isAgent8008Intent(x: string): x is Agent8008Intent {
  return (AGENT_8008.intents as readonly string[]).includes(x)
}

/** Dispatch navigateur → écouté par LIA / overlay / Vellum bridge */
export function dispatch8008(intent: Agent8008Intent, payload: Record<string, unknown> = {}) {
  window.dispatchEvent(
    new CustomEvent('lia-intent', {
      detail: {
        lip: {
          type: intent,
          agent: AGENT_8008.id,
          paper: true,
          ...payload,
          raw: payload.raw || `${intent} via 8008`,
        },
      },
    }),
  )
}
