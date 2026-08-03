import { useMemo } from 'react'
import { usePortfolioValue, type PortfolioToken, type PortfolioNft } from '../hooks/usePortfolioValue'
import { defaultWinRateScenarios } from '../utils/portfolioScenarios'
import { LINKS } from '../config/links'

const WALLET = LINKS.explorer.includes('multiversx')
  ? 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'
  : 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'

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
  { label: '🎯 x100K — $1M', threshold: 1000000 },
]

function fmtUsd(n: number, max = 2) {
  if (!Number.isFinite(n)) return '—'
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
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
              onError={e => {
                ;(e.currentTarget as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-[#111118] flex items-center justify-center text-lg flex-shrink-0">
              {n.type === 'MetaESDT' ? '💧' : '🖼️'}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-sm">{n.name || n.collection}</p>
            <p className="text-[10px] mono text-gray-600">{n.identifier}</p>
            <p className="text-[10px] text-gray-500">
              #{n.nonce} · {n.type}
            </p>
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
    egldBalance,
    egldPrice,
    egldValueUsd,
    tokens,
    nfts,
    totalUsd,
    tokensValueUsd,
    nftsValueUsd,
    loading,
    error,
    refresh,
  } = usePortfolioValue()

  const base = totalUsd > 0 ? totalUsd : START_USD
  const scenarios = useMemo(() => defaultWinRateScenarios(base), [base])

  const millionPct = (totalUsd / GOAL_USD) * 100
  const logPct =
    totalUsd > START_USD
      ? (Math.log(totalUsd / START_USD) / Math.log(GOAL_USD / START_USD)) * 100
      : 0

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
          <p className="text-gray-500 mt-1">Compounding ${START_USD} → $1,000,000 · scénarios 365j</p>
        </div>
        <button onClick={refresh} className="btn-secondary text-sm self-start sm:self-auto">
          🔄 Actualiser
        </button>
      </div>

      {error && (
        <div className="card mb-6 border-red-500/30 text-red-400 text-sm">⚠️ Erreur: {error}</div>
      )}

      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Valeur totale</p>
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
            <p className="text-xs text-gray-500">{millionPct.toFixed(6)}% atteint</p>
          </div>
        </div>
        <div className="progress-bar mb-2">
          <div className="progress-fill" style={{ width: `${Math.min(logPct, 100)}%` }} />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Départ: ${START_USD}</span>
          <span>Log: {logPct.toFixed(2)}%</span>
        </div>
      </div>

      {/* 365-day win-rate scenarios */}
      <div className="card mb-6 border-teal-500/20">
        <h2 className="text-lg font-bold mb-2">📅 Rendement 365 jours — scénarios de win rate</h2>
        <p className="text-xs text-gray-500 mb-4">
          Hypothèses: <strong>5 trades/jour</strong> · gain <strong>+1%</strong> · perte{' '}
          <strong>−0,8%</strong> · base = valeur portfolio actuelle (ou ${START_USD} si vide).{' '}
          <span className="text-amber-400/90">Illustratif — pas une promesse de performance.</span>
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-[#2a2a3a]">
                <th className="text-left py-2 px-2">Scénario</th>
                <th className="text-right py-2 px-2">Wins / Losses</th>
                <th className="text-right py-2 px-2">Valeur fin an</th>
                <th className="text-right py-2 px-2">Multiple</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map(s => (
                <tr key={s.label} className="border-b border-[#2a2a3a]/40">
                  <td className="py-2.5 px-2 font-semibold text-teal-300">{s.label}</td>
                  <td className="py-2.5 px-2 text-right mono text-xs text-gray-400">
                    {s.wins} / {s.losses}
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold text-purple-300">{fmtUsd(s.endValue)}</td>
                  <td className="py-2.5 px-2 text-right text-gray-300">×{s.multiple.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-gray-600 mt-3">
          Base calcul: {fmtUsd(base)} · 1 825 trades/an · 100% = tous les trades gagnants
        </p>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-bold mb-4">📊 Répartition</h2>
        <div className="space-y-3">
          {breakdown.map(b => {
            const pct = totalUsd > 0 ? (b.value / totalUsd) * 100 : 0
            return (
              <div key={b.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-semibold">
                    {b.icon} {b.label}
                  </span>
                  <span className={`font-bold ${b.color}`}>
                    {fmtUsd(b.value)}{' '}
                    <span className="text-gray-500 font-normal">({pct.toFixed(1)}%)</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#0a0a0f] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-500"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">EGLD</p>
          <p className="text-xl font-bold">{egldBalance.toFixed(6)}</p>
          <p className="text-xs text-gray-500">{fmtUsd(egldValueUsd)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Prix EGLD</p>
          <p className="text-xl font-bold text-blue-400">${egldPrice.toFixed(4)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Tokens</p>
          <p className="text-xl font-bold">{tokens.length}</p>
          <p className="text-xs text-gray-500">{fmtUsd(tokensValueUsd)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">NFTs</p>
          <p className="text-xl font-bold">{nfts.length}</p>
          <p className="text-xs text-gray-500">{fmtUsd(nftsValueUsd)}</p>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-bold mb-4">🪙 Tokens ESDT ({tokens.length})</h2>
        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-[#111118] animate-pulse" />
            ))}
          </div>
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
                {tokens.map(t => (
                  <TokenRow key={t.identifier} t={t} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">Aucun token ESDT</p>
        )}
      </div>

      <div className="card mb-8">
        <h2 className="text-lg font-bold mb-4">🖼️ NFTs & MetaESDT ({nfts.length})</h2>
        {loading ? (
          <div className="h-14 rounded-lg bg-[#111118] animate-pulse" />
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
                {nfts.map(n => (
                  <NftRow key={n.identifier} n={n} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">Aucun NFT</p>
        )}
      </div>

      <div className="card mb-8">
        <h2 className="text-lg font-bold mb-4">🏆 Jalons</h2>
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

      <p className="text-xs text-gray-600">
        Live:{' '}
        <a
          className="text-purple-400 hover:underline"
          href={LINKS.explorerAccount(WALLET)}
          target="_blank"
          rel="noreferrer"
        >
          explorer wallet LIA
        </a>
      </p>
    </div>
  )
}
