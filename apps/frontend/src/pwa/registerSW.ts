/** Register service worker — force update when a new SW is available */
export function registerSW(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

  const swUrl = `${import.meta.env.BASE_URL}service-worker.js?v=9`

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(swUrl)
      .then((reg) => {
        console.info('[PWA] SW registered', reg.scope)
        reg.update().catch(() => undefined)
        setInterval(() => reg.update().catch(() => undefined), 60_000)

        reg.addEventListener('updatefound', () => {
          const nw = reg.installing
          if (!nw) return
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              nw.postMessage?.({ type: 'SKIP_WAITING' })
              window.location.reload()
            }
          })
        })
      })
      .catch((err) => console.warn('[PWA] SW register failed', err))

    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return
      refreshing = true
      window.location.reload()
    })
  })
}
