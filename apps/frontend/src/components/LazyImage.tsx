import { useState, type ImgHTMLAttributes } from 'react'

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  /** Optional blur placeholder color */
  placeholder?: string
}

/**
 * Image with lazy decode, opacity fade-in, and broken-src fallback.
 * Use on NFT tiles to cut CLS and main-thread decode cost.
 */
export default function LazyImage({
  src,
  alt,
  className = '',
  placeholder = '#15151f',
  ...rest
}: Props) {
  const [ok, setOk] = useState(true)
  const [loaded, setLoaded] = useState(false)

  if (!src || !ok) {
    return (
      <div
        className={`flex items-center justify-center bg-[#15151f] ${className}`}
        style={{ background: placeholder }}
        aria-hidden
      >
        <span className="text-4xl opacity-40">🎨</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt || ''}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setOk(false)}
      className={`${className} transition-opacity duration-300 ${
        loaded ? 'opacity-100' : 'opacity-0'
      }`}
      {...rest}
    />
  )
}
