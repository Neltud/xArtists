/**
 * Charge une texture WebGL avec reprise CORS :
 * 1) URL directe
 * 2) images.weserv.nl
 * 3) wsrv.nl
 * Sans imbriquer les proxies. « Image indisponible » uniquement après échec total.
 */
import * as THREE from 'three'

function isAlreadyProxied(url: string): boolean {
  return /weserv\.nl|wsrv\.nl|images\.weserv\.nl/i.test(url)
}

function proxyUrl(base: 'images.weserv.nl' | 'wsrv.nl', src: string): string {
  const encoded = encodeURIComponent(src)
  return `https://${base}/?url=${encoded}&n=-1`
}

export function textureCandidates(src: string): string[] {
  const s = (src || '').trim()
  if (!s) return []
  if (isAlreadyProxied(s) || s.startsWith('data:') || s.startsWith('blob:')) return [s]
  return [s, proxyUrl('images.weserv.nl', s), proxyUrl('wsrv.nl', s)]
}

export function loadTextureWithFallback(
  loader: THREE.TextureLoader,
  src: string,
  onOk: (tex: THREE.Texture) => void,
  onFail: () => void,
): void {
  const list = textureCandidates(src)
  if (!list.length) {
    onFail()
    return
  }
  let i = 0
  const tryNext = () => {
    if (i >= list.length) {
      onFail()
      return
    }
    const url = list[i++]
    loader.load(
      url,
      tex => {
        tex.colorSpace = THREE.SRGBColorSpace
        onOk(tex)
      },
      undefined,
      () => tryNext(),
    )
  }
  tryNext()
}

export function unavailableArtTexture(label = 'Image indisponible'): THREE.CanvasTexture {
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
  ctx.fillText(label.slice(0, 28), 128, 160)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
