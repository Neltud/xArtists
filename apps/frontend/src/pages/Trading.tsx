import { useEffect, useState } from 'react'
import { useMultiversX } from '../hooks/useMultiversX'
import LiaBoardPanel from '../components/LiaBoardPanel'
import GuardianStatusPanel from '../components/GuardianStatusPanel'
import ScStatusBanner from '../components/ScStatusBanner'
import PageGuide from '../components/PageGuide'
import DeskPanel from '../components/DeskPanel'
import InfoTip from '../components/InfoTip'
import { LINKS } from '../config/links'

const RAW = 'https://raw.githubusercontent.com/Neltud/xArtists/main'

interface LiaTrade {
  id?: string
  ts?: string
  pair?: string
  side?: string
  status?: string
  entry?: number
  price?: number
  size_usd?: number
  confidence?: number
  source?: string
}

interface TrailPos {
  id?: string
  token?: string
  entry?: number
  stop?: number
  hwm?: number
  size_usd?: number
  size_remaining_pct?: number
  status?: string
  trail_mode?: string
}

export default function Trading() {
  const { prices, liaStatus, bonData } = useMultiversX()
  const [trades, setTrades] = useState<LiaTrade[]>([])
  const [trails, setTrails] = useState<TrailPos[]>([])
  const [dataTs, setDataTs] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [tRes, trRes] = await Promise.all([
          fetch(`${RAW}/data/lia_trades.json`, { cache: 'no-store' }),
          fetch(`${RAW}/data/lia_trailing_state.json`, { cache: 'no-store' }),
        ])
        if (cancelled) return
        if (tRes.ok) {
          const j = await tRes.json()
          setTrades(Array.isArray(j.trades) ? j.trades.slice(0, 30) : [])
          setDataTs(j.updated || '')
        }
        if (trRes.ok) {
          const j = await trRes.json()
          setTrails(Array.isArray(j.positions) ? j.positions : [])
        }
      } catch {
        /* offline */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const guard = liaStatus?.market?.guard_status ?? 'OK'
  const guardColor =
    guard === 'OK' ? 'text-green-400' : guard === 'WARNING' ? 'text-orange-400' : 'text-red-400'
  const pools = bonData?.xexchange_pools ?? []
  const winningPair = bonData?.winning_pair ?? 'TRO/WEGLD'
  const recommendedPair = bonData?.recommended_pair ?? 'TRO/WEGLD'

  return (
    <div className="animate-fade-in">
      <PageGuide page="trading" />

      <div className="mb-6">
        <h1 className="text-3xl font-black">⚡ Trading Terminal LIA</h1>
        <p className="text-gray-500 mt-1">
          Board multi-venues · arb block-time · séries $10 · trailing · Guardian first{' '}
          <InfoTip k="live_trading" />
          {dataTs ? ` · data ${new Date(dataTs).toLocaleString('fr-FR')}` : ''}
        </p>
      </div>

      <ScStatusBanner />
      <GuardianStatusPanel />
      <DeskPanel />
      <LiaBoardPanel />

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">🧠 Signal LIA v6</p>
          <div className="flex items-center gap-6">
            <div className="text-5xl font-black text-gray-400">⏸️</div>
            <div>
              <p className="text-2xl font-bold">MONITORING</p>
              <p className="text-sm text-gray-500">Cycle Vellum (Guardian → gate → trailing)</p>
              <span className={`badge-gray mt-2 ${guardColor}`}>BalanceGuard: {guard}</span>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-[#111118] text-xs text-gray-400">
            <strong className="text-gray-300">LIA_LIVE_TRADING=0</strong> — pas d’envoi PEM. Dashboard =
            JSON GitHub / Pages.
          </div>
        </div>

        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">🪙 Analyse $TRO</p>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Prix $TRO</span>
              <span className="mono font-bold text-purple-400">${prices.tro.toFixed(8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Meilleure pool</span>
              <span className="font-bold text-green-400">{winningPair}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Reco LIA</span>
              <span className="font-bold text-yellow-400">{recommendedPair}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Supply max produit</span>
              <span className="font-bold">500 000</span>
            </div>
          </div>
          <a
            href={LINKS.xexchange || 'https://xexchange.com'}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary text-sm mt-4 inline-block"
          >
            Ouvrir DEX →
          </a>
        </div>
      </div>

      {pools.length > 0 && (
        <div className="card mb-8">
          <p className="text-xs font-semibold uppercase text-gray-500 mb-3">Pools (snapshot)</p>
          <ul className="text-sm space-y-1 text-gray-400">
            {pools.slice(0, 8).map((p: string | { name?: string }, i: number) => (
              <li key={i}>{typeof p === 'string' ? p : p.name || JSON.stringify(p)}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="card mb-8">
        <h2 className="text-lg font-bold mb-3">Trades paper (JSON)</h2>
        {trades.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun trade publié — Vellum board / pipeline.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b border-[#2a2a3a]">
                  <th className="text-left py-2">Pair</th>
                  <th className="text-left py-2">Side</th>
                  <th className="text-right py-2">Size</th>
                  <th className="text-right py-2">Conf</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t, i) => (
                  <tr key={t.id || i} className="border-b border-[#2a2a3a]/40">
                    <td className="py-2">{t.pair || '—'}</td>
                    <td className="py-2">{t.side || t.status || '—'}</td>
                    <td className="py-2 text-right mono">{t.size_usd ?? '—'}</td>
                    <td className="py-2 text-right mono">{t.confidence ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card mb-8">
        <h2 className="text-lg font-bold mb-3">Trailing (state)</h2>
        {trails.length === 0 ? (
          <p className="text-sm text-gray-500">Pas de positions trailing publiées.</p>
        ) : (
          <ul className="text-sm space-y-2">
            {trails.map((tr, i) => (
              <li key={tr.id || i} className="flex justify-between gap-2 border-b border-[#2a2a3a]/30 py-1">
                <span>{tr.token || tr.id}</span>
                <span className="mono text-gray-400">
                  stop {tr.stop ?? '—'} · hwm {tr.hwm ?? '—'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
