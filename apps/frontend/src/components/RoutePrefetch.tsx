import { useEffect } from 'react'

/** Soft-prefetch heavy route chunks after idle (Home first paint first). */
const ROUTES = [
  () => import('../pages/Gallery'),
  () => import('../pages/Marketplace'),
  () => import('../pages/Portfolio'),
  () => import('../pages/Trading'),
]

export default function RoutePrefetch() {
  useEffect(() => {
    const run = () => {
      ROUTES.forEach((load, i) => {
        window.setTimeout(() => {
          load().catch(() => {})
        }, 800 + i * 400)
      })
    }
    if ('requestIdleCallback' in window) {
      const id = (window as Window & { requestIdleCallback: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback(
        run,
        { timeout: 3500 }
      )
      return () => {
        ;(window as Window & { cancelIdleCallback?: (n: number) => void }).cancelIdleCallback?.(id)
      }
    }
    const t = window.setTimeout(run, 2000)
    return () => clearTimeout(t)
  }, [])
  return null
}
