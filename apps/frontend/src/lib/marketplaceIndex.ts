/**
 * Marketplace index — static JSON + on-chain probe (SC NFTs + recent list/buy txs)
 * + local overlay (sold / just-listed).
 */
import type { ListingRow } from '../types/marketplace'
import { MARKETPLACE_ADDRESS } from './scStatus'
import { fetchOnChainMarketListings, type OnChainListing } from './marketChain'

const SOLD_KEY = 'xartists_listings_sold_v1'
const EXTRA_KEY = 'xartists_listings_extra_v1'
const API = 'https://api.multiversx.com'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v))
  } catch {
    /* */
  }
}

export function markListingSold(listingId: number, txBuy?: string) {
  const map = readJson<Record<string, { sold: true; tx?: string }>>(SOLD_KEY, {})
  map[String(listingId)] = { sold: true, tx: txBuy }
  writeJson(SOLD_KEY, map)
}

export function rememberLocalListing(row: ListingRow) {
  const list = readJson<ListingRow[]>(EXTRA_KEY, [])
  list.unshift({ ...row, active: true })
  writeJson(EXTRA_KEY, list.slice(0, 40))
}

export function applyListingOverlay(rows: ListingRow[]): ListingRow[] {
  const sold = readJson<Record<string, { sold: true }>>(SOLD_KEY, {})
  const extra = readJson<ListingRow[]>(EXTRA_KEY, [])
  const merged = [...extra, ...rows]
  const seen = new Set<string>()
  const out: ListingRow[] = []
  for (const r of merged) {
    const id = String(r.listing_id ?? r.identifier ?? '')
    if (!id || seen.has(id)) continue
    seen.add(id)
    if (r.listing_id != null && sold[String(r.listing_id)]?.sold) continue
    if (r.active === false || (r as { sold?: boolean }).sold) continue
    out.push(r)
  }
  return out
}

function hexToUtf8(hex: string): string {
  try {
    const clean = hex.length % 2 ? `0${hex}` : hex
    const bytes = clean.match(/.{1,2}/g)?.map(b => parseInt(b, 16)) || []
    return new TextDecoder().decode(new Uint8Array(bytes))
  } catch {
    return ''
  }
}

function parseDataField(data: string | undefined): string {
  if (!data) return ''
  if (data.includes('@') && !/^[A-Za-z0-9+/=]+$/.test(data)) return data
  try {
    // API often returns base64
    const bin = atob(data)
    return bin
  } catch {
    return data
  }
}

/** Build listings from recent listNft txs minus sold buyNft. */
async function fetchOnChainListings(market: string): Promise<ListingRow[]> {
  const soldIds = new Set<number>()
  const byId = new Map<number, ListingRow>()

  try {
    const txRes = await fetch(
      `${API}/accounts/${market}/transactions?size=40&order=desc`,
      { cache: 'no-store' },
    )
    if (txRes.ok) {
      const txs = (await txRes.json()) as {
        txHash?: string
        function?: string
        status?: string
        data?: string
        sender?: string
        value?: string
      }[]
      if (Array.isArray(txs)) {
        for (const t of txs) {
          if (t.status !== 'success') continue
          const raw = parseDataField(t.data)
          const fn = t.function || raw.split('@')[0]

          if (fn === 'buyNft' || raw.startsWith('buyNft@')) {
            const parts = raw.split('@')
            const idHex = parts[1] || ''
            const id = parseInt(idHex, 16)
            if (Number.isFinite(id)) soldIds.add(id)
            continue
          }

          // listNft arrives as ESDTNFTTransfer@...@listNft@price@royalty@...
          if (raw.includes('listNft') || fn === 'listNft' || fn === 'ESDTNFTTransfer') {
            if (!raw.includes('listNft')) continue
            const parts = raw.split('@')
            // ESDTNFTTransfer token nonce amount receiver listNft price royalty_bps royalty_recv
            const idx = parts.indexOf('listNft')
            if (idx < 0) continue
            const tokenHex = parts[1] || ''
            const nonceHex = parts[2] || '0'
            const priceHex = parts[idx + 1] || '0'
            const token = hexToUtf8(tokenHex)
            const nonce = parseInt(nonceHex, 16) || 0
            const priceWei = BigInt(`0x${priceHex || '0'}`)
            const priceEgld = Number(priceWei) / 1e18
            // listing id not in transfer data — infer later from sequential buys / static
            // Use synthetic key from tx for display; prefer real id when static JSON has it
            const identifier = token && nonce ? `${token}-${nonce.toString(16).padStart(2, '0')}` : token
            const row: ListingRow = {
              identifier,
              token,
              token_id: token,
              nonce,
              name: token,
              price: String(priceWei),
              price_egld: String(priceEgld),
              seller: t.sender,
              active: true,
              tx_list: t.txHash,
            }
            // store by tx order; listing_id filled if we only have one active NFT
            byId.set(byId.size + 1, row)
          }
        }
      }
    }
  } catch {
    /* */
  }

  // NFTs currently escrowed on market SC → active inventory
  try {
    const nftRes = await fetch(`${API}/accounts/${market}/nfts?size=50`, { cache: 'no-store' })
    if (nftRes.ok) {
      const nfts = (await nftRes.json()) as {
        identifier?: string
        name?: string
        nonce?: number
        balance?: string
        url?: string
        media?: { thumbnailUrl?: string; url?: string }[]
        collection?: string
      }[]
      if (Array.isArray(nfts) && nfts.length) {
        let chainListings: OnChainListing[] = []
        try {
          chainListings = await fetchOnChainMarketListings(market)
        } catch {
          chainListings = []
        }
        const activeRows: ListingRow[] = []
        nfts.forEach((n, i) => {
          if (!n.identifier || n.balance === '0') return
          const fromTx = [...byId.values()].find(
            r => r.identifier === n.identifier || r.token === n.collection,
          )
          const token =
            n.collection || n.identifier.split('-').slice(0, -1).join('-')
          const nonce = Number(n.nonce || 0)
          const match =
            chainListings.find(l => l.active && l.token === token && l.nonce === nonce) ||
            chainListings.find(l => l.active && n.identifier!.startsWith(`${l.token}-`))
          // Never guess listing 1 after a sale: id 1 is inactive, the relist is a later id.
          let listingId = match?.id
          if (listingId == null) {
            const guess = fromTx?.listing_id ?? (nfts.length === 1 ? 1 : i + 1)
            if (!soldIds.has(guess)) listingId = guess
          }
          if (listingId == null) return
          if (!match && soldIds.has(listingId)) return
          const thumb =
            n.url ||
            n.media?.[0]?.thumbnailUrl ||
            n.media?.[0]?.url ||
            fromTx?.thumb
          activeRows.push({
            listing_id: listingId,
            identifier: n.identifier,
            token,
            token_id: n.collection,
            nonce: n.nonce,
            name: n.name || n.identifier,
            price: match?.priceAtomic || fromTx?.price,
            price_egld: match?.priceEgld || fromTx?.price_egld || '0.25',
            seller: fromTx?.seller,
            active: true,
            tx_list: fromTx?.tx_list,
            thumb,
            url: n.url,
          })
        })
        if (activeRows.length) return activeRows
      }
    }
  } catch {
    /* */
  }

  // fallback: tx-derived rows not marked sold
  const rows = [...byId.entries()]
    .filter(([id]) => !soldIds.has(id))
    .map(([id, r]) => ({ ...r, listing_id: r.listing_id ?? id }))
  return rows
}

async function fetchStaticListings(): Promise<ListingRow[]> {
  const base = import.meta.env.BASE_URL || '/'
  const urls = [
    `${base}data/marketplace_listings.json`,
    `${base}data/listings_index.json`,
    '/xArtists/data/marketplace_listings.json',
    '/xArtists/data/listings_index.json',
  ]
  for (const u of urls) {
    try {
      const r = await fetch(u, { cache: 'no-store' })
      if (!r.ok) continue
      const j = (await r.json()) as { listings?: ListingRow[] }
      if (j.listings?.length) return j.listings
    } catch {
      /* */
    }
  }
  return []
}

export async function fetchMarketplaceListings(): Promise<ListingRow[]> {
  const market =
    typeof MARKETPLACE_ADDRESS === 'string' && MARKETPLACE_ADDRESS.startsWith('erd1')
      ? MARKETPLACE_ADDRESS
      : 'erd1qqqqqqqqqqqqqpgqx0araa285cdepdsfe8s23mer30r3dh9lvhxqq8txmm'

  const [chain, stat] = await Promise.all([
    fetchOnChainListings(market),
    fetchStaticListings(),
  ])

  // Prefer on-chain inventory; enrich with static names/prices
  const byIdent = new Map<string, ListingRow>()
  for (const r of stat) {
    const k = String(r.listing_id ?? r.identifier ?? '')
    if (k) byIdent.set(k, r)
  }
  const merged: ListingRow[] = []
  if (chain.length) {
    for (const c of chain) {
      const k = String(c.listing_id ?? c.identifier ?? '')
      const s = byIdent.get(k) || byIdent.get(String(c.identifier))
      merged.push({
        ...s,
        ...c,
        name: c.name || s?.name,
        price_egld: c.price_egld || s?.price_egld,
        thumb: c.thumb || s?.thumb,
      })
    }
  } else {
    merged.push(...stat)
  }

  return applyListingOverlay(merged)
}

/** NFTs owned by connected wallet for “mon inventaire” list form */
export function filterOwnedNotListed(
  owned: { identifier: string; name?: string }[],
  listings: ListingRow[],
): { identifier: string; name?: string }[] {
  const listed = new Set(
    listings.map(l => l.identifier).filter(Boolean) as string[],
  )
  return owned.filter(n => n.identifier && !listed.has(n.identifier))
}
