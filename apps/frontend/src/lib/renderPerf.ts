/**
 * Helpers perfs rendu — DPR cap, idle callback, content-visibility hints.
 */

/** Cap devicePixelRatio for WebGL / canvas (mobile battery + GPU). */
export function cappedDpr(max = 1.75): number {
  if (typeof window === 'undefined') return 1
  const dpr = window.devicePixelRatio || 1
  return Math.min(dpr, max)
}

/** Schedule non-critical work after paint. */
export function afterPaint(fn: () => void): void {
  if (typeof window === 'undefined') return
  if ('requestIdleCallback' in window) {
    ;(window as Window & { requestIdleCallback: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback(
      fn,
      { timeout: 800 },
    )
  } else {
    requestAnimationFrame(() => setTimeout(fn, 0))
  }
}

/** Prefer smaller decode for list thumbs. */
export function thumbUrl(url: string, w = 320): string {
  if (!url) return ''
  if (url.includes('weserv.nl') || url.includes('wsrv.nl')) return url
  try {
    const bare = url.replace(/^https?:\/\//i, '')
    return `https://images.weserv.nl/?url=${encodeURIComponent(bare)}&w=${w}&output=jpg&q=75`
  } catch {
    return url
  }
}
