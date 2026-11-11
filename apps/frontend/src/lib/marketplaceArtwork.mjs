/** Financial xMEX positions are not artwork catalogue entries, even with NFT nonces. */
export function isMarketplaceArtwork(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  for (const key of ['identifier', 'collection', 'token', 'tokenIdentifier']) {
    const id = value[key]
    if (typeof id === 'string' && /^XMEX-[a-f0-9]{6}(?:-|$)/i.test(id.trim())) return false
  }
  return true
}
