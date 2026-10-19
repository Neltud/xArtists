/**
 * Explicit chain label — never imply Solana balance is MultiversX (or reverse).
 */
import type { ChainId } from '../../domain/chain'
import { CHAIN_LABEL } from '../../domain/chain'

type Props = {
  chain?: ChainId
  className?: string
}

export default function NetworkBadge({ chain = 'mvx', className = '' }: Props) {
  const label = CHAIN_LABEL[chain]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${className}`}
      style={{
        borderColor: 'var(--xa-border)',
        color: 'var(--xa-text-muted)',
        background: 'rgba(255,255,255,0.03)',
      }}
      title={chain === 'mvx' ? 'MultiversX mainnet' : 'Solana (opt-in adapter)'}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: chain === 'mvx' ? 'var(--xa-accent)' : '#9945FF' }}
        aria-hidden
      />
      {label}
    </span>
  )
}
