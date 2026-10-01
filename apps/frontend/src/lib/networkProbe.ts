/**
 * Live MultiversX mainnet probe — UI must not freeze epoch / LIA balance.
 * Fail-closed: missing fields → treat SC as empty.
 * Addresses: live product SCs (2026-09-29 deploy), not the legacy empty placeholders.
 */

import {
  GROKYVERSX_WALLET,
  LIA_OPS,
  MAINNET_ADDRESSES,
  TRO_TOKEN_ID_DEFAULT,
} from '../config/contracts'

export const MVX_API = 'https://api.multiversx.com'

export const SUPERNOVA_ACTIVATION_EPOCH = 2233

export const PROBE_ADDRESSES = {
  liaOps: LIA_OPS,
  grokyversx: GROKYVERSX_WALLET,
  marketplace: MAINNET_ADDRESSES.nft_marketplace,
  agents: MAINNET_ADDRESSES.agents_marketplace,
  nftStaking: MAINNET_ADDRESSES.nft_staking,
  troStaking: MAINNET_ADDRESSES.tro_staking,
  troGovernance: MAINNET_ADDRESSES.tro_governance,
  venue: MAINNET_ADDRESSES.venue_split,
  slot: MAINNET_ADDRESSES.slot_casino,
  treasury: MAINNET_ADDRESSES.treasury_splitter,
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
    agents: ScProbe
    nftStaking: ScProbe
    troStaking: ScProbe
    troGovernance: ScProbe
    venue: ScProbe
    slot: ScProbe
    treasury: ScProbe
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

/** Last-known fallback — 2026-10-01 probe. Never used as "live" chrome. */
export const FALLBACK_SNAPSHOT: NetworkSnapshot = {
  probedAt: '2026-10-01T15:00:00Z',
  ok: false,
  degraded: true,
  api: { stats: false, economics: false, accounts: false, tokens: false },
  epoch: 2249,
  refreshRate: 600,
  roundsPerEpoch: 144000,
  roundsPassed: 134625,
  accounts: 9265958,
  transactions: 629788386,
  blocks: 137415894,
  egldPrice: 4.45,
  marketCap: 137340452,
  circulating: 30863023,
  staked: 14320896,
  apr: 0.088503,
  liaOps: { balanceEgld: 2.0932, nonce: 1468, stale: true },
  grokyversx: { balanceEgld: 0, nonce: 8, stale: true },
  sc: {
    marketplace: asSc(PROBE_ADDRESSES.marketplace, null),
    agents: asSc(PROBE_ADDRESSES.agents, null),
    nftStaking: asSc(PROBE_ADDRESSES.nftStaking, null),
    troStaking: asSc(PROBE_ADDRESSES.troStaking, null),
    troGovernance: asSc(PROBE_ADDRESSES.troGovernance, null),
    venue: asSc(PROBE_ADDRESSES.venue, null),
    slot: asSc(PROBE_ADDRESSES.slot, null),
    treasury: asSc(PROBE_ADDRESSES.treasury, null),
  },
  scStale: true,
  tro: { supply: 476224, accounts: 565, transactions: 2797, stale: true },
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
  const [stats, econ, lia, grok, market, agents, stake, troStake, gov, venue, slot, treasury, tro] =
    await Promise.all([
      getJsonSoft<StatsJson>('/stats'),
      getJsonSoft<EconJson>('/economics'),
      getJsonSoft<AccountJson>(`/accounts/${PROBE_ADDRESSES.liaOps}`),
      getJsonSoft<AccountJson>(`/accounts/${PROBE_ADDRESSES.grokyversx}`),
      getJsonSoft<AccountJson>(`/accounts/${PROBE_ADDRESSES.marketplace}`),
      getJsonSoft<AccountJson>(`/accounts/${PROBE_ADDRESSES.agents}`),
      getJsonSoft<AccountJson>(`/accounts/${PROBE_ADDRESSES.nftStaking}`),
      getJsonSoft<AccountJson>(`/accounts/${PROBE_ADDRESSES.troStaking}`),
      getJsonSoft<AccountJson>(`/accounts/${PROBE_ADDRESSES.troGovernance}`),
      getJsonSoft<AccountJson>(`/accounts/${PROBE_ADDRESSES.venue}`),
      getJsonSoft<AccountJson>(`/accounts/${PROBE_ADDRESSES.slot}`),
      getJsonSoft<AccountJson>(`/accounts/${PROBE_ADDRESSES.treasury}`),
      getJsonSoft<{ supply?: string; accounts?: number; transactions?: number }>(
        `/tokens/${TRO_TOKEN_ID_DEFAULT}`,
      ),
    ])

  const api: ProbeApiHealth = {
    stats: !!stats,
    economics: !!econ,
    accounts: !!lia,
    tokens: !!tro,
  }

  const scLive = !!(market && agents && stake && slot)

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
      agents: asSc(PROBE_ADDRESSES.agents, agents),
      nftStaking: asSc(PROBE_ADDRESSES.nftStaking, stake),
      troStaking: asSc(PROBE_ADDRESSES.troStaking, troStake),
      troGovernance: asSc(PROBE_ADDRESSES.troGovernance, gov),
      venue: asSc(PROBE_ADDRESSES.venue, venue),
      slot: asSc(PROBE_ADDRESSES.slot, slot),
      treasury: asSc(PROBE_ADDRESSES.treasury, treasury),
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
