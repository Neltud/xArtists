/**
 * Live marketplace views via the public API (CORS *).
 * getListing nested-encoding: address, token, nonce, price, royalty, receiver, active.
 */
const API = 'https://api.multiversx.com'

export type OnChainListing = {
  id: number
  token: string
  nonce: number
  priceAtomic: string
  priceEgld: string
  royaltyBps: number
  active: boolean
}

function readU32(b: Uint8Array, i: number): number {
  return b[i] * 16777216 + b[i + 1] * 65536 + b[i + 2] * 256 + b[i + 3]
}

function readU64(b: Uint8Array, i: number): number {
  let n = 0
  for (let k = 0; k < 8; k++) n = n * 256 + b[i + k]
  return n
}

function readBig(b: Uint8Array, i: number, len: number): bigint {
  let n = 0n
  for (let k = 0; k < len; k++) n = n * 256n + BigInt(b[i + k])
  return n
}

function b64(s: string): Uint8Array {
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

/** Pure decoder — returns null if the payload is not a Listing. */
export function decodeListing(id: number, b64payload: string): OnChainListing | null {
  try {
    const b = b64(b64payload)
    if (b.length < 48) return null
    let i = 32
    const ln = readU32(b, i)
    i += 4
    if (ln <= 0 || ln > 64 || i + ln > b.length) return null
    const token = new TextDecoder().decode(b.slice(i, i + ln))
    i += ln
    const nonce = readU64(b, i)
    i += 8
    const pl = readU32(b, i)
    i += 4
    if (pl > 32 || i + pl + 2 + 32 + 1 > b.length) return null
    const price = readBig(b, i, pl)
    i += pl
    const royaltyBps = b[i] * 256 + b[i + 1]
    i += 2 + 32
    const active = b[i] === 1
    const egld = Number(price) / 1e18
    return {
      id,
      token,
      nonce,
      priceAtomic: price.toString(),
      priceEgld: Number.isFinite(egld) ? String(egld) : '0',
      royaltyBps,
      active,
    }
  } catch {
    return null
  }
}

async function querySc(address: string, funcName: string, args: string[]): Promise<string | null> {
  const r = await fetch(`${API}/query`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ scAddress: address, funcName, args }),
    cache: 'no-store',
  })
  if (!r.ok) return null
  const j = (await r.json()) as { returnCode?: string; returnData?: string[] | null }
  if (j.returnCode !== 'ok') return null
  const data = j.returnData
  if (!data || !data.length) return ''
  return data[0] ?? ''
}

/** Walk listing ids until the view errors (empty storage). Active rows are buyable. */
export async function fetchOnChainMarketListings(
  address: string,
  max = 8,
): Promise<OnChainListing[]> {
  const out: OnChainListing[] = []
  for (let id = 1; id <= max; id++) {
    const arg = id.toString(16).padStart(2, '0')
    const payload = await querySc(address, 'getListing', [arg])
    if (!payload) break
    const row = decodeListing(id, payload)
    if (!row) break
    out.push(row)
  }
  return out
}
