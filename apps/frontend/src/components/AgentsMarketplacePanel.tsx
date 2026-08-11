import { useEffect, useState } from 'react'
import { formatAgentCheckoutLine, getAgentsFeeBps, splitAgentSale } from '../utils/agentFee'
import { canBuyAgent, AGENTS_MARKETPLACE_ADDRESS } from '../config/scStatus'

const CATALOG_RAW =
  'https://raw.githubusercontent.com/Neltud/xArtists/main/data/agents_catalog.json'
const CONTRACTS_RAW =
  'https://raw.githubusercontent.com/Neltud/xArtists/main/data/contracts.json'

type Pack = {
  id: string
  name: string
  description?: string
  supply: number
  remaining: number
  price_egld: string
  seller?: string
  status?: string
}

type Catalog = {
  fee_bps?: number
  marketplace_address?: string | null
  packs?: Pack[]
  fee_note?: string
}

export default function AgentsMarketplacePanel() {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [scAddress, setScAddress] = useState<string | null>(
    AGENTS_MARKETPLACE_ADDRESS || null
  )

  // Live = codeHash OK flag + valid address (never address-only)
  const live = canBuyAgent()

  useEffect(() => {
    const t = Date.now()
    fetch(CATALOG_RAW + '?t=' + t)
      .then(r => r.json())
      .then((j: Catalog) => setCatalog(j))
      .catch(() => setCatalog(null))
    fetch(CONTRACTS_RAW + '?t=' + t)
      .then(r => r.json())
      .then((j: { contracts?: { agents_marketplace?: string | null }; agents_marketplace?: string }) => {
        const addr =
          j?.contracts?.agents_marketplace ||
          j?.agents_marketplace ||
          AGENTS_MARKETPLACE_ADDRESS
        if (addr && typeof addr === 'string' && addr.startsWith('erd1')) setScAddress(addr)
        else setScAddress(null)
      })
      .catch(() => {})
  }, [])

  const feeBps = catalog?.fee_bps ?? getAgentsFeeBps()
  const packs = catalog?.packs || []

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold mb-3">🛒 Packs agents limités (marketplace SC)</h2>
      <div className="card mb-4 border-teal-500/20">
        <p className="text-xs text-gray-500 mb-2">
          Frais protocol <span className="text-teal-400 font-semibold">{(feeBps / 100).toFixed(0)}%</span>
          {' · '}97% créateur · 3% treasury SC (claimFees owner)
        </p>
        {live ? (
          <p className="text-[11px] mono text-purple-400 break-all">SC live {scAddress}</p>
        ) : (
          <p className="text-sm text-amber-400">
            ⏳ Sprint A : deploy mainnet agents-marketplace +{' '}
            <code className="text-[10px]">VITE_AGENTS_CODEHASH_OK=1</code> — Buy on-chain désactivé
            {scAddress ? ` (adresse connue mais codeHash non validé)` : ' (adresse null)'}
          </p>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {packs.map(p => {
          const price = Number(p.price_egld) || 0
          const split = splitAgentSale(price, feeBps)
          return (
            <div key={p.id} className="card flex flex-col">
              <p className="font-bold text-sm">{p.name}</p>
              <p className="text-[11px] text-gray-500 mt-1 flex-1">{p.description}</p>
              <p className="text-xs mt-2">
                {p.remaining}/{p.supply} restants · <span className="text-teal-400">{price} EGLD</span>
              </p>
              <p className="text-[10px] text-gray-500 mt-1">{formatAgentCheckoutLine(price, feeBps)}</p>
              <button
                type="button"
                disabled={!live || p.remaining <= 0}
                className="btn-primary text-sm mt-3 disabled:opacity-40 disabled:cursor-not-allowed"
                title={
                  live
                    ? `Seller ${split.sellerEgld.toFixed(4)} EGLD · fee ${split.feeEgld.toFixed(4)}`
                    : 'SC not live (deploy + codeHash)'
                }
              >
                {live ? 'Buy (wallet)' : 'Bientôt'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
