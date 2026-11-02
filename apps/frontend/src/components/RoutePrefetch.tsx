import { useEffect } from 'react'

/** Soft-prefetch heavy route chunks after idle (Home first paint first). */
const ROUTES = [
  () => import('../pages/MuseumPage'),
  () => import('../pages/MarketplacePage'),
  () => import('../pages/PortfolioPage'),
  () => import('../pages/TradingPage'),
]

export default function RoutePrefetch() {
  useEffect(() => {
    const run = () => {
      ROUTES.forEach((load, i) => {
        setTimeout(() => {
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
    const t = setTimeout(run, 2000)
    return () => clearTimeout(t)
  }, [])
  return null
}
