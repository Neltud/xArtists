/**
 * Simulation Lab — exhaustive client-side demo of LIA trades, user journey, modules.
 * SC deploy soon: UI already models every path; on-chain gates stay fail-closed.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageGuide from '../components/PageGuide'

type SimTrade = {
  id: string
  ts: number
  echelon: number
  pair: string
  side: 'BUY' | 'SELL'
  sizeUsd: number
  entry: number
  exit: number
  feeUsd: number
  gasUsd: number
  pnlNet: number
  strategy: string
  stopLoss: number
}

const PAIRS = ['TRO/USDC', 'WEGLD/USDC', 'MEX/WEGLD', 'UTK/WEGLD', 'TRO/WEGLD']
const STRATS = ['S1-1pct', 'S05-scalp', 'S2-swing', 'GSN-elite', 'ARB-xEx']

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

function genTrades(n: number, seed = 42): SimTrade[] {
  const r = rng(seed)
  const out: SimTrade[] = []
  let t = Date.now() - n * 45_000
  for (let i = 0; i < n; i++) {
    const pair = PAIRS[Math.floor(r() * PAIRS.length)]
    const side: 'BUY' | 'SELL' = r() > 0.45 ? 'BUY' : 'SELL'
    const entry = 0.5 + r() * 40
    const move = (r() - 0.42) * 0.04
    const exit = entry * (1 + move)
    const sizeUsd = 20 + r() * 180
    const feeUsd = sizeUsd * 0.0025
    const gasUsd = 0.02 + r() * 0.08
    const raw = side === 'BUY' ? (exit - entry) / entry : (entry - exit) / entry
    const pnlNet = sizeUsd * raw - feeUsd - gasUsd
    const stopLoss = side === 'BUY' ? entry * 0.97 : entry * 1.03
    out.push({
      id: `sim-${i}`,
      ts: t,
      echelon: 1 + Math.floor(r() * 10),
      pair,
      side,
      sizeUsd: Math.round(sizeUsd * 100) / 100,
      entry: Math.round(entry * 10000) / 10000,
      exit: Math.round(exit * 10000) / 10000,
      feeUsd: Math.round(feeUsd * 1000) / 1000,
      gasUsd: Math.round(gasUsd * 1000) / 1000,
      pnlNet: Math.round(pnlNet * 100) / 100,
      strategy: STRATS[Math.floor(r() * STRATS.length)],
      stopLoss: Math.round(stopLoss * 10000) / 10000,
    })
    t += 30_000 + Math.floor(r() * 60_000)
  }
  return out.reverse()
}

export default function SimulationLab() {
  const [trades, setTrades] = useState<SimTrade[]>(() => genTrades(24))
  const [running, setRunning] = useState(false)
  const [seed, setSeed] = useState(42)

  const stats = useMemo(() => {
    const n = trades.length
    const wins = trades.filter(t => t.pnlNet > 0).length
    const pnl = trades.reduce((a, t) => a + t.pnlNet, 0)
    const fees = trades.reduce((a, t) => a + t.feeUsd + t.gasUsd, 0)
    return {
      n,
      wins,
      winRate: n ? (wins / n) * 100 : 0,
      pnl: Math.round(pnl * 100) / 100,
      fees: Math.round(fees * 100) / 100,
    }
  }, [trades])

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      setTrades(prev => {
        const batch = genTrades(1, Date.now() % 1_000_000)
        return [...batch, ...prev].slice(0, 40)
      })
    }, 2200)
    return () => clearInterval(id)
  }, [running])

  const reshuffle = useCallback(() => {
    const s = seed + 1
    setSeed(s)
    setTrades(genTrades(24, s))
  }, [seed])

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      <PageGuide page="sim" defaultOpen />

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-purple-400/80">Demo lab</p>
          <h1 className="text-3xl font-black">Simulation Lab</h1>
          <p className="text-sm text-zinc-500 mt-1 max-w-xl">
            Trades LIA paper côté client — fees & gas inclus. Les SC on-chain restent fail-closed jusqu’au deploy.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary text-xs py-2 px-3" onClick={reshuffle}>
            Nouveau tirage
          </button>
          <button
            type="button"
            className="btn-primary text-xs py-2 px-3"
            onClick={() => setRunning(v => !v)}
          >
            {running ? 'Pause stream' : 'Stream paper'}
          </button>
          <Link to="/trading" className="btn-secondary text-xs py-2 px-3">
            Board réel →
          </Link>
          <Link to="/entity" className="btn-secondary text-xs py-2 px-3">
            Entité
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card">
          <p className="text-[10px] text-zinc-500 uppercase">Trades</p>
          <p className="text-2xl font-bold mono">{stats.n}</p>
        </div>
        <div className="card">
          <p className="text-[10px] text-zinc-500 uppercase">Win rate</p>
          <p className="text-2xl font-bold mono">{stats.winRate.toFixed(1)}%</p>
        </div>
        <div className="card">
          <p className="text-[10px] text-zinc-500 uppercase">PnL net</p>
          <p className={`text-2xl font-bold mono ${stats.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {stats.pnl}
          </p>
        </div>
        <div className="card">
          <p className="text-[10px] text-zinc-500 uppercase">Fees+gas</p>
          <p className="text-2xl font-bold mono text-zinc-300">{stats.fees}</p>
        </div>
      </section>

      <div className="card overflow-x-auto">
        <h2 className="font-bold mb-3">Journal simulé</h2>
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-zinc-500 border-b border-white/10 text-left">
              <th className="py-2">#</th>
              <th>Pair</th>
              <th>Strat</th>
              <th>Side</th>
              <th className="text-right">Size</th>
              <th className="text-right">Fee</th>
              <th className="text-right">PnL</th>
              <th className="text-right">SL</th>
            </tr>
          </thead>
          <tbody>
            {trades.map(t => (
              <tr key={t.id + t.ts} className="border-b border-white/5">
                <td className="py-1.5 text-xs text-zinc-500">E{t.echelon}</td>
                <td>{t.pair}</td>
                <td className="text-xs text-purple-300">{t.strategy}</td>
                <td>{t.side}</td>
                <td className="text-right mono">{t.sizeUsd}</td>
                <td className="text-right mono text-zinc-500">{t.feeUsd}</td>
                <td
                  className={`text-right mono ${t.pnlNet >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                >
                  {t.pnlNet}
                </td>
                <td className="text-right mono text-xs text-zinc-500">{t.stopLoss}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-zinc-600">
        Simulation locale navigateur — indépendante du board Vellum JSON. Pour le vrai paper board →{' '}
        <Link to="/trading" className="text-purple-400 underline">
          Trading
        </Link>
        .
      </p>
    </div>
  )
}
