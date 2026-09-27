/**
 * Live MultiversX mainnet probe — UI must not freeze epoch / LIA balance.
 * Fail-closed: missing fields → treat SC as empty.
 * Resilient: /stats can succeed while /economics and /accounts are down
 * (post-recovery indexer, 23–24 Sep 2026). Never all-or-nothing.
 */

export const MVX_API = 'https://api.multiversx.com'

export const SUPERNOVA_ACTIVATION_EPOCH = 2233

export const PROBE_ADDRESSES = {
  liaOps: 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6',
  grokyversx: 'erd12c7f9wll0dcn26ax9fwrgp3yuswchyh9xwz8zs29hl9crgpn96gsdqq5gl',
  marketplace: 'erd1qqqqqqqqqqqqqpgqjzn7zjyevwez8n0zfevpvnrwyp2ln879yj7sj8354t',
  nftStaking: 'erd1qqqqqqqqqqqqqpgqmhtx5cctwwtatyaluycjfucre9y5vq2xyj7sqxr8cl',
  troGovernance: 'erd1qqqqqqqqqqqqqpgqrscvsxseyw04l0urzgnm2er5mxd2z64nyj7s6e0ca8',
  nftMinter: 'erd1qqqqqqqqqqqqqpgq00a2jzre64akaw4jx257gwwyfxxd8fzfyj7snyztkn',
} as const

export type ScProbe = {
  address: string
  codeHash: string | null
  codeEmpty: boolean
  balance: string
}

export type ProbeApiHealth = {
  stats: boolean
  economics: boolean
  accounts: boolean
  tokens: boolean
}

export type NetworkSnapshot = {
  probedAt: string
  ok: boolean
  degraded: boolean
  api: ProbeApiHealth
  epoch: number
  refreshRate: number
  roundsPerEpoch: number
  roundsPassed: number
  accounts: number
  transactions: number
  blocks: number
  egldPrice: number
  marketCap: number
  circulating: number
  staked: number
  apr: number
  liaOps: { balanceEgld: number; nonce: number; stale: boolean }
  grokyversx: { balanceEgld: number; nonce: number; stale: boolean }
  sc: {
    marketplace: ScProbe
    nftStaking: ScProbe
    troGovernance: ScProbe
    nftMinter: ScProbe
  }
  scStale: boolean
  tro: { supply: number; accounts: number; transactions: number; stale: boolean }
}

export function atomicToEgld(atomic: string | number | undefined | null): number {
  if (atomic === undefined || atomic === null || atomic === '') return 0
  const s = String(atomic)
  if (!/^\d+$/.test(s)) return 0
  if (s.length <= 18) return Number(s) / 1e18
  const whole = s.slice(0, -18)
  const frac = s.slice(-18)
  return Number(whole) + Number(frac) / 1e18
}

export function isCodeEmpty(codeHash: string | null | undefined): boolean {
  return !codeHash
}

export function supernovaAgeEpochs(epoch: number): number {
  return Math.max(0, epoch - SUPERNOVA_ACTIVATION_EPOCH)
}

export function liaOpsFunded(balanceEgld: number, min = 0.5): boolean {
  return Number.isFinite(balanceEgld) && balanceEgld >= min
}

type AccountJson = {
  balance?: string
  nonce?: number
  codeHash?: string | null
}

function asSc(address: string, j: AccountJson | null): ScProbe {
  const codeHash = j?.codeHash ?? null
  return { address, codeHash, codeEmpty: isCodeEmpty(codeHash), balance: j?.balance ?? '0' }
}

async function getJsonSoft<T>(path: string): Promise<T | null> {
  try {
    const r = await fetch(`${MVX_API}${path}`)
    if (!r.ok) return null
    return (await r.json()) as T
  } catch {
    return null
  }
}

/** Snapshot 27 Sep 2026 ~04:30 UTC — indexer healthy; SC empty; dest treasury null. */
export const FALLBACK_SNAPSHOT: NetworkSnapshot = {
  probedAt: '2026-09-27T04:30:00Z',
  ok: true,
  degraded: false,
  api: { stats: true, economics: true, accounts: true, tokens: true },
  epoch: 2245,
  refreshRate: 600,
  roundsPerEpoch: 144000,
  roundsPassed: 71588,
  accounts: 9263970,
  transactions: 629025259,
  blocks: 134872785,
  egldPrice: 4.58,
  marketCap: 141223943,
  circulating: 30834922,
  staked: 14330127,
  apr: 0.088122,
  liaOps: { balanceEgld: 2.0928, nonce: 1468, stale: false },
  grokyversx: { balanceEgld: 0, nonce: 8, stale: false },
  sc: {
    marketplace: asSc(PROBE_ADDRESSES.marketplace, null),
    nftStaking: asSc(PROBE_ADDRESSES.nftStaking, null),
    troGovernance: asSc(PROBE_ADDRESSES.troGovernance, null),
    nftMinter: asSc(PROBE_ADDRESSES.nftMinter, null),
  },
  scStale: false,
  tro: { supply: 476224, accounts: 562, transactions: 2788, stale: false },
}

type StatsJson = {
  epoch: number
  refreshRate: number
  roundsPerEpoch: number
  roundsPassed: number
  accounts: number
  transactions: number
  blocks: number
}

type EconJson = {
  price: number
  marketCap: number
  circulatingSupply: number
  staked: number
  apr: number
}

export async function probeNetwork(): Promise<NetworkSnapshot> {
  const [stats, econ, lia, grok, market, stake, gov, minter, tro] = await Promise.all([
    getJsonSoft<StatsJson>('/stats'),
    getJsonSoft<EconJson>('/economics'),
    getJsonSoft<AccountJson>(`/accounts/${PROBE_ADDRESSES.liaOps}`),
    getJsonSoft<AccountJson>(`/accounts/${PROBE_ADDRESSES.grokyversx}`),
    getJsonSoft<AccountJson>(`/accounts/${PROBE_ADDRESSES.marketplace}`),
    getJsonSoft<AccountJson>(`/accounts/${PROBE_ADDRESSES.nftStaking}`),
    getJsonSoft<AccountJson>(`/accounts/${PROBE_ADDRESSES.troGovernance}`),
    getJsonSoft<AccountJson>(`/accounts/${PROBE_ADDRESSES.nftMinter}`),
    getJsonSoft<{ supply?: string; accounts?: number; transactions?: number }>('/tokens/TRO-94c925'),
  ])

  const api: ProbeApiHealth = {
    stats: !!stats,
    economics: !!econ,
    accounts: !!lia,
    tokens: !!tro,
  }

  const scLive = !!(market && stake && gov && minter)

  return {
    probedAt: new Date().toISOString(),
    ok: api.stats,
    degraded: !api.economics || !api.accounts || !api.tokens,
    api,
    epoch: stats?.epoch ?? FALLBACK_SNAPSHOT.epoch,
    refreshRate: stats?.refreshRate ?? FALLBACK_SNAPSHOT.refreshRate,
    roundsPerEpoch: stats?.roundsPerEpoch ?? FALLBACK_SNAPSHOT.roundsPerEpoch,
    roundsPassed: stats?.roundsPassed ?? FALLBACK_SNAPSHOT.roundsPassed,
    accounts: stats?.accounts ?? FALLBACK_SNAPSHOT.accounts,
    transactions: stats?.transactions ?? FALLBACK_SNAPSHOT.transactions,
    blocks: stats?.blocks ?? FALLBACK_SNAPSHOT.blocks,
    egldPrice: econ?.price ?? FALLBACK_SNAPSHOT.egldPrice,
    marketCap: econ?.marketCap ?? FALLBACK_SNAPSHOT.marketCap,
    circulating: econ?.circulatingSupply ?? FALLBACK_SNAPSHOT.circulating,
    staked: econ?.staked ?? FALLBACK_SNAPSHOT.staked,
    apr: econ?.apr ?? FALLBACK_SNAPSHOT.apr,
    liaOps: lia
      ? { balanceEgld: atomicToEgld(lia.balance), nonce: lia.nonce ?? 0, stale: false }
      : { ...FALLBACK_SNAPSHOT.liaOps, stale: true },
    grokyversx: grok
      ? { balanceEgld: atomicToEgld(grok.balance), nonce: grok.nonce ?? 0, stale: false }
      : { ...FALLBACK_SNAPSHOT.grokyversx, stale: true },
    sc: {
      marketplace: asSc(PROBE_ADDRESSES.marketplace, market),
      nftStaking: asSc(PROBE_ADDRESSES.nftStaking, stake),
      troGovernance: asSc(PROBE_ADDRESSES.troGovernance, gov),
      nftMinter: asSc(PROBE_ADDRESSES.nftMinter, minter),
    },
    scStale: !scLive,
    tro: tro
      ? {
          supply: Number(tro.supply || 0),
          accounts: tro.accounts ?? 0,
          transactions: tro.transactions ?? 0,
          stale: false,
        }
      : { ...FALLBACK_SNAPSHOT.tro, stale: true },
  }
}


export type NextAction = {
  id: 'indexer' | 'fund' | 'treasury' | 'deploy' | 'verify'
  title: string
  detail: string
  severity: 'block' | 'wait' | 'ready'
}

/** Single next ops action. Dest treasury is the P0 as of 27 Sep 2026. */
export function computeNextAction(s: NetworkSnapshot): NextAction {
  if (!s.api.stats) {
    return {
      id: 'indexer',
      title: 'Indexer /stats down',
      detail: 'Aucun deploy tant que GET /stats ne répond pas 200.',
      severity: 'wait',
    }
  }
  if (!s.api.accounts || !s.api.economics) {
    return {
      id: 'indexer',
      title: 'Indexer partiel',
      detail: `/economics ${s.api.economics ? '200' : 'KO'} · /accounts ${s.api.accounts ? '200' : 'KO'}.`,
      severity: 'wait',
    }
  }
  if (s.liaOps.stale || !liaOpsFunded(s.liaOps.balanceEgld)) {
    return {
      id: 'fund',
      title: 'LIA Ops sous-financé',
      detail: `${s.liaOps.balanceEgld.toFixed(4)} EGLD${s.liaOps.stale ? ' (stale)' : ''}.`,
      severity: 'wait',
    }
  }
  return {
    id: 'treasury',
    title: 'Renseigner dest treasury',
    detail:
      'mission / reserve / reward / ops = null. Indexer healthy, LIA funded, nonce 1468 idle. Pas de wasm tant que les destinations ne sont pas posées.',
    severity: 'block',
  }
}
