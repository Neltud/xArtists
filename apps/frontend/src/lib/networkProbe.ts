/**
 * Live MultiversX mainnet probe — UI must not freeze epoch / LIA balance.
 * Fail-closed: missing fields → treat SC as empty.
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

export type NetworkSnapshot = {
  probedAt: string
  ok: boolean
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
  liaOps: { balanceEgld: number; nonce: number }
  grokyversx: { balanceEgld: number; nonce: number }
  sc: {
    marketplace: ScProbe
    nftStaking: ScProbe
    troGovernance: ScProbe
    nftMinter: ScProbe
  }
  tro: { supply: number; accounts: number; transactions: number }
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

async function getJson<T>(path: string): Promise<T> {
  const r = await fetch(`${MVX_API}${path}`)
  if (!r.ok) throw new Error(`${path} ${r.status}`)
  return r.json() as Promise<T>
}

/** Snapshot 19 Sep 2026 ~04:35 UTC */
export const FALLBACK_SNAPSHOT: NetworkSnapshot = {
  probedAt: '2026-09-19T04:35:00Z',
  ok: false,
  epoch: 2241,
  refreshRate: 600,
  roundsPerEpoch: 144000,
  roundsPassed: 63226,
  accounts: 9262882,
  transactions: 628518764,
  blocks: 133351539,
  egldPrice: 4.09,
  marketCap: 126041252,
  circulating: 30816932,
  staked: 14356598,
  apr: 0.088205,
  liaOps: { balanceEgld: 2.0928, nonce: 1468 },
  grokyversx: { balanceEgld: 0, nonce: 8 },
  sc: {
    marketplace: asSc(PROBE_ADDRESSES.marketplace, null),
    nftStaking: asSc(PROBE_ADDRESSES.nftStaking, null),
    troGovernance: asSc(PROBE_ADDRESSES.troGovernance, null),
    nftMinter: asSc(PROBE_ADDRESSES.nftMinter, null),
  },
  tro: { supply: 476224, accounts: 562, transactions: 2788 },
}

export async function probeNetwork(): Promise<NetworkSnapshot> {
  try {
    const [stats, econ, lia, grok, market, stake, gov, minter, tro] = await Promise.all([
      getJson<{
        epoch: number
        refreshRate: number
        roundsPerEpoch: number
        roundsPassed: number
        accounts: number
        transactions: number
        blocks: number
      }>('/stats'),
      getJson<{
        price: number
        marketCap: number
        circulatingSupply: number
        staked: number
        apr: number
      }>('/economics'),
      getJson<AccountJson>(`/accounts/${PROBE_ADDRESSES.liaOps}`),
      getJson<AccountJson>(`/accounts/${PROBE_ADDRESSES.grokyversx}`),
      getJson<AccountJson>(`/accounts/${PROBE_ADDRESSES.marketplace}`),
      getJson<AccountJson>(`/accounts/${PROBE_ADDRESSES.nftStaking}`),
      getJson<AccountJson>(`/accounts/${PROBE_ADDRESSES.troGovernance}`),
      getJson<AccountJson>(`/accounts/${PROBE_ADDRESSES.nftMinter}`),
      getJson<{ supply?: string; accounts?: number; transactions?: number }>('/tokens/TRO-94c925'),
    ])

    return {
      probedAt: new Date().toISOString(),
      ok: true,
      epoch: stats.epoch,
      refreshRate: stats.refreshRate,
      roundsPerEpoch: stats.roundsPerEpoch,
      roundsPassed: stats.roundsPassed,
      accounts: stats.accounts,
      transactions: stats.transactions,
      blocks: stats.blocks,
      egldPrice: econ.price,
      marketCap: econ.marketCap,
      circulating: econ.circulatingSupply,
      staked: econ.staked,
      apr: econ.apr,
      liaOps: { balanceEgld: atomicToEgld(lia.balance), nonce: lia.nonce ?? 0 },
      grokyversx: { balanceEgld: atomicToEgld(grok.balance), nonce: grok.nonce ?? 0 },
      sc: {
        marketplace: asSc(PROBE_ADDRESSES.marketplace, market),
        nftStaking: asSc(PROBE_ADDRESSES.nftStaking, stake),
        troGovernance: asSc(PROBE_ADDRESSES.troGovernance, gov),
        nftMinter: asSc(PROBE_ADDRESSES.nftMinter, minter),
      },
      tro: {
        supply: Number(tro.supply || 0),
        accounts: tro.accounts ?? 0,
        transactions: tro.transactions ?? 0,
      },
    }
  } catch {
    return { ...FALLBACK_SNAPSHOT, probedAt: new Date().toISOString(), ok: false }
  }
}
