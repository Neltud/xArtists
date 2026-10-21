/** CORS-safe image URL chain for MultiversX media hosts used by WebGL textures. */

const PROXY_HOSTS = [
  (url: string) => `https://images.weserv.nl/?url=${encodeURIComponent(url)}&n=-1`,
  (url: string) => `https://wsrv.nl/?url=${encodeURIComponent(url)}&n=-1`,
]

export function needsCorsProxy(url: string | undefined): boolean {
  if (!url) return false
  try {
    const host = new URL(url).hostname.toLowerCase()
    return (
      host.includes('media.multiversx.com') ||
      host.includes('nftstorage.link') ||
      host.endsWith('.ipfs.io') ||
      host.includes('gateway.pinata.cloud')
    )
  } catch {
    return false
  }
}

/** Ordered list of URLs to try: proxies first for CORS-hostile hosts, then original. */
export function corsSafeUrls(url: string | undefined): string[] {
  if (!url || !url.trim()) return []
  const trimmed = url.trim()
  const out: string[] = []
  if (needsCorsProxy(trimmed)) {
    for (const proxy of PROXY_HOSTS) {
      out.push(proxy(trimmed))
    }
  }
  out.push(trimmed)
  // de-dupe while preserving order
  return [...new Set(out)]
}
