/** Register service worker — enables "Add to Home Screen" on mobile */
export function registerSW(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  const swUrl = `${import.meta.env.BASE_URL}service-worker.js`;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(swUrl)
      .then((reg) => {
        console.info('[PWA] SW registered', reg.scope);
        reg.update().catch(() => undefined);
      })
      .catch((err) => console.warn('[PWA] SW register failed', err));
  });
}
