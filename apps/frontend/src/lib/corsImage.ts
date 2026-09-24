/** CORS-safe image URLs for WebGL / <img> (media.multiversx often lacks ACAO). */
export function corsSafeUrls(raw: string | undefined | null): string[] {
  if (!raw || !String(raw).trim()) return []
  const u = String(raw).trim()
  const out: string[] = []
  try {
    const host = new URL(u).hostname
    const bare = u.replace(/^https?:\/\//i, '')
    const needsProxy =
      host.includes('multiversx.com') ||
      host.includes('ipfs') ||
      host.includes('nftstorage') ||
      host.endsWith('.ipfs.dweb.link')
    if (needsProxy) {
      out.push(`https://images.weserv.nl/?url=${encodeURIComponent(bare)}&w=800&output=jpg&q=85`)
      out.push(`https://wsrv.nl/?url=${encodeURIComponent(bare)}&w=800&output=jpg&q=85`)
      out.push(u)
    } else {
      out.push(u)
      out.push(`https://images.weserv.nl/?url=${encodeURIComponent(bare)}&w=800&output=jpg&q=85`)
    }
  } catch {
    out.push(u)
  }
  return out
}

export function corsPreferred(raw: string | undefined | null): string | undefined {
  const urls = corsSafeUrls(raw)
  return urls[0]
}
