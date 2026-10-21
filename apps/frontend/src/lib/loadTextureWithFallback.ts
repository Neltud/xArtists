import type { Texture, TextureLoader } from 'three'
import { corsSafeUrls } from './corsImage'

/** Try CORS-compatible alternatives before displaying an unavailable-image card. */
export function loadTextureWithFallback(
  loader: Pick<TextureLoader, 'load'> & { crossOrigin?: string },
  image: string | undefined,
  onLoad: (texture: Texture) => void,
  onError: () => void,
  isDisposed: () => boolean = () => false,
): void {
  loader.crossOrigin = 'anonymous'
  const urls = corsSafeUrls(image)
  const attempt = (index: number) => {
    if (isDisposed()) return
    if (index >= urls.length) {
      onError()
      return
    }
    loader.load(
      urls[index],
      texture => {
        if (isDisposed()) texture.dispose()
        else onLoad(texture)
      },
      undefined,
      () => attempt(index + 1),
    )
  }
  attempt(0)
}
