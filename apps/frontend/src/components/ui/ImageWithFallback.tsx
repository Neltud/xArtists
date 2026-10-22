import {localizeChild as xaLocalize, renderChild as xaRender} from '../../i18n/phraseRuntime'
/**
 * Image avec loader discret + fallback — évite carrés blancs / icônes cassées.
 */
import { useState } from 'react'

type Props = {
  src?: string | null
  alt: string
  className?: string
  fallbackSrc?: string
  /** Classes sur le conteneur (ratio, etc.) */
  wrapperClassName?: string
}

const DEFAULT_FALLBACK =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <rect fill="#0a0a0f" width="400" height="400"/>
      <rect x="24" y="24" width="352" height="352" rx="16" fill="none" stroke="#3f3f46" stroke-width="2"/>
      <text x="200" y="210" text-anchor="middle" fill="#71717a" font-family="system-ui,sans-serif" font-size="14">Image indisponible</text>
    </svg>`,
  )

export function ImageWithFallback({
  src,
  alt,
  className = '',
  fallbackSrc = DEFAULT_FALLBACK,
  wrapperClassName = '',
}: Props) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'err'>(src ? 'loading' : 'err')
  const [current, setCurrent] = useState(src || fallbackSrc)

  const onError = () => {
    if (current !== fallbackSrc) {
      setCurrent(fallbackSrc)
      setStatus('err')
    } else {
      setStatus('err')
    }
  }

  return (
    <div className={`relative overflow-hidden bg-zinc-950/80 ${wrapperClassName}`}>
      {xaRender(status === 'loading' ? (
        <div
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-zinc-900 via-zinc-800/40 to-zinc-900"
          aria-hidden
        />
      ) : null)}
      <img
        src={current || fallbackSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`${className} ${status === 'loading' ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setStatus('ok')}
        onError={onError}
      />
    </div>
  )
}

export default ImageWithFallback
