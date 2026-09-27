/**
 * Mapbox GL JS — chargement CDN optionnel (VITE_MAPBOX_TOKEN).
 * Sans token → null (rester sur Leaflet / OSM).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MapboxGL = any

declare global {
  interface Window {
    mapboxgl?: MapboxGL
  }
}

const CSS = 'https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.css'
const JS = 'https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.js'

export function mapboxToken(): string | undefined {
  const t = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined
  return t?.trim() || undefined
}

export function isMapboxConfigured(): boolean {
  return !!mapboxToken()
}

export async function loadMapboxGL(): Promise<MapboxGL | null> {
  const token = mapboxToken()
  if (!token) return null

  if (window.mapboxgl) {
    window.mapboxgl.accessToken = token
    return window.mapboxgl
  }

  if (!document.querySelector(`link[href="${CSS}"]`)) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = CSS
    document.head.appendChild(link)
  }

  await new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${JS}"]`)) {
      const s = document.querySelector(`script[src="${JS}"]`)!
      s.addEventListener('load', () => resolve())
      if (window.mapboxgl) resolve()
      return
    }
    const script = document.createElement('script')
    script.src = JS
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Mapbox GL load failed'))
    document.head.appendChild(script)
  })

  if (!window.mapboxgl) return null
  window.mapboxgl.accessToken = token
  return window.mapboxgl
}
