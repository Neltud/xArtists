let started = false
/** Never reload automatically: a wallet approval may still be in progress. */
export function registerSW(): void {
  if (started || typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  started = true
  const register = () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}service-worker.js`, { updateViaCache: 'none' })
      .then(reg => {
        void reg.update().catch(() => undefined)
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') void reg.update().catch(() => undefined)
        })
      })
      .catch(error => console.warn('[PWA] Registration unavailable', error))
  }
  if (document.readyState === 'complete') register()
  else window.addEventListener('load', register, { once: true })
}
