import { useEffect, useState } from 'react'
import { fetchMirroredJson } from '../config/dataSources'
import { useMultiversX } from '../hooks/useMultiversX'

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
  tx?: string
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
        const [tradesData, trailsData] = await Promise.all([
          fetchMirroredJson<{ trades?: LiaTrade[]; updated?: string }>('lia_trades.json', { cache: 'no-store' }),
          fetchMirroredJson<{ positions?: TrailPos[] }>('lia_trailing_state.json', { cache: 'no-store' }),
        ])
        if (cancelled) return
        setTrades(Array.isArray(tradesData.trades) ? tradesData.trades.slice(0, 30) : [])
        setDataTs(tradesData.updated || '')
        setTrails(Array.isArray(trailsData.positions) ? trailsData.positions : [])
      } catch {
        /* offline / missing files */
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
          Signaux Vellum · trailing dynamique · historique trades
          {dataTs ? ` · data ${new Date(dataTs).toLocaleString('fr-FR')}` : ''}
        </p>
      </div>

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
            PEM et exécution live restent sur <strong className="text-gray-300">Vellum</strong>. Le dashboard lit
            uniquement les JSON publiés sur GitHub.
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
              <span className="text-gray-400 text-sm">Identifier</span>
              <span className="mono text-sm">TRO-94c925</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Supply (cible)</span>
              <span className="font-bold">476 223</span>
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

      {/* Trailing stops */}
      <div className="card mb-8">
        <h2 className="text-lg font-bold mb-4">🎯 Trailing stops (live state)</h2>
        {trails.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune position ouverte dans lia_trailing_state.json</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-[#2a2a3a]">
                  <th className="py-2 pr-2">ID</th>
                  <th className="py-2 pr-2">Token</th>
                  <th className="py-2 pr-2">Entry</th>
                  <th className="py-2 pr-2">HWM</th>
                  <th className="py-2 pr-2">Stop</th>
                  <th className="py-2 pr-2">Restant</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2">Explorer</th>
                </tr>
              </thead>
              <tbody>
                {trails.map((p) => (
                  <tr key={p.id || p.token} className="border-b border-[#1a1a24]">
                    <td className="py-2 pr-2 mono text-xs">{p.id}</td>
                    <td className="py-2 pr-2">{p.token}</td>
                    <td className="py-2 pr-2 mono">{p.entry?.toPrecision?.(6) ?? p.entry}</td>
                    <td className="py-2 pr-2 mono">{p.hwm?.toPrecision?.(6) ?? p.hwm}</td>
                    <td className="py-2 pr-2 mono text-orange-300">{p.stop?.toPrecision?.(6) ?? p.stop}</td>
                    <td className="py-2 pr-2">
                      {p.size_remaining_pct != null ? `${Math.round(p.size_remaining_pct * 100)}%` : '—'}
                    </td>
                    <td className="py-2">{p.status ?? 'OPEN'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trades history */}
      <div className="card mb-8">
        <h2 className="text-lg font-bold mb-4">📋 Historique trades LIA</h2>
        {trades.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aucun trade loggé. Vellum doit appeler <code className="text-purple-300">append_trade</code> /{' '}
            <code className="text-purple-300">live_cycle</code> puis push data/lia_trades.json.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-[#2a2a3a]">
                  <th className="py-2 pr-2">Date</th>
                  <th className="py-2 pr-2">Side</th>
                  <th className="py-2 pr-2">Pair</th>
                  <th className="py-2 pr-2">Size</th>
                  <th className="py-2 pr-2">Entry/Px</th>
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
                    <td className="py-2 pr-2">
                      {t.size_usd != null ? `$${t.size_usd}` : '—'}
                    </td>
                    <td className="py-2 pr-2 mono text-xs">{t.entry ?? t.price ?? '—'}</td>
                    <td className="py-2 pr-2">{t.status}</td>
                    <td className="py-2 text-xs">
                      {t.tx ? (
                        <a
                          href={`https://explorer.multiversx.com/transactions/${t.tx}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-purple-400 hover:text-purple-300"
                        >
                          tx ↗
                        </a>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card mb-8">
        <h2 className="text-lg font-bold mb-4">📊 Stratégies LIA v6</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { name: 'TP1 Scalping', tp: '+1%', sl: '-0.5%', desc: 'Scalping rapide', color: 'border-orange-500/30 text-orange-400' },
            { name: 'TP3 Swing Court', tp: '+3%', sl: '-1.5%', desc: 'Swing court', color: 'border-cyan-500/30 text-cyan-400' },
            { name: 'TP5 Swing Moyen', tp: '+5%', sl: '-2.5%', desc: 'Swing moyen + trailing', color: 'border-purple-500/30 text-purple-400' },
            { name: 'LIA Brain WBTC', tp: '+15%', sl: '-8%', desc: 'Bitcoin wrappé', color: 'border-yellow-500/30 text-yellow-400' },
            { name: 'Trailing hybrid', tp: 'HWM', sl: 'dyn', desc: 'ATR + BE + partial TP', color: 'border-green-500/30 text-green-400' },
            { name: 'Contrarian', tp: '+0.5%', sl: '-1%', desc: 'Contre-tendance', color: 'border-pink-500/30 text-pink-400' },
          ].map((s) => (
            <div key={s.name} className={`p-4 rounded-xl bg-[#111118] border ${s.color.split(' ')[0]}`}>
              <p className={`font-bold text-sm ${s.color.split(' ')[1]}`}>{s.name}</p>
              <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
              <div className="flex gap-3 mt-3">
                <span className="badge-green text-xs">TP {s.tp}</span>
                <span className="badge-red text-xs">SL {s.sl}</span>
              </div>
            </div>
          ))}
        </div>
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { name: 'OneDex TRO', url: 'https://dexscreener.com/multiversx/erd1qqqqqqqqqqqqqpgqqz6vp9y50ep867vnr296mqf3dduh6guvmvlsu3sujc-trowegld-ca2874', icon: '🟠' },
            { name: 'xExchange', url: 'https://xexchange.com/swap/USDC-c76f1f/TRO-94c925', icon: '🔵' },
            { name: 'Hatom', url: 'https://app.hatom.com', icon: '🏦' },
          ].map((d) => (
            <a key={d.name} href={d.url} target="_blank" rel="noreferrer" className="btn-secondary text-center text-sm">
              {d.icon} {d.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
