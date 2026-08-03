import { useState } from 'react'
import { useWalletTokens, type WalletToken } from '../hooks/useWalletTokens'
import { useWallet } from '../context/WalletContext'
import { LIA_WALLET } from '../config/links'
import MoonpayButton from '../components/MoonpayButton'

type Tab = 'all' | 'esdt' | 'hatom' | 'lp'
type Scope = 'user' | 'lia'

function fmtBalance(n: number) {
  if (n === 0) return '0'
  if (n < 0.0001) return n.toExponential(2)
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 6 })
}

function TokenRow({ t }: { t: WalletToken }) {
  return (
    <tr className="border-b border-[#2a2a3a]/50 hover:bg-[#111118]">
      <td className="py-3 px-3">
        <p className="font-semibold text-sm">{t.ticker || t.identifier?.split('-')[0]}</p>
        <p className="text-xs text-gray-500 truncate max-w-[180px]">{t.name}</p>
      </td>
      <td className="py-3 px-3 text-right mono text-sm">{fmtBalance(t.balance)}</td>
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
  const { connected, address } = useWallet()
  const [scope, setScope] = useState<Scope>(connected ? 'user' : 'lia')

  const scanAddress =
    scope === 'user' && connected && address ? address : LIA_WALLET

  const {
    isLia,
    egldBalance,
    egldValueUsd,
    tokens,
    hatomTokens,
    lpTokens,
    farmTokens,
    standardTokens,
    hatomPosition,
    totalEsdtUsd,
    loading,
    error,
    refresh,
  } = useWalletTokens(scanAddress)

  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')

  const hf = hatomPosition?.healthFactor ?? 999
  const hfColor = hf > 2 ? 'text-green-400' : hf > 1.5 ? 'text-orange-400' : 'text-red-400'

  const tabList =
    tab === 'all'
      ? tokens
      : tab === 'esdt'
        ? standardTokens
        : tab === 'hatom'
          ? hatomTokens
          : [...lpTokens, ...farmTokens]

  const q = search.toLowerCase().trim()
  const allDisplayed = q
    ? tabList.filter(
        t =>
          t.ticker.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.identifier.toLowerCase().includes(q)
      )
    : tabList

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black">👛 Wallet</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {isLia
              ? 'Trésorerie protocole LIA (ops) — pas ton wallet personnel'
              : 'Ton wallet connecté — soldes personnels'}
          </p>
        </div>
        <button type="button" onClick={refresh} className="btn-secondary text-sm">
          🔄 Actualiser
        </button>
      </div>

      {/* Scope toggle */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => setScope('user')}
          disabled={!connected}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border ${
            scope === 'user' && connected
              ? 'bg-green-600/20 border-green-500/40 text-green-300'
              : 'border-[#2a2a3a] text-gray-500'
          }`}
        >
          Mon wallet {connected ? '' : '(Connect requis)'}
        </button>
        <button
          type="button"
          onClick={() => setScope('lia')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border ${
            scope === 'lia' || !connected
              ? 'bg-purple-600/20 border-purple-500/40 text-purple-300'
              : 'border-[#2a2a3a] text-gray-500'
          }`}
        >
          Wallet LIA (ops)
        </button>
      </div>

      <div
        className={`card mb-6 ${
          isLia ? 'border-purple-500/30 bg-purple-500/5' : 'border-green-500/30 bg-green-500/5'
        }`}
      >
        <p className="text-xs uppercase tracking-widest mb-2 text-gray-500">
          {isLia ? 'Adresse protocole LIA' : 'Adresse utilisateur connectée'}
        </p>
        <p className="mono text-sm text-gray-300 break-all">{scanAddress}</p>
        <div className="flex gap-2 mt-3 flex-wrap">
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(scanAddress)}
            className="btn-secondary text-sm"
          >
            📋 Copier
          </button>
          <a
            href={`https://explorer.multiversx.com/accounts/${scanAddress}`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary text-sm"
          >
            🔗 Explorer
          </a>
        </div>
      </div>

      {isLia && (
        <div className="card mb-6 border-emerald-500/20 bg-emerald-500/5">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-1">
            💳 MoonPay → wallet LIA
          </p>
          <p className="text-sm text-gray-400 mb-2">
            Recharge la trésorerie <strong>protocole</strong>, pas ton compte personnel.
          </p>
          <MoonpayButton walletAddress={LIA_WALLET} currencyCode="EGLD" />
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-xs text-gray-500 uppercase mb-1">EGLD</p>
          <p className="text-xl font-bold">{egldBalance.toFixed(6)}</p>
          <p className="text-xs text-gray-500">${egldValueUsd.toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase mb-1">Tokens</p>
          <p className="text-xl font-bold">{tokens.length}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase mb-1">Total ≈</p>
          <p className="text-xl font-bold">${totalEsdtUsd.toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase mb-1">Hatom HF</p>
          <p className={`text-xl font-bold ${hfColor}`}>{hf >= 999 ? 'N/A' : hf.toFixed(2)}</p>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-2 mb-4">
          {(
            [
              ['all', 'Tous', tokens.length],
              ['esdt', 'ESDT', standardTokens.length],
              ['hatom', 'Hatom', hatomTokens.length],
              ['lp', 'LP/Farm', lpTokens.length + farmTokens.length],
            ] as const
          ).map(([key, label, count]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                tab === key ? 'bg-purple-600/20 text-purple-400' : 'btn-secondary'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Rechercher…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full mb-4 px-4 py-2 rounded-lg bg-[#111118] border border-[#2a2a3a] text-sm"
        />
        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
        {loading ? (
          <div className="h-24 animate-pulse bg-[#111118] rounded-lg" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b border-[#2a2a3a]">
                  <th className="text-left py-2 px-3">Token</th>
                  <th className="text-right py-2 px-3">Balance</th>
                  <th className="text-right py-2 px-3">Prix</th>
                  <th className="text-right py-2 px-3">USD</th>
                </tr>
              </thead>
              <tbody>
                {allDisplayed.map(t => (
                  <TokenRow key={t.identifier} t={t} />
                ))}
              </tbody>
            </table>
            {!allDisplayed.length && <p className="text-center text-gray-500 py-8">Aucun token</p>}
          </div>
        )}
      </div>
    </div>
  )
}
