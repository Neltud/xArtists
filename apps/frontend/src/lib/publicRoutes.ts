/** Restore Pages redirects before BrowserRouter and wallet callbacks read the URL. */
export function normalizePublicPath(path: string): string {
  return path.replace(/\/+$/, '') || '/'
}

export function restoredPublicUrl(href: string, base: string): string | null {
  const current = new URL(href)
  const root = new URL(base, current.origin)
  if (current.pathname !== root.pathname) return null
  const redirected = current.searchParams.get('path') || current.searchParams.get('p')
  if (!redirected) return null
  const target = new URL(redirected, root)
  if (target.origin !== current.origin) return null
  current.searchParams.delete('path')
  current.searchParams.delete('p')
  target.search = current.searchParams.toString()
  target.hash = current.hash
  return target.pathname + target.search + target.hash
}

export function publicRouteEntries(paths: string[]): string[] {
  const out = new Set<string>(['/', '/app', '/app/'])
  for (const path of paths) {
    const clean = normalizePublicPath(path)
    out.add(clean)
    if (clean !== '/') out.add(clean + '/')
  }
  return [...out].sort()
}
