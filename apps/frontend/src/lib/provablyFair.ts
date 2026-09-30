/**
 * Provably fair helpers — client seed + display hashes (paper + chain).
 * On-chain truth = SC server seed + client seed; UI shows verifiable commitment.
 */

export function randomClientSeed(bytes = 16): string {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/** SHA-256 hex via Web Crypto (async) */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Fast sync fallback hash for paper mode (not cryptographic strength for custody) */
export function fnv1aHex(input: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

export type FairReceipt = {
  clientSeed: string
  clientSeedHash: string
  serverSeedCommit?: string | null
  combinedHint: string
  txSessionId?: string | null
}

export async function buildFairReceipt(
  clientSeed: string,
  serverSeedCommit?: string | null,
  txSessionId?: string | null,
): Promise<FairReceipt> {
  let clientSeedHash: string
  try {
    clientSeedHash = await sha256Hex(clientSeed)
  } catch {
    clientSeedHash = fnv1aHex(clientSeed)
  }
  const combinedHint = fnv1aHex(
    `${clientSeedHash}:${serverSeedCommit || 'pending'}:${txSessionId || ''}`,
  )
  return {
    clientSeed,
    clientSeedHash,
    serverSeedCommit: serverSeedCommit ?? null,
    combinedHint,
    txSessionId: txSessionId ?? null,
  }
}
