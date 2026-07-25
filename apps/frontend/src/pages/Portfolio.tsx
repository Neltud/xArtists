import { useMultiversX } from '../hooks/useMultiversX'

const MILESTONES = [
  { label: 'x2 — $20', threshold: 20 },
  { label: 'x5 — $50', threshold: 50 },
  { label: 'x10 — $100', threshold: 100 },
  { label: 'x50 — $500', threshold: 500 },
  { label: 'x100 — $1K', threshold: 1000 },
  { label: 'x500 — $5K', threshold: 5000 },
  { label: 'x1K — $10K', threshold: 10000 },
  { label: 'x5K — $50K', threshold: 50000 },
  { label: 'x10K — $100K', threshold: 100000 },
  { label: 'x50K — $500K', threshold: 500000 },
  { label: '🎯 x100K — $1M ATTEINT!', threshold: 1000000 },
]

export default function Portfolio() {
  const { liaStatus, prices } = useMultiversX()
  const portfolio = liaStatus?.portfolio?.total_usd ?? 0
  const millionPct = portfolio / 1_000_000 * 100
  const logPct = portfolio > 10 ? Math.log(portfolio / 10) / Math.log(100000) * 100 : 0

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black">📈 Portfolio & Profits</h1>
        <p className="text-gray-500 mt-1">Compounding $10 → $1,000,000 via DeFi MultiversX</p>
      </div>

      {/* Balance + progression */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Balance actuelle</p>
            <p className="text-4xl font-black">${portfolio.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Objectif</p>
            <p className="text-2xl font-bold text-purple-400">$1,000,000</p>
            <p className="text-xs text-gray-500">{millionPct.toFixed(8)}% atteint</p>
          </div>
        </div>
        <div className="progress-bar mb-2">
          <div className="progress-fill" style={{ width: `${Math.min(logPct, 100)}%` }} />
        </div>
        <p className="text-xs text-gray-500">Progression logarithmique: {logPct.toFixed(2)}%</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">EGLD</p>
          <p className="text-xl font-bold">{(liaStatus?.portfolio?.egld_balance ?? 0).toFixed(4)}</p>
          <p className="text-xs text-gray-500">${((liaStatus?.portfolio?.egld_balance ?? 0) * prices.egld).toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Hatom HF</p>
          <p className="text-xl font-bold">{(liaStatus?.portfolio?.hatom_health_factor ?? 999) >= 999 ? 'N/A' : (liaStatus?.portfolio?.hatom_health_factor ?? 0).toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Winrate</p>
          <p className="text-xl font-bold text-green-400">N/A</p>
          <p className="text-xs text-gray-500">Données on-chain</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">PnL</p>
          <p className="text-xl font-bold">N/A</p>
        </div>
      </div>

      {/* Jalons */}
      <div className="card mb-8">
        <h2 className="text-lg font-bold mb-4">🏆 Jalons $10 → $1M</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {MILESTONES.map(m => {
            const reached = portfolio >= m.threshold
            return (
              <div
                key={m.label}
                className={`p-3 rounded-xl text-sm font-medium text-center ${
                  reached
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-[#111118] text-gray-500 border border-[#2a2a3a]'
                }`}
              >
                {reached ? '✅' : '⬜'} {m.label}
              </div>
            )
          })}
        </div>
      </div>

      {/* Projections */}
      <div className="card">
        <h2 className="text-lg font-bold mb-4">📅 Projections (base: +1%/trade, 5 trades/jour)</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { label: '7 jours', value: portfolio * Math.pow(1.01, 35) },
            { label: '30 jours', value: portfolio * Math.pow(1.01, 150) },
            { label: '1 an', value: portfolio * Math.pow(1.01, 1825) },
          ].map(p => (
            <div key={p.label} className="p-4 rounded-xl bg-[#111118] border border-[#2a2a3a]">
              <p className="text-xs text-gray-500 mb-1">{p.label}</p>
              <p className="text-xl font-bold text-purple-400">${p.value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
