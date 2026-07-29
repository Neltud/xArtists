import { usePortfolioValue, type PortfolioToken, type PortfolioNft } from '../hooks/usePortfolioValue'

const WALLET = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'

const GOAL_USD = 1_000_000
const START_USD = 3

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

function fmtUsd(n: number, max = 2) {
  return `$${n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: max })}`
}

function fmtBalance(n: number) {
  if (n === 0) return '0'
  if (n < 0.0001) return n.toExponential(2)
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 6 })
}

function TokenRow({ t }: { t: PortfolioToken }) {
  return (
    <tr className="border-b border-[#2a2a3a]/50 hover:bg-[#111118] transition-colors">
      <td className="py-3 px-3">
        <p className="font-semibold text-sm">{t.ticker || t.identifier.split('-')[0]}</p>
        <p className="text-xs text-gray-500 truncate max-w-[180px]">{t.name}</p>
        <p className="text-[10px] mono text-gray-600">{t.identifier}</p>
      </td>
      <td className="py-3 px-3 text-right mono text-sm">{fmtBalance(t.balance)}</td>
      <td className="py-3 px-3 text-right text-sm">
        {t.price > 0 ? `$${t.price.toLocaleString('fr-FR', { maximumFractionDigits: 6 })}` : '—'}
      </td>
      <td className="py-3 px-3 text-right font-bold text-sm">
        {t.valueUsd > 0 ? fmtUsd(t.valueUsd) : '—'}
      </td>
    </tr>
  )
}

function NftRow({ n }: { n: PortfolioNft }) {
  return (
    <tr className="border-b border-[#2a2a3a]/50 hover:bg-[#111118] transition-colors">
      <td className="py-3 px-3">
        <div className="flex items-center gap-3">
          {n.mediaUrl ? (
            <img
              src={n.mediaUrl}
              alt={n.name}
              className="w-10 h-10 rounded-lg object-cover bg-[#111118] flex-shrink-0"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-[#111118] flex items-center justify-center text-lg flex-shrink-0">
              {n.type === 'MetaESDT' ? '💧' : '🖼️'}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-sm">{n.name || n.collection}</p>
            <p className="text-[10px] mono text-gray-600">{n.identifier}</p>
            <p className="text-[10px] text-gray-500">#{n.nonce} · {n.type}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-3 text-right mono text-sm">{fmtBalance(n.balance)}</td>
      <td className="py-3 px-3 text-right text-sm">
        {n.price > 0 ? `$${n.price.toLocaleString('fr-FR', { maximumFractionDigits: 6 })}` : '—'}
      </td>
      <td className="py-3 px-3 text-right font-bold text-sm text-purple-400">
        {n.valueUsd > 0 ? fmtUsd(n.valueUsd) : '—'}
      </td>
    </tr>
  )
}

export default function Portfolio() {
  const {
    egldBalance, egldPrice, egldValueUsd,
    tokens, nfts, totalUsd, tokensValueUsd, nftsValueUsd,
    loading, error, refresh,
  } = usePortfolioValue()

  const millionPct = totalUsd / GOAL_USD * 100
  // Log progression anchored on the $3 starting point.
  const logPct = totalUsd > START_USD
    ? Math.log(totalUsd / START_USD) / Math.log(GOAL_USD / START_USD) * 100
    : 0

  // Breakdown rows (EGLD + tokens + NFTs)
  const breakdown = [
    { label: 'EGLD (liquid)', value: egldValueUsd, color: 'text-blue-400', icon: '🔷' },
    { label: 'ESDT Tokens', value: tokensValueUsd, color: 'text-green-400', icon: '🪙' },
    { label: 'NFTs / MetaESDT', value: nftsValueUsd, color: 'text-purple-400', icon: '🖼️' },
  ]

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-black">📈 Portfolio & Profits</h1>
          <p className="text-gray-500 mt-1">Compounding ${START_USD} → $1,000,000 via DeFi MultiversX</p>
        </div>
        <button onClick={refresh} className="btn-secondary text-sm self-start sm:self-auto">🔄 Actualiser</button>
      </div>

      {error && (
        <div className="card mb-6 border-red-500/30 text-red-400 text-sm">
          ⚠️ Erreur de chargement: {error}
        </div>
      )}

      {/* Total + progression */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Valeur totale du Portfolio</p>
            {loading ? (
              <div className="h-10 w-48 rounded-lg bg-[#16161f] animate-pulse mt-1" />
            ) : (
              <p className="text-4xl font-black gradient-text">{fmtUsd(totalUsd)}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              EGLD @ ${egldPrice.toFixed(4)} · {tokens.length} tokens · {nfts.length} NFT/MetaESDT
            </p>
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
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Départ: ${START_USD}</span>
          <span>Progression logarithmique: {logPct.toFixed(2)}%</span>
        </div>
      </div>

      {/* Breakdown by asset */}
      <div className="card mb-6">
        <h2 className="text-lg font-bold mb-4">📊 Répartition par actif</h2>
        <div className="space-y-3">
          {breakdown.map(b => {
            const pct = totalUsd > 0 ? (b.value / totalUsd) * 100 : 0
            return (
              <div key={b.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-semibold">{b.icon} {b.label}</span>
                  <span className={`font-bold ${b.color}`}>{fmtUsd(b.value)} <span className="text-gray-500 font-normal">({pct.toFixed(1)}%)</span></span>
                </div>
                <div className="h-2 rounded-full bg-[#0a0a0f] overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-500" style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">EGLD</p>
          <p className="text-xl font-bold">{egldBalance.toFixed(6)}</p>
          <p className="text-xs text-gray-500">{fmtUsd(egldValueUsd)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Prix EGLD</p>
          <p className="text-xl font-bold text-blue-400">${egldPrice.toFixed(4)}</p>
          <p className="text-xs text-gray-500">MEX EGLD/USDC</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Tokens ESDT</p>
          <p className="text-xl font-bold">{tokens.length}</p>
          <p className="text-xs text-gray-500">{fmtUsd(tokensValueUsd)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">NFTs / MetaESDT</p>
          <p className="text-xl font-bold">{nfts.length}</p>
          <p className="text-xs text-gray-500">{fmtUsd(nftsValueUsd)}</p>
        </div>
      </div>

      {/* Tokens breakdown */}
      <div className="card mb-6">
        <h2 className="text-lg font-bold mb-4">🪙 Tokens ESDT ({tokens.length})</h2>
        {loading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-[#111118] animate-pulse" />)}</div>
        ) : tokens.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b border-[#2a2a3a]">
                  <th className="text-left py-2 px-3">Token</th>
                  <th className="text-right py-2 px-3">Balance</th>
                  <th className="text-right py-2 px-3">Prix</th>
                  <th className="text-right py-2 px-3">Valeur USD</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map(t => <TokenRow key={t.identifier} t={t} />)}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#2a2a3a]">
                  <td colSpan={3} className="py-3 px-3 text-sm text-gray-400 font-semibold">Total tokens</td>
                  <td className="py-3 px-3 text-right font-black text-white">{fmtUsd(tokensValueUsd)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">Aucun token ESDT détecté</p>
        )}
      </div>

      {/* NFTs breakdown */}
      <div className="card mb-8">
        <h2 className="text-lg font-bold mb-4">🖼️ NFTs & MetaESDT ({nfts.length})</h2>
        {loading ? (
          <div className="space-y-2">{[...Array(2)].map((_, i) => <div key={i} className="h-14 rounded-lg bg-[#111118] animate-pulse" />)}</div>
        ) : nfts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b border-[#2a2a3a]">
                  <th className="text-left py-2 px-3">NFT</th>
                  <th className="text-right py-2 px-3">Balance</th>
                  <th className="text-right py-2 px-3">Prix</th>
                  <th className="text-right py-2 px-3">Valeur USD</th>
                </tr>
              </thead>
              <tbody>
                {nfts.map(n => <NftRow key={n.identifier} n={n} />)}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#2a2a3a]">
                  <td colSpan={3} className="py-3 px-3 text-sm text-gray-400 font-semibold">Total NFTs</td>
                  <td className="py-3 px-3 text-right font-black text-purple-400">{fmtUsd(nftsValueUsd)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">Aucun NFT / MetaESDT détecté</p>
        )}
      </div>

      {/* Jalons */}
      <div className="card mb-8">
        <h2 className="text-lg font-bold mb-4">🏆 Jalons ${START_USD} → $1M</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {MILESTONES.map(m => {
            const reached = totalUsd >= m.threshold
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
            { label: '7 jours', value: totalUsd * Math.pow(1.01, 35) },
            { label: '30 jours', value: totalUsd * Math.pow(1.01, 150) },
            { label: '1 an', value: totalUsd * Math.pow(1.01, 1825) },
          ].map(p => (
            <div key={p.label} className="p-4 rounded-xl bg-[#111118] border border-[#2a2a3a]">
              <p className="text-xs text-gray-500 mb-1">{p.label}</p>
              <p className="text-xl font-bold text-purple-400">{fmtUsd(p.value)}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-3">
          Données live: <a className="text-purple-400 hover:underline" href={`https://explorer.multiversx.com/accounts/${WALLET}`} target="_blank" rel="noreferrer">explorer wallet LIA</a>
        </p>
      </div>
    </div>
  )
}
