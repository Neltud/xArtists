/** Miniature NFT/SFT avec ImageWithFallback (pas de carré blanc). */
import { ImageWithFallback } from './ImageWithFallback'

type Props = {
  src?: string | null
  alt: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: 'h-12 w-12',
  md: 'h-20 w-20',
  lg: 'h-32 w-32',
}

export function NftThumb({ src, alt, className = '', size = 'md' }: Props) {
  return (
    <ImageWithFallback
      src={src}
      alt={alt}
      wrapperClassName={`rounded-xl ${SIZES[size]} ${className}`}
      className="h-full w-full object-cover"
    />
  )
}

export default NftThumb
