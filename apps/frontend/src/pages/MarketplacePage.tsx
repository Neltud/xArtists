/**
 * Marketplace — vitrine on-chain + multi-list + post-buy overlay.
 * RWA Physical Art only (Frameit removed).
 * All dynamic children forced to string (React #31 guard).
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useUserAccount } from '../hooks/useUserAccount'
import { useMarketplaceTx } from '../hooks/useMarketplaceTx'
import { canListBuyNft } from '../config/scStatus'
import { MARKETPLACE_ADDRESS } from '../lib/scStatus'
import { requestOpenConnect } from '../lib/walletEvents'
import { useToast } from '../components/ui/Toast'
import type { ListingRow } from '../types/marketplace'
import {
  fetchMarketplaceListings,
  markListingSold,
  rememberLocalListing,
} from '../lib/marketplaceIndex'
import { fetchMarketPayable, type MarketPayableStatus } from '../lib/marketPayable'
import { asText } from '../lib/safeRender'
import FrameitMarketPanel from '../components/market/FrameitMarketPanel'

const PAGE = 16

function priceEgldOf(l: ListingRow): number {
  if (l.price_egld && Number(l.price_egld) > 0) return Number(l.price_egld)
  const raw = Number(l.price || 0)
  if (raw > 1e12) return raw / 1e18
  return Number.isFinite(raw) ? raw : 0
}

function nftThumb(n: {
  url?: string
  media?: { thumbnailUrl?: string; url?: string }[]
}): string | undefined {
  if (n.url && /^https?:\/\//i.test(n.url)) return n.url
  const m = n.media?.[0]
  if (m?.thumbnailUrl && /^https?:\/\//i.test(m.thumbnailUrl)) return m.thumbnailUrl
  if (m?.url && /^https?:\/\//i.test(m.url)) return m.url
  return undefined
}

function sanitizeListing(raw: ListingRow): ListingRow | null {
  if (!raw || typeof raw !== 'object') return null
  const name = typeof raw.name === 'string' ? raw.name : undefined
  const token =
    typeof raw.token === 'string'
      ? raw.token
      : typeof raw.token_id === 'string'
        ? raw.token_id
        : undefined
  const identifier = typeof raw.identifier === 'string' ? raw.identifier : undefined
  const listing_id =
    typeof raw.listing_id === 'number'
      ? raw.listing_id
      : typeof raw.listing_id === 'string'
        ? Number(raw.listing_id)
        : undefined
  return {
    ...raw,
    name,
    token,
    token_id: token,
    identifier,
    listing_id,
  }
}

export default function MarketplacePage() {
  const { connected, address, method } = useWallet()
  const account = useUserAccount(connected ? address : null)
  const { push } = useToast()
  const live = canListBuyNft()
  const [params] = useSearchParams()
  const [listings, setListings] = useState<ListingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [payable, setPayable] = useState<MarketPayableStatus | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await fetchMarketplaceListings()
      const cleaned = (rows || []).map(sanitizeListing).filter(Boolean) as ListingRow[]
      setListings(cleaned)
      const pay = await fetchMarketPayable()
      setPayable(pay)
    } catch {
      setListings([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const pageListings = useMemo(() => listings.slice(0, PAGE), [listings])

  return (
    <div className="animate-fade-in space-y-6 pb-20 max-w-4xl mx-auto">
      <header className="space-y-2">
        <p className="section-label">Marketplace</p>
        <h1 className="section-title display text-2xl">Vitrine on-chain</h1>
        <p className="text-[13px] text-zinc-500">
          List / buy NFT · {live ? 'SC live' : 'paper / preview'} ·{' '}
          {MARKETPLACE_ADDRESS ? (
            <span className="mono text-[11px] text-zinc-600">{MARKETPLACE_ADDRESS.slice(0, 12)}…</span>
          ) : (
            'adresse SC non configurée'
          )}
        </p>
        <p className="text-[12px] text-zinc-500">
          RWA Physical Art — certificats de provenance.
        </p>
        {!connected && (
          <button type="button" className="btn-primary text-sm" onClick={requestOpenConnect}>
            Connecter xPortal
          </button>
        )}
      </header>

      {/* RWA Physical Art only */}
      <FrameitMarketPanel />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-white">Listings</h2>
          <button type="button" className="text-[11px] text-cyan-300" onClick={() => void refresh()}>
            {loading ? 'Chargement…' : 'Rafraîchir'}
          </button>
        </div>
        {pageListings.length === 0 && !loading && (
          <p className="text-[13px] text-zinc-500">Aucun listing indexé pour le moment.</p>
        )}
        <ul className="grid gap-3 sm:grid-cols-2">
          {pageListings.map((l, i) => {
            const price = priceEgldOf(l)
            const title = asText(l.name || l.identifier || l.token || `Listing ${i + 1}`)
            return (
              <li
                key={String(l.listing_id ?? l.identifier ?? i)}
                className="rounded-2xl border border-white/10 bg-black/40 p-3 space-y-2"
              >
                <p className="text-sm font-medium text-white">{title}</p>
                <p className="font-mono text-[12px] text-zinc-400">
                  {price > 0 ? `${price.toFixed(4)} EGLD` : '—'}
                </p>
                <p className="text-[10px] mono text-zinc-600 truncate">
                  {asText(l.identifier || l.token || '')}
                </p>
              </li>
            )
          })}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3 text-[12px] text-zinc-500">
        <Link to="/studio" className="hover:text-zinc-300">
          Studio
        </Link>
        <Link to="/agents" className="hover:text-zinc-300">
          Packs
        </Link>
        <Link to="/" className="hover:text-zinc-300">
          Accueil
        </Link>
      </div>
    </div>
  )
}
