const RAW_DATA_BASE = 'https://raw.githubusercontent.com/Neltud/xArtists/main/data'

function withCacheBust(url: string, bustCache?: boolean): string {
  if (!bustCache) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}t=${Date.now()}`
}

export function localDataUrl(file: string): string {
  return `${import.meta.env.BASE_URL}data/${file}`.replace(/\/{2,}/g, '/').replace(':/', '://')
}

export function rawDataUrl(file: string): string {
  return `${RAW_DATA_BASE}/${file}`
}

export function getDataUrls(file: string, bustCache = false): string[] {
  return [
    withCacheBust(localDataUrl(file), bustCache),
    withCacheBust(rawDataUrl(file), bustCache),
  ]
}

export async function fetchMirroredJson<T>(
  file: string,
  options: RequestInit & { bustCache?: boolean } = {},
): Promise<T> {
  const { bustCache = false, ...requestInit } = options
  let lastError: Error | null = null

  for (const url of getDataUrls(file, bustCache)) {
    try {
      const response = await fetch(url, requestInit)
      if (!response.ok) {
        lastError = new Error(`${file}: HTTP ${response.status}`)
        continue
      }
      return (await response.json()) as T
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
    }
  }

  throw lastError ?? new Error(`Unable to fetch ${file}`)
}
