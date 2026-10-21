/**
 * TextureLoader avec chaîne de fallback CORS-safe pour media.multiversx.com
 * et autres origines sans en-têtes CORS.
 *
 * Ordre : images.weserv.nl → wsrv.nl → URL directe.
 * Placeholder « Image indisponible » uniquement si toutes les tentatives échouent.
 */
import * as THREE from 'three'

function proxyWeserv(url: string): string {
  return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&n=-1`
}

function proxyWsrv(url: string): string {
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&n=-1`
}

/**
 * Charge une texture avec reprise automatique.
 * crossOrigin forcé à 'anonymous' sur chaque tentative.
 */
export function loadTextureWithFallback(
  loader: THREE.TextureLoader,
  url: string,
  onSuccess: (tex: THREE.Texture) => void,
  onAllFailed: () => void,
): void {
  if (!url || !url.trim()) {
    onAllFailed()
    return
  }

  const attempts: Array<{ src: string }> = [
    { src: proxyWeserv(url) },
    { src: proxyWsrv(url) },
    { src: url },
  ]

  let i = 0
  const tryNext = () => {
    if (i >= attempts.length) {
      onAllFailed()
      return
    }
    const { src } = attempts[i++]
    loader.setCrossOrigin('anonymous')
    loader.load(
      src,
      tex => {
        tex.colorSpace = THREE.SRGBColorSpace
        onSuccess(tex)
      },
      undefined,
      () => tryNext(),
    )
  }
  tryNext()
}

/** Placeholder canvas « Image indisponible » */
export function unavailableArtTexture(title = 'Image indisponible'): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 320
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#161914'
  ctx.fillRect(0, 0, 256, 320)
  ctx.strokeStyle = '#cdf58b'
  ctx.lineWidth = 4
  ctx.strokeRect(8, 8, 240, 304)
  ctx.fillStyle = '#f2f5ee'
  ctx.font = 'bold 14px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText(String(title).slice(0, 22), 128, 150)
  ctx.font = '12px system-ui'
  ctx.fillStyle = '#9ca3af'
  ctx.fillText('Image indisponible', 128, 175)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
