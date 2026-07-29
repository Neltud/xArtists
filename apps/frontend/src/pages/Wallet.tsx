import { useState } from 'react'
import { useWalletTokens, type WalletToken } from '../hooks/useWalletTokens'
import { useMultiversX } from '../hooks/useMultiversX'
import MoonpayButton from '../components/MoonpayButton'

const WALLET = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'

type Tab = 'all' | 'esdt' | 'hatom' | 'lp'

function fmtBalance(n: number) {
  if (n === 0) return '0'
  if (n < 0.0001) return n.toExponential(2)
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 6 })
}

function TokenRow({ t }: { t: WalletToken }) {
  return (
    <tr className="border-b border-[#2a2a3a]/50 hover:bg-[#111118] transition-colors">
      <td className="py-3 px-3">
        <p className="font-semibold text-sm">{t.ticker || t.identifier?.split('-')[0]}</p>
        <p className="text-xs text-gray-500 truncate max-w-[180px]">{t.name}</p>
        <p className="text-[10px] mono text-gray-600">{t.identifier}</p>
      </td>
      <td className="py-3 px-3 text-right mono text-sm">
        {fmtBalance(t.balance)}
      </td>
      <td className="py-3 px-3 text-right text-sm">
        {t.price > 0 ? `$${t.price.toLocaleString('fr-FR', { maximumFractionDigits: 6 })}` : '—'}
      </td>
      <td className="py-3 px-3 text-right font-bold text-sm">
        {t.valueUsd > 0 ? `$${t.valueUsd.toFixed(2)}` : '—'}
      </td>
    </tr>
  )
}

export default function Wallet() {
  const { liaStatus } = useMultiversX()
  const {
    egldBalance, egldValueUsd,
    tokens, hatomTokens, lpTokens, farmTokens, standardTokens,
    hatomPosition, totalEsdtUsd,
    loading, error, refresh,
  } = useWalletTokens()

  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')

  const hf = hatomPosition?.healthFactor ?? liaStatus?.portfolio?.hatom_health_factor ?? 999
  const hfColor = hf > 2 ? 'text-green-400' : hf > 1.5 ? 'text-orange-400' : 'text-red-400'

  const tabList: WalletToken[] =
    tab === 'all' ? tokens
    : tab === 'esdt' ? standardTokens
    : tab === 'hatom' ? hatomTokens
    : [...lpTokens, ...farmTokens]

  const q = search.toLowerCase().trim()
  const allDisplayed: WalletToken[] = q
    ? tabList.filter(t =>
        t.ticker.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.identifier.toLowerCase().includes(q)
      )
    : tabList

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'all', label: 'Tous', count: tokens.length },
    { key: 'esdt', label: 'ESDT', count: standardTokens.length },
    { key: 'hatom', label: '🏦 Hatom', count: hatomTokens.length },
    { key: 'lp', label: '💧 LP/Farm', count: lpTokens.length + farmTokens.length },
  ]

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black">👛 Wallet MultiversX — LIA</h1>
          <p className="text-gray-500 mt-1">Scan complet de tous les tokens ESDT • Mainnet</p>
        </div>
        <button onClick={refresh} className="btn-secondary text-sm self-start sm:self-auto">🔄 Actualiser</button>
      </div>

      {/* Adresse */}
      <div className="card mb-6">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Adresse Wallet</p>
        <p className="mono text-sm text-gray-300 break-all">{WALLET}</p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => navigator.clipboard.writeText(WALLET)}
            className="btn-secondary text-sm"
          >
            📋 Copier
          </button>
          <a
            href={`https://explorer.multiversx.com/accounts/${WALLET}`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary text-sm"
          >
            🔗 Explorer
          </a>
        </div>
      </div>

      {/* Fiat on-ramp (Moonpay) */}
      <div className="card mb-6 border-emerald-500/20 bg-emerald-500/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-1">💳 Acheter EGLD avec fiat</p>
            <p className="text-sm text-gray-400">
              On-ramp carte bancaire via Moonpay — EGLD envoyé directement au wallet LIA.
            </p>
          </div>
          <MoonpayButton walletAddress={WALLET} currencyCode="EGLD" />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">EGLD</p>
          <p className="text-xl font-bold">{egldBalance.toFixed(6)}</p>
          <p className="text-xs text-gray-500">${egldValueUsd.toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Tokens ESDT</p>
          <p className="text-xl font-bold">{tokens.length}</p>
          <p className="text-xs text-gray-500">dont {hatomTokens.length} Hatom, {lpTokens.length + farmTokens.length} LP/Farm</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Portfolio Total</p>
          <p className="text-xl font-bold">${totalEsdtUsd.toFixed(2)}</p>
          <p className="text-xs text-gray-500">EGLD + tous les ESDT</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Hatom HF</p>
          <p className={`text-xl font-bold ${hfColor}`}>{hf >= 999 ? 'N/A' : hf.toFixed(2)}</p>
          {hatomPosition?.totalSuppliedUsd ? (
            <p className="text-xs text-gray-500">Supplied: ${hatomPosition.totalSuppliedUsd.toFixed(2)}</p>
          ) : null}
        </div>
      </div>

      {/* Hatom summary strip */}
      {(hatomPosition?.totalSuppliedUsd || 0) > 0 && (
        <div className="card mb-6 border-teal-500/20 bg-teal-500/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs text-teal-400 uppercase tracking-widest mb-1">🏦 Résumé Hatom</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <span>Supplied: <strong className="text-green-400">${hatomPosition!.totalSuppliedUsd.toFixed(2)}</strong></span>
                <span>Borrowed: <strong className="text-orange-400">${hatomPosition!.totalBorrowedUsd.toFixed(2)}</strong></span>
                <span>HF: <strong className={hfColor}>{hf >= 999 ? 'N/A' : hf.toFixed(2)}</strong></span>
              </div>
            </div>
            <a href="/hatom" className="btn-secondary text-sm">Voir détails →</a>
          </div>
        </div>
      )}

      {/* LP summary strip */}
      {(lpTokens.length + farmTokens.length) > 0 && (
        <div className="card mb-6 border-purple-500/20 bg-purple-500/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs text-purple-400 uppercase tracking-widest mb-1">💧 Résumé xExchange</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <span>LP tokens: <strong>{lpTokens.length}</strong></span>
                <span>Farm tokens: <strong>{farmTokens.length}</strong></span>
                <span>Valeur: <strong className="text-purple-400">${(lpTokens.concat(farmTokens).reduce((s, t) => s + t.valueUsd, 0)).toFixed(2)}</strong></span>
              </div>
            </div>
            <a href="/lp" className="btn-secondary text-sm">Voir détails →</a>
          </div>
        </div>
      )}

      {/* Token table */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold">🪙 Tous les Tokens</h2>
          <div className="flex gap-2 flex-wrap">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  tab === t.key ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'btn-secondary'
                }`}
              >
                {t.label} {t.count > 0 && <span className="ml-1 text-xs opacity-70">({t.count})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="🔍 Rechercher un token..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full mb-4 px-4 py-2 rounded-lg bg-[#111118] border border-[#2a2a3a] text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-500"
        />

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            ⚠️ Erreur de chargement: {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-[#111118] animate-pulse" />
            ))}
          </div>
        ) : allDisplayed.length > 0 ? (
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
                {allDisplayed.map(t => <TokenRow key={t.identifier} t={t} />)}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#2a2a3a]">
                  <td colSpan={3} className="py-3 px-3 text-sm text-gray-400 font-semibold">
                    {allDisplayed.length} token(s) affiché(s)
                  </td>
                  <td className="py-3 px-3 text-right font-black text-white">
                    ${allDisplayed.reduce((s, t) => s + t.valueUsd, 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">
            {search ? 'Aucun token correspondant à la recherche' : 'Aucun token trouvé'}
          </p>
        )}
      </div>
    </div>
  )
}
