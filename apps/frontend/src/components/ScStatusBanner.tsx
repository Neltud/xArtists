/**
 * ScStatusBanner — honest on-chain readiness (address ≠ codeHash live).
 */
import { useEffect, useState } from 'react'

const RAW = 'https://raw.githubusercontent.com/Neltud/xArtists/main'

interface ContractsFile {
  network?: string
  chainId?: string
  updated?: string
  contracts?: {
    marketplace?: string | null
    agents_marketplace?: string | null
    nft_staking?: string | null
    tro_governance?: string | null
  }
  notes?: string
}

function shortAddr(a?: string | null) {
  if (!a) return '—'
  if (a.length < 16) return a
  return `${a.slice(0, 8)}…${a.slice(-6)}`
}

export default function ScStatusBanner({ className = '' }: { className?: string }) {
  const [c, setC] = useState<ContractsFile | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`${RAW}/data/contracts.json`, { cache: 'no-store' })
        if (!res.ok) return
        const j = (await res.json()) as ContractsFile
        if (!cancelled) setC(j)
      } catch {
        /* offline */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const agentsAddr = c?.contracts?.agents_marketplace
  const marketAddr = c?.contracts?.marketplace
  const agentsConfigured = Boolean(agentsAddr)
  const marketConfigured = Boolean(marketAddr)

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-xs border-orange-500/30 bg-orange-950/20 text-orange-200 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-semibold">
          SC · {c?.network ?? 'mainnet'} (chain {c?.chainId ?? '1'})
        </span>
        <span>
          Marketplace NFT :{' '}
          {marketConfigured
            ? `configuré ${shortAddr(marketAddr)} — vérifier codeHash explorer`
            : 'adresse absente'}
        </span>
        <span>
          Agents Marketplace :{' '}
          {agentsConfigured ? `configuré ${shortAddr(agentsAddr)}` : 'non déployé (null)'}
        </span>
      </div>
      <p className="mt-1 text-[11px] opacity-80">
        List / Buy / Bid on-chain seulement après codeHash ≠ null et micro-preuves. Jusque-là :
        consultation + Studio / pin — pas de faux « market live ».
      </p>
    </div>
  )
}
