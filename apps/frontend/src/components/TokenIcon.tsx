/**
 * Mini-logos tokens — SVG inline (pas de CDN bloquant).
 * TRO · EGLD · USDC · generic ESDT.
 */

export type TokenKind = 'TRO' | 'EGLD' | 'USDC' | 'NFT' | 'LP' | string

type Props = {
  token?: TokenKind
  size?: number
  className?: string
  title?: string
}

function kindOf(t?: string): 'TRO' | 'EGLD' | 'USDC' | 'NFT' | 'LP' | 'GEN' {
  if (!t) return 'GEN'
  const u = t.toUpperCase()
  if (u.startsWith('TRO') || u === 'TRO-94C925') return 'TRO'
  if (u === 'EGLD' || u === 'WEGLD' || u.includes('WEGLD')) return 'EGLD'
  if (u.startsWith('USDC') || u.includes('USDC')) return 'USDC'
  if (u.includes('NFT') || u.includes('SFT')) return 'NFT'
  if (u.includes('LP') || u.includes('-LP')) return 'LP'
  return 'GEN'
}

export default function TokenIcon({ token = 'TRO', size = 20, className = '', title }: Props) {
  const k = kindOf(token)
  const s = size
  const label = title || token

  if (k === 'TRO') {
    return (
      <svg
        width={s}
        height={s}
        viewBox="0 0 32 32"
        className={`inline-block shrink-0 ${className}`}
        aria-label={label}
        role="img"
      >
        <defs>
          <linearGradient id="troG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="15" fill="url(#troG)" />
        <text
          x="16"
          y="21"
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fill="#fff"
          fontFamily="system-ui,sans-serif"
        >
          T
        </text>
      </svg>
    )
  }

  if (k === 'EGLD') {
    return (
      <svg
        width={s}
        height={s}
        viewBox="0 0 32 32"
        className={`inline-block shrink-0 ${className}`}
        aria-label={label}
        role="img"
      >
        <circle cx="16" cy="16" r="15" fill="#1a1a2e" stroke="#23f7dd" strokeWidth="2" />
        <path
          d="M16 7 L22 16 L16 25 L10 16 Z"
          fill="none"
          stroke="#23f7dd"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <circle cx="16" cy="16" r="2.2" fill="#23f7dd" />
      </svg>
    )
  }

  if (k === 'USDC') {
    return (
      <svg
        width={s}
        height={s}
        viewBox="0 0 32 32"
        className={`inline-block shrink-0 ${className}`}
        aria-label={label}
        role="img"
      >
        <circle cx="16" cy="16" r="15" fill="#2775ca" />
        <text
          x="16"
          y="21"
          textAnchor="middle"
          fontSize="12"
          fontWeight="700"
          fill="#fff"
          fontFamily="system-ui,sans-serif"
        >
          $
        </text>
      </svg>
    )
  }

  if (k === 'NFT') {
    return (
      <svg
        width={s}
        height={s}
        viewBox="0 0 32 32"
        className={`inline-block shrink-0 ${className}`}
        aria-label={label}
        role="img"
      >
        <rect x="3" y="3" width="26" height="26" rx="6" fill="#0f172a" stroke="#f0abfc" strokeWidth="2" />
        <path d="M10 20 L14 14 L18 18 L22 12" fill="none" stroke="#f0abfc" strokeWidth="2" />
      </svg>
    )
  }

  // GEN / LP
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 32 32"
      className={`inline-block shrink-0 ${className}`}
      aria-label={label}
      role="img"
    >
      <circle cx="16" cy="16" r="15" fill="#27272a" stroke="#71717a" strokeWidth="1.5" />
      <text
        x="16"
        y="20"
        textAnchor="middle"
        fontSize="9"
        fontWeight="600"
        fill="#a1a1aa"
        fontFamily="system-ui,sans-serif"
      >
        {k === 'LP' ? 'LP' : '?'}
      </text>
    </svg>
  )
}

/** Pair stack e.g. TRO/EGLD */
export function TokenPairIcons({
  a = 'TRO',
  b = 'EGLD',
  size = 18,
}: {
  a?: string
  b?: string
  size?: number
}) {
  return (
    <span className="inline-flex items-center -space-x-1.5" title={`${a}/${b}`}>
      <TokenIcon token={a} size={size} />
      <TokenIcon token={b} size={size} className="ring-2 ring-black/80 rounded-full" />
    </span>
  )
}
