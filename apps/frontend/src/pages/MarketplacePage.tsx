/**
 * Marketplace dual — RWA | Digital — protocol UI.
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
  const { t, lang } = useI18n()
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
    <div className="xa-page animate-fade-in space-y-8 pb-24 max-w-4xl mx-auto">
      <header className="xa-hero" style={{ paddingTop: '1.25rem', maxWidth: '100%' }}>
        <p className="xa-hero__kicker">{t('nav.market')}</p>
        <h1 className="xa-hero__title">{t('market.title')}</h1>
        <p className="xa-hero__lead">
          {t('market.lead') ||
            (lang === 'fr'
              ? 'RWA physique certifié · passes et art numérique SFT/NFT'
              : 'Certified physical RWA · digital passes and SFT/NFT art')}
        </p>
        <p className="text-xs mono text-[var(--xa-text-muted)]">
          List / buy · {live ? 'SC live' : 'paper'} ·{' '}
          {MARKETPLACE_ADDRESS ? `${MARKETPLACE_ADDRESS.slice(0, 12)}…` : 'SC n/a'}
        </p>
        {!connected && (
          <button type="button" className="xa-btn-primary mt-4" onClick={requestOpenConnect}>
            {t('common.connect')}
          </button>
        )}
      </header>

      <div
        className="flex gap-1 p-1 rounded-xl w-fit flex-wrap"
        style={{ background: 'var(--xa-surface)', border: '1px solid var(--xa-border)' }}
      >
        <button
          type="button"
          onClick={() => goTab('rwa')}
          className={`px-4 py-2 rounded-full text-[12px] font-semibold min-h-[40px] ${
            tab === 'rwa' ? 'bg-white/10 text-[var(--xa-text)]' : 'text-[var(--xa-text-muted)]'
          }`}
        >
          {t('market.tab.rwa') || 'RWA'}
        </button>
        <button
          type="button"
          onClick={() => goTab('digital')}
          className={`px-4 py-2 rounded-full text-[12px] font-semibold min-h-[40px] ${
            tab === 'digital' ? 'bg-white/10 text-[var(--xa-text)]' : 'text-[var(--xa-text-muted)]'
          }`}
        >
          {t('market.tab.digital') || 'NFT & Packs'}
        </button>
      </div>

      {tab === 'rwa' && (
        <section className="space-y-4">
          <RwaPhysicalPanel />
          <p className="xa-disclaimer">
            {t('market.rwa.hint') ||
              (lang === 'fr'
                ? 'Médium · dimensions · NFC · provenance on-chain. Distinct des packs agents.'
                : 'Medium · dimensions · NFC · on-chain provenance. Distinct from agent packs.')}
          </p>
          <Link to="/studio" className="xa-btn-secondary inline-flex">
            Studio →
          </Link>
        </section>
      )}

      {tab === 'digital' && (
        <section className="space-y-6">
          <DigitalPacksPanel />

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-[var(--xa-text)]">
                {t('market.digital.listings') || 'Listings SC'}
              </h2>
              <button
                type="button"
                className="text-xs text-[var(--xa-text-secondary)] min-h-[40px]"
                onClick={() => void refresh()}
              >
                {loading ? '…' : t('market.refresh') || (lang === 'fr' ? 'Rafraîchir' : 'Refresh')}
              </button>
            </div>
            {pageListings.length === 0 && !loading && (
              <p className="text-sm text-[var(--xa-text-muted)]">
                {t('market.empty') ||
                  (lang === 'fr'
                    ? 'Aucun listing SC — mint pack ou marché secondaire.'
                    : 'No SC listings — mint pack or secondary market.')}
              </p>
            )}
            <ul className="grid gap-3 sm:grid-cols-2">
              {pageListings.map((l, i) => {
                const price = priceEgldOf(l)
                const title = asText(l.name || l.identifier || l.token || `Listing ${i + 1}`)
                return (
                  <li key={String(l.listing_id ?? l.identifier ?? i)} className="xa-card space-y-2">
                    <p className="text-sm font-medium text-[var(--xa-text)]">{title}</p>
                    <p className="font-mono text-xs text-[var(--xa-text-muted)]">
                      {price > 0 ? `${price.toFixed(4)} EGLD` : '—'}
                    </p>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-4 text-sm">
        <Link to="/studio" className="text-[var(--xa-text-secondary)] hover:text-[var(--xa-text)]">
          Studio
        </Link>
        <Link to="/agents" className="text-[var(--xa-text-secondary)] hover:text-[var(--xa-text)]">
          {t('nav.packs')}
        </Link>
        <Link to="/museum" className="text-[var(--xa-text-secondary)] hover:text-[var(--xa-text)]">
          {t('nav.museum')}
        </Link>
        <Link to="/" className="text-[var(--xa-text-secondary)] hover:text-[var(--xa-text)]">
          {t('nav.home')}
        </Link>
      </div>
    </div>
  )
}
