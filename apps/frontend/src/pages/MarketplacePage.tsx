/**
 * Marketplace dual — Onglet RWA Physique | Onglet Digital SFT/NFT.
 * Frameit purged. Canonical route: /market
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { requestOpenConnect } from '../lib/walletEvents'
import { useI18n } from '../i18n/I18nContext'
import { canListBuyNft, MARKETPLACE_ADDRESS } from '../config/scStatus'
import { AGENT_PACKS } from '../config/agentPacks'
import RwaPhysicalPanel from '../components/market/RwaPhysicalPanel'

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
  const [tab, setTab] = useState<Tab>('rwa')
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(false)

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
    void refresh()
  }, [refresh])

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
          <button type="button" className="btn-primary text-sm" onClick={requestOpenConnect}>
            {t('nav.wallet') || 'xPortal'}
          </button>
        )}
      </header>

      <div className="flex gap-1 p-1 rounded-xl bg-black/40 border border-white/10 w-fit flex-wrap">
        <button
          type="button"
          onClick={() => setTab('rwa')}
          className={`px-4 py-2 rounded-lg text-[12px] font-semibold min-h-[40px] ${
            tab === 'rwa' ? 'bg-amber-600/35 text-amber-50' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {t('market.tab.rwa') || 'RWA Physique'}
        </button>
        <button
          type="button"
          onClick={() => setTab('digital')}
          className={`px-4 py-2 rounded-lg text-[12px] font-semibold min-h-[40px] ${
            tab === 'digital' ? 'bg-cyan-600/35 text-cyan-50' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {t('market.tab.digital') || 'Digital SFT / NFT'}
        </button>
      </div>

      {tab === 'rwa' && (
        <section className="space-y-4">
          <RwaPhysicalPanel />
          <p className="text-[12px] text-zinc-500">
            {t('market.rwa.hint') ||
              'Médium · dimensions · chip NFC · certificat de provenance on-chain. Distinct des packs agents.'}
          </p>
        </section>
      )}

      {tab === 'digital' && (
        <section className="space-y-4">
          <div className="rounded-xl border border-cyan-500/20 bg-black/40 p-4 space-y-3">
            <h2 className="text-sm font-semibold text-white">
              {t('market.digital.packs') || 'Passes Agents (SFT)'}
            </h2>
            <ul className="grid gap-2 sm:grid-cols-3">
              {AGENT_PACKS.map(p => (
                <li key={p.id} className="rounded-xl border border-white/10 bg-black/50 p-3">
                  <p className="text-sm font-medium text-white">
                    {p.icon} {p.name}
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-1">{p.tagline}</p>
                  <p className="mt-2 tabular-nums text-cyan-100">{p.priceEgld?.list ?? '—'} EGLD</p>
                </li>
              ))}
            </ul>
            <Link to="/agents" className="btn-primary text-xs inline-flex min-h-[40px] items-center px-4">
              {t('nav.packs') || 'Packs'} →
            </Link>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-white">
                {t('market.digital.listings') || 'Listings numériques'}
              </h2>
              <button type="button" className="text-[11px] text-cyan-300" onClick={() => void refresh()}>
                {loading ? '…' : t('market.refresh') || 'Rafraîchir'}
              </button>
            </div>
            {pageListings.length === 0 && !loading && (
              <p className="text-[13px] text-zinc-500">
                {t('market.empty') || 'Aucun listing indexé pour le moment.'}
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
        <Link to="/market/analytics" className="hover:text-zinc-300">
          Analytics
        </Link>
        <Link to="/" className="hover:text-zinc-300">
          {t('nav.home') || 'Accueil'}
        </Link>
      </div>
    </div>
  )
}
