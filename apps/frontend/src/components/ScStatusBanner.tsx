import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/**
 * ScStatusBanner — honest on-chain readiness (address ≠ codeHash live).
 */
import { useEffect, useState } from 'react'
import { canListBuyNft, canBuyAgent } from '../config/scStatus'

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
  verification?: {
    marketplace_mainnet?: {
      codeHash?: string | null
      code_empty?: boolean
      verdict?: string
    }
    agents_marketplace?: string
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
  const marketLive = canListBuyNft()
  const agentsLive = canBuyAgent()

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
  const verdict = c?.verification?.marketplace_mainnet?.verdict
  const codeEmpty = c?.verification?.marketplace_mainnet?.code_empty
  const codeHash = c?.verification?.marketplace_mainnet?.codeHash

  const border = marketLive && agentsLive
    ? 'border-green-500/30 bg-green-950/20 text-green-200'
    : 'border-orange-500/30 bg-orange-950/20 text-orange-200'

  return (
    <div className={`rounded-xl border px-4 py-3 text-xs ${border} ${className}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-semibold">
          {xaRender("SC · ")}{xaRender(c?.network ?? 'mainnet')} {xaRender(" (chain ")}{xaRender(c?.chainId ?? '1')})
        </span>
        <span>
          {xaRender("Marketplace NFT :")}{xaRender(' ')}
          {xaRender(marketLive ? (
            <span className="text-green-300">{xaRender("LIVE ")}{xaRender(shortAddr(marketAddr))}</span>
          ) : marketAddr ? (
            <>
              {xaRender("configuré ")}{xaRender(shortAddr(marketAddr))}
              {xaRender(codeEmpty || !codeHash
                ? ' — codeHash null / compte vide'
                : ` — ${verdict || 'vérifier codeHash'}`)}
            </>
          ) : (
            'adresse absente'
          ))}
        </span>
        <span>
          {xaRender("Agents Marketplace :")}{xaRender(' ')}
          {xaRender(agentsLive ? (
            <span className="text-green-300">{xaRender("LIVE ")}{xaRender(shortAddr(agentsAddr))}</span>
          ) : agentsAddr ? (
            `configuré ${shortAddr(agentsAddr)} — codeHash non OK`
          ) : (
            'non déployé (null)'
          ))}
        </span>
      </div>
      <p className="mt-1 text-[11px] opacity-80">
        {xaRender("List / Buy / Bid seulement si le codeHash explorer égale le hash attendu (déverrouillage runtime). Le flag Pages est optionnel. Slot REAL reste fermé tant que isPayable=false. ")}</p>
    </div>
  )
}
