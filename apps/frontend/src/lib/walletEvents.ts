/** Cross-component open Connect modal (Header listens). */

export const OPEN_CONNECT_EVENT = 'xartists:open-connect'

export function requestOpenConnect() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(OPEN_CONNECT_EVENT))
}

export const OPEN_ASSETS_EVENT = 'xartists:open-assets'

export function requestOpenAssets() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(OPEN_ASSETS_EVENT))
}
