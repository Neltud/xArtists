/**
 * User NFT mint path — MultiversX built-in ESDT system SC (no custom minter required).
 * 1) issueNonFungible  2) setSpecialRole (ESDTNFTCreate)  3) ESDTNFTCreate
 * User signs each step with xPortal / Web Wallet.
 */

/** ESDT system smart contract (mainnet) */
export const ESDT_SYSTEM_SC =
  'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u'

/** Issue cost mainnet (0.05 EGLD typical for NFT collection) */
export const ISSUE_COST_WEI = '50000000000000000' // 0.05 EGLD

function strToHex(s: string): string {
  return Array.from(new TextEncoder().encode(s))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function numToHex(n: number | bigint): string {
  const h = BigInt(n).toString(16)
  return h.length % 2 === 0 ? h : `0${h}`
}

/** Sanitize ticker for MultiversX (3–10 alphanumeric uppercase) */
export function sanitizeTicker(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10)
}

export function isValidTicker(t: string): boolean {
  return /^[A-Z0-9]{3,10}$/.test(t)
}

/**
 * issueNonFungible@tokenName@tokenTicker
 * value = issue cost
 */
export function buildIssueNftCollectionTx(opts: {
  name: string
  ticker: string
  gasLimit?: number
}) {
  const ticker = sanitizeTicker(opts.ticker)
  const name = opts.name.trim().slice(0, 20) || ticker
  const data = ['issueNonFungible', strToHex(name), strToHex(ticker)].join('@')
  return {
    receiver: ESDT_SYSTEM_SC,
    value: ISSUE_COST_WEI,
    data,
    gasLimit: opts.gasLimit ?? 60_000_000,
    chainID: '1',
  }
}

/**
 * setSpecialRole@tokenId@address@ESDTRoleNFTCreate
 * tokenId example: XART-xxxxxx (after issue)
 */
export function buildSetNftCreateRoleTx(opts: {
  tokenIdentifier: string
  ownerAddress: string
  gasLimit?: number
}) {
  const data = [
    'setSpecialRole',
    strToHex(opts.tokenIdentifier),
    strToHex(opts.ownerAddress),
    strToHex('ESDTRoleNFTCreate'),
  ].join('@')
  return {
    receiver: ESDT_SYSTEM_SC,
    value: '0',
    data,
    gasLimit: opts.gasLimit ?? 60_000_000,
    chainID: '1',
  }
}

/**
 * ESDTNFTCreate@tokenId@qty@name@royalties@hash@attributes@uri...
 * royalties in basis points * 100? MultiversX uses value 0-10000 for 0-100%
 * We pass royaltyPct * 100 (5% → 500)
 */
export function buildEsdtNftCreateTx(opts: {
  tokenIdentifier: string
  name: string
  royaltiesPct: number
  attributes: string
  uris: string[]
  quantity?: number
  gasLimit?: number
}) {
  const qty = opts.quantity ?? 1
  const royalties = Math.min(10000, Math.max(0, Math.round(opts.royaltiesPct * 100)))
  const hash = '' // optional media hash
  const parts = [
    'ESDTNFTCreate',
    strToHex(opts.tokenIdentifier),
    numToHex(qty),
    strToHex(opts.name.slice(0, 50) || 'Untitled'),
    numToHex(royalties),
    strToHex(hash),
    strToHex(opts.attributes || 'tags:xartists'),
  ]
  for (const u of opts.uris.filter(Boolean).slice(0, 5)) {
    parts.push(strToHex(u))
  }
  if (opts.uris.filter(Boolean).length === 0) {
    parts.push(strToHex('https://neltud.github.io/xArtists/'))
  }
  return {
    receiver: opts.tokenIdentifier.includes('-')
      ? // ESDTNFTCreate is sent TO the user address in some flows; on MX it's
        // a self-call: receiver = sender. Caller fills sender in wallet.
        // Convention in dApps: receiver = user address (set at send time).
        '__SENDER__'
      : '__SENDER__',
    value: '0',
    data: parts.join('@'),
    gasLimit: opts.gasLimit ?? 20_000_000,
    chainID: '1',
  }
}

/** Persist last issued collection ticker locally for step continuity */
const LS_COLLECTION = 'xartists_studio_collection'

export type StudioCollectionRecord = {
  ticker: string
  name: string
  tokenIdentifier?: string
  roleSet?: boolean
  at: number
}

export function saveStudioCollection(r: StudioCollectionRecord) {
  try {
    localStorage.setItem(LS_COLLECTION, JSON.stringify(r))
  } catch {
    /* */
  }
}

export function loadStudioCollection(): StudioCollectionRecord | null {
  try {
    const raw = localStorage.getItem(LS_COLLECTION)
    if (!raw) return null
    return JSON.parse(raw) as StudioCollectionRecord
  } catch {
    return null
  }
}
