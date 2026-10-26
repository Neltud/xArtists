/** Restore Pages redirects before BrowserRouter and wallet callbacks read the URL. */
export function normalizePublicPath(path: string): string {
  return path.replace(/\/+$/, '') || '/'
}

export function restoredPublicUrl(href: string, base: string): string | null {
  const current = new URL(href)
  const root = new URL(base, current.origin)
  if (current.pathname !== root.pathname) return null
  const redirected = current.searchParams.get('_xa_route')
  let target: URL
  if (redirected) {
    target = new URL(redirected, current.origin)
  } else if (current.hash.startsWith('#/')) {
    target = new URL(current.hash.slice(2), root)
    for (const [key, value] of current.searchParams) {
      if (!target.searchParams.has(key)) target.searchParams.set(key, value)
    }
  } else {
    return null
  }
  if (target.origin !== current.origin || !target.pathname.startsWith(root.pathname)) return null
  if (target.pathname.startsWith(root.pathname + 'assets/')) return null
  target.searchParams.delete('_xa_route')
  return target.pathname + target.search + target.hash
}

export function restorePublicRoute(): void {
  try {
    const route = restoredPublicUrl(window.location.href, import.meta.env.BASE_URL)
    if (route) window.history.replaceState(window.history.state, '', route)
  } catch { /* A malformed external link must not stop the app from loading. */ }
}
