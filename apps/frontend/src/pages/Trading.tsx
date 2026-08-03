import { useEffect, useState } from 'react'
import { useMultiversX } from '../hooks/useMultiversX'
import LiaBoardPanel from '../components/LiaBoardPanel'
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
      <div className="mb-8">
        <h1 className="text-3xl font-black">⚡ Trading Terminal LIA</h1>
        <p className="text-gray-500 mt-1">
          Board multi-venues · arb block-time · séries $10 · trailing
          {dataTs ? ` · data ${new Date(dataTs).toLocaleString('fr-FR')}` : ''}
        </p>
      </div>

      <LiaBoardPanel />

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">🧠 Signal LIA v6</p>
          <div className="flex items-center gap-6">
            <div className="text-5xl font-black text-gray-400">⏸️</div>
            <div>
              <p className="text-2xl font-bold">MONITORING</p>
              <p className="text-sm text-gray-500">Cycle Vellum (gate → trailing → close)</p>
              <span className={`badge-gray mt-2 ${guardColor}`}>Guard: {guard}</span>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-[#111118] text-xs text-gray-400">
            Exécution live sur <strong className="text-gray-300">Vellum</strong>. Dashboard = JSON GitHub.
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
          </div>
        </div>
      </div>

      <div className="card mb-8">
        <h2 className="text-lg font-bold mb-4">🎯 Trailing stops</h2>
        {trails.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune position dans lia_trailing_state.json</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-[#2a2a3a]">
                  <th className="py-2 pr-2">Token</th>
                  <th className="py-2 pr-2">Entry</th>
                  <th className="py-2 pr-2">Stop</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {trails.map(p => (
                  <tr key={p.id || p.token} className="border-b border-[#1a1a24]">
                    <td className="py-2 pr-2">{p.token}</td>
                    <td className="py-2 pr-2 mono">{p.entry}</td>
                    <td className="py-2 pr-2 mono text-orange-300">{p.stop}</td>
                    <td className="py-2">{p.status ?? 'OPEN'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card mb-8">
        <h2 className="text-lg font-bold mb-4">📋 Historique trades</h2>
        {trades.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun trade loggé — Vellum push data/lia_trades.json</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-[#2a2a3a]">
                  <th className="py-2 pr-2">Date</th>
                  <th className="py-2 pr-2">Side</th>
                  <th className="py-2 pr-2">Pair</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t, i) => (
                  <tr key={t.id || i} className="border-b border-[#1a1a24]">
                    <td className="py-2 pr-2 text-xs text-gray-400">
                      {t.ts ? new Date(t.ts).toLocaleString('fr-FR') : '—'}
                    </td>
                    <td className="py-2 pr-2 font-semibold">{t.side}</td>
                    <td className="py-2 pr-2 mono text-xs">{t.pair}</td>
                    <td className="py-2">{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pools.length > 0 && (
        <div className="card mb-8">
          <h2 className="text-lg font-bold mb-4">💧 Pools $TRO</h2>
          <div className="space-y-2">
            {pools.slice(0, 5).map((p: { pair_name?: string; tvl_usd?: number }, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#111118]">
                <span className="font-semibold text-sm">{p.pair_name}</span>
                <span className="text-green-400 font-bold">${(p.tvl_usd ?? 0).toFixed(2)} TVL</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-bold mb-4">🔀 DEX Mainnet</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: 'xExchange', url: LINKS.xexchange },
            { name: 'OneDex', url: LINKS.onedex },
            { name: 'Hatom', url: LINKS.hatom },
            { name: 'XOXNO', url: LINKS.xoxno },
          ].map(d => (
            <a key={d.name} href={d.url} target="_blank" rel="noreferrer" className="btn-secondary text-center text-sm">
              {d.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
