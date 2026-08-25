import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMultiversX } from '../hooks/useMultiversX'
import LiaBoardPanel from '../components/LiaBoardPanel'
import GuardianStatusPanel from '../components/GuardianStatusPanel'
import ScStatusBanner from '../components/ScStatusBanner'
import PageGuide from '../components/PageGuide'
import DeskPanel from '../components/DeskPanel'
import InfoTip from '../components/InfoTip'
import LiaVsUserBanner from '../components/LiaVsUserBanner'
import CompoundingPanel from '../components/CompoundingPanel'
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
  paper?: boolean
  echelon?: string
  strategy?: string
  fee_usd?: number
  gas_usd?: number
  pnl_net_usd?: number
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
  const [loadErr, setLoadErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [tRes, trRes] = await Promise.all([
          fetch(`${RAW}/data/lia_trades.json?t=${Date.now()}`, { cache: 'no-store' }),
          fetch(`${RAW}/data/lia_trailing_state.json?t=${Date.now()}`, { cache: 'no-store' }),
        ])
        if (cancelled) return
        if (tRes.ok) {
          const j = await tRes.json()
          setTrades(Array.isArray(j.trades) ? j.trades.slice(0, 30) : [])
          setDataTs(j.updated || '')
        } else {
          setLoadErr(`trades HTTP ${tRes.status}`)
        }
        if (trRes.ok) {
          const j = await trRes.json()
          setTrails(Array.isArray(j.positions) ? j.positions : [])
        }
      } catch {
        if (!cancelled) setLoadErr('board offline')
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
  const liveFlag = Boolean((liaStatus as { live_trading?: boolean } | null)?.live_trading)
  const mode = (liaStatus as { mode?: string } | null)?.mode

  return (
    <div className="animate-fade-in">
      <PageGuide page="trading" />
      <LiaVsUserBanner tone="protocol" />

      <div className="mb-6">
        <h1 className="text-3xl font-black">⚡ Trading Terminal LIA</h1>
        <p className="text-gray-500 mt-1">
          Board multi-venues · arb block-time · trailing · Guardian first{' '}
          <InfoTip k="paperFirst" />
          {dataTs ? ` · data ${new Date(dataTs).toLocaleString('fr-FR')}` : ''}
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        <strong>Paper / protocole LIA</strong> — ce n’est pas ton compte de trading.
        {liveFlag ? (
          <span className="text-red-200"> Flag live détecté dans le status JSON — vérifier ops.</span>
        ) : (
          <span> LIA_LIVE_TRADING=0 · aucun ordre sur tes fonds.</span>
        )}{' '}
        Access packs →{' '}
        <Link to="/my-packs" className="underline text-amber-50">
          My Packs
        </Link>
        . Book LIA →{' '}
        <Link to="/portfolio" className="underline text-amber-50">
          Portfolio
        </Link>
        . Wallet user →{' '}
        <Link to="/wallet" className="underline text-amber-50">
          Wallet
        </Link>
        .
      </div>

      <ScStatusBanner />
      <GuardianStatusPanel />
      <DeskPanel />
      <LiaBoardPanel />

      <CompoundingPanel />

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">
            🧠 Signal LIA v6
          </p>
          <div className="flex items-center gap-6">
            <div className="text-5xl font-black text-gray-400">{liveFlag ? '🔴' : '⏸️'}</div>
            <div>
              <p className="text-2xl font-bold">{liveFlag ? 'LIVE FLAG' : 'MONITORING'}</p>
              <p className="text-sm text-gray-500">
                {mode || 'Cycle Vellum'} · Guardian → gate → trailing
              </p>
              <span className={`badge-gray mt-2 ${guardColor}`}>BalanceGuard: {guard}</span>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-[#111118] text-xs text-gray-400">
            <strong className="text-gray-300">Paper board</strong> — JSON GitHub / Pages. Live seulement
            après micro-preuves + flag ops.
          </div>
        </div>

        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">
            🪙 Analyse $TRO
          </p>
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
            href={LINKS.xexchangeTroUsdc}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary text-sm mt-4 inline-block"
          >
            Swap $TRO →
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
        {loadErr && <p className="text-xs text-amber-400 mb-2">{loadErr}</p>}
        {trades.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aucun trade publié —{' '}
            <code className="text-[10px]">python -m lia.board.publish</code> / Vellum.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b border-[#2a2a3a]">
                  <th className="text-left py-2">Echelon</th>
                  <th className="text-left py-2">Pair</th>
                  <th className="text-left py-2">Strat</th>
                  <th className="text-left py-2">Side</th>
                  <th className="text-right py-2">Size</th>
                  <th className="text-right py-2">Fee</th>
                  <th className="text-right py-2">PnL net</th>
                  <th className="text-left py-2">Tag</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t, i) => (
                  <tr key={t.id || i} className="border-b border-[#2a2a3a]/40">
                    <td className="py-2 text-xs">{t.echelon || '—'}</td>
                    <td className="py-2">{t.pair || '—'}</td>
                    <td className="py-2 text-xs text-purple-300">{t.strategy || t.source || '—'}</td>
                    <td className="py-2">{t.side || t.status || '—'}</td>
                    <td className="py-2 text-right mono">{t.size_usd ?? '—'}</td>
                    <td className="py-2 text-right mono text-gray-500">{t.fee_usd ?? '—'}</td>
                    <td
                      className={`py-2 text-right mono ${
                        (t.pnl_net_usd ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {t.pnl_net_usd ?? '—'}
                    </td>
                    <td className="py-2 text-[10px] text-amber-300/90">
                      {t.paper !== false ? 'paper' : 'check'}
                    </td>
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
              <li
                key={tr.id || i}
                className="flex justify-between gap-2 border-b border-[#2a2a3a]/30 py-1"
              >
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
