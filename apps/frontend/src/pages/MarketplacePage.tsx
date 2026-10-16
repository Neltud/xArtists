/**
 * Marketplace dual — RWA Physique | Digital NFT/SFT packs.
 * Frameit hors produit ; floor via MultiversX API.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { requestOpenConnect } from '../lib/walletEvents'
import { useI18n } from '../i18n/I18nContext'
import { canListBuyNft, MARKETPLACE_ADDRESS } from '../config/scStatus'
import RwaPhysicalPanel from '../components/market/RwaPhysicalPanel'
import DigitalPacksPanel from '../components/market/DigitalPacksPanel'

type Tab = 'rwa' | 'digital'

type Listing = {
  listing_id?: string | number
  identifier?: string
  token?: string
  name?: string
  price?: number | string
  price_egld?: number | string
}

function asText(v: unknown): string {
  if (v == null) return ''
  return String(v)
}

function priceEgldOf(l: Listing): number {
  const p = l.price_egld ?? l.price
  const n = typeof p === 'string' ? parseFloat(p) : Number(p)
  return Number.isFinite(n) ? n : 0
}

export default function MarketplacePage() {
  const { t } = useI18n()
  const { connected } = useWallet()
  const live = canListBuyNft()
  const [params, setParams] = useSearchParams()
  const tabParam = params.get('tab')
  const [tab, setTab] = useState<Tab>(tabParam === 'digital' || tabParam === 'nft' ? 'digital' : 'rwa')
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (tabParam === 'digital' || tabParam === 'nft') setTab('digital')
    else if (tabParam === 'rwa') setTab('rwa')
  }, [tabParam])

  const goTab = (next: Tab) => {
    setTab(next)
    setParams(p => {
      const n = new URLSearchParams(p)
      if (next === 'rwa') n.delete('tab')
      else n.set('tab', 'digital')
      return n
    })
  }

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const base = (import.meta as { env?: { VITE_API_BASE?: string } }).env?.VITE_API_BASE
      if (!base) {
        setListings([])
        return
      }
      const r = await fetch(`${base.replace(/\/$/, '')}/marketplace/listings`, { cache: 'no-store' })
      if (!r.ok) throw new Error('http')
      const j = await r.json()
      const rows = Array.isArray(j) ? j : j.listings || j.items || []
      setListings(rows)
    } catch {
      setListings([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'digital') void refresh()
  }, [tab, refresh])

  const pageListings = useMemo(() => listings.slice(0, 24), [listings])

  return (
    <div className="animate-fade-in space-y-5 pb-24 max-w-4xl mx-auto">
      <header className="space-y-2">
        <p className="section-label">{t('nav.market') || 'Market'}</p>
        <h1 className="section-title display text-2xl">{t('market.title') || 'Marketplace'}</h1>
        <p className="text-[13px] text-zinc-500">
          {t('market.lead') || 'RWA physique certifié · Passes & art numérique SFT/NFT'}
        </p>
        <p className="text-[12px] text-zinc-600 mono">
          List / buy · {live ? 'SC live' : 'paper'} ·{' '}
          {MARKETPLACE_ADDRESS ? `${MARKETPLACE_ADDRESS.slice(0, 12)}…` : 'SC n/a'}
        </p>
        {!connected && (
          <button type="button" className="btn-primary text-sm min-h-[44px]" onClick={requestOpenConnect}>
            {t('nav.wallet') || 'xPortal'}
          </button>
        )}
      </header>

      <div className="flex gap-1 p-1 rounded-xl bg-black/40 border border-white/10 w-fit flex-wrap">
        <button
          type="button"
          onClick={() => goTab('rwa')}
          className={`px-4 py-2 rounded-lg text-[12px] font-semibold min-h-[44px] ${
            tab === 'rwa' ? 'bg-amber-600/35 text-amber-50' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {t('market.tab.rwa') || 'Studio RWA · Art physique'}
        </button>
        <button
          type="button"
          onClick={() => goTab('digital')}
          className={`px-4 py-2 rounded-lg text-[12px] font-semibold min-h-[44px] ${
            tab === 'digital' ? 'bg-cyan-600/35 text-cyan-50' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {t('market.tab.digital') || 'NFT & Packs'}
        </button>
      </div>

      {tab === 'rwa' && (
        <section className="space-y-4">
          <RwaPhysicalPanel />
          <p className="text-[12px] text-zinc-500">
            {t('market.rwa.hint') ||
              'Médium · dimensions · chip NFC · certificat de provenance on-chain. Distinct des packs agents.'}
          </p>
          <Link to="/studio" className="btn-secondary text-xs inline-flex min-h-[44px] items-center px-4">
            Ouvrir Studio Phygital →
          </Link>
        </section>
      )}

      {tab === 'digital' && (
        <section className="space-y-6">
          <DigitalPacksPanel />

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-white">
                {t('market.digital.listings') || 'Listings marketplace SC'}
              </h2>
              <button
                type="button"
                className="text-[11px] text-cyan-300 min-h-[40px]"
                onClick={() => void refresh()}
              >
                {loading ? '…' : t('market.refresh') || 'Rafraîchir'}
              </button>
            </div>
            {pageListings.length === 0 && !loading && (
              <p className="text-[13px] text-zinc-500">
                {t('market.empty') ||
                  'Aucun listing SC indexé — utilise Acheter pack (mint) ou le marché secondaire Xoxno.'}
              </p>
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
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-3 text-[12px] text-zinc-500">
        <Link to="/studio" className="hover:text-zinc-300">
          Studio
        </Link>
        <Link to="/agents" className="hover:text-zinc-300">
          {t('nav.packs') || 'Packs'}
        </Link>
        <Link to="/museum" className="hover:text-zinc-300">
          {t('nav.museum') || 'Musée'}
        </Link>
        <Link to="/" className="hover:text-zinc-300">
          {t('nav.home') || 'Accueil'}
        </Link>
      </div>
    </div>
  )
}
