/**
 * ScStatusBanner — honest on-chain readiness (no false "live market").
 * Reads contracts.json mirror; agents_marketplace null = not live.
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

  const agentsLive = Boolean(c?.contracts?.agents_marketplace)
  const marketLive = Boolean(c?.contracts?.marketplace)

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-xs ${
        agentsLive && marketLive
          ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200'
          : 'border-orange-500/30 bg-orange-950/20 text-orange-200'
      } ${className}`}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-semibold">
          SC · {c?.network ?? 'mainnet'} (chain {c?.chainId ?? '1'})
        </span>
        <span>
          Marketplace NFT : {marketLive ? `live ${shortAddr(c?.contracts?.marketplace)}` : 'adresse absente'}
        </span>
        <span>
          Agents Marketplace :{' '}
          {agentsLive ? `live ${shortAddr(c?.contracts?.agents_marketplace)}` : 'non déployé (null)'}
        </span>
      </div>
      {!agentsLive && (
        <p className="mt-1 text-[11px] opacity-80">
          Pas de faux « live market » agents tant que codeHash + adresse mainnet ne sont pas publiés.
        </p>
      )}
    </div>
  )
}
