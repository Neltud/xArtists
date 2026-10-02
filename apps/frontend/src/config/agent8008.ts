/**
 * Agent 8008 — intents Vellum / ops (paper → micro-tx quand SC ON).
 */

export const AGENT_8008 = {
  id: '8008',
  name: 'Agent 8008',
  codename: 'Execution Sentinel',
  role: 'router_intents',
  description: 'Route les intents LIA vers workflows. Paper par défaut.',
  endpoints: {
    vellumWorkflow: 'xartists-8008-intents',
    mcp: null as string | null,
  },
  intents: [
    'BUY_NFT',
    'VENUE_RENTAL',
    'VENUE_REGISTER',
    'VENUE_RENT_PAY',
    'STAKE_TRO_LP',
    'UNSTAKE_TRO_LP',
    'VOTE_DAO',
    'TIP_LIA',
    'SLOT_SPIN',
    'ADS_BID',
    'PULSE_HYPE',
    'STUDIO_MINT_PAPER',
    'AGENT_NFT_STAKE',
    'AGENT_NFT_UNSTAKE',
    'AGENT_CLONE_CLAIM',
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

export function dispatch8008(intent: Agent8008Intent, payload: Record<string, unknown> = {}) {
  window.dispatchEvent(
    new CustomEvent('lia-intent', {
      detail: {
        lip: {
          type: intent,
          agent: AGENT_8008.id,
          paper: true,
          ...payload,
          raw: (payload.raw as string) || `${intent} via 8008`,
        },
      },
    }),
  )
}
