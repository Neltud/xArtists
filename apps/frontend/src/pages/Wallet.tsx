import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWalletTokens, type WalletToken } from '../hooks/useWalletTokens'
import { useUserAccount } from '../hooks/useUserAccount'
import { useWallet } from '../context/WalletContext'
import MoonpayButton from '../components/MoonpayButton'
import PageGuide from '../components/PageGuide'
import InfoTip from '../components/InfoTip'
import LiaVsUserBanner from '../components/LiaVsUserBanner'
import TxCapabilityBanner from '../components/TxCapabilityBanner'
import { requestOpenConnect } from '../lib/walletEvents'
import { LINKS } from '../config/links'

type Tab = 'all' | 'esdt' | 'hatom' | 'lp' | 'nfts'

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

/** USER wallet only — no LIA ops duplication. */
export default function Wallet() {
  const { connected, address, method, canAttemptSign, shortAddress } = useWallet()

  const {
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
  } = useWalletTokens(connected && address ? address : null)

  const account = useUserAccount(connected && address ? address : null)

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
          : tab === 'lp'
            ? [...lpTokens, ...farmTokens]
            : []

  const q = search.toLowerCase().trim()
  const allDisplayed = q
    ? tabList.filter(
        t =>
          t.ticker.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.identifier.toLowerCase().includes(q)
      )
    : tabList

  const refreshAll = () => {
    refresh()
    account.refresh()
  }

  return (
    <div className="animate-fade-in">
      <PageGuide page="wallet" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black">👛 Mon wallet</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Soldes <strong className="text-green-300">utilisateur</strong> (Connect).{' '}
            <InfoTip k="liaVsUser" />
          </p>
        </div>
        {connected && (
          <button type="button" onClick={refreshAll} className="btn-secondary text-sm">
            🔄 Actualiser
          </button>
        )}
      </div>

      <LiaVsUserBanner tone="user" />
      <TxCapabilityBanner />

      {!connected || !address ? (
        <div className="card border-amber-500/30 bg-amber-500/5 text-center py-12">
          <p className="text-lg font-semibold mb-2">Connecte ton wallet</p>
          <p className="text-sm text-gray-400 mb-4 max-w-md mx-auto">
            Web Wallet, extension DeFi ou xPortal — <strong>jamais</strong> le wallet protocole LIA.
            Coller erd1 = lecture seule (soldes OK, pas de List/Buy).
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={requestOpenConnect} className="btn-primary text-sm">
              🔗 Connecter
            </button>
            <Link to="/portfolio" className="btn-secondary text-sm">
              Portfolio LIA (protocole) →
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="card mb-6 border-green-500/30 bg-green-500/5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-widest mb-1 text-gray-500">
                  Adresse connectée · {shortAddress}
                </p>
                <p className="mono text-sm text-gray-300 break-all">{address}</p>
                <p className="text-[11px] text-gray-500 mt-1">
                  Méthode:{' '}
                  <span className={method === 'paste_readonly' ? 'text-amber-300' : 'text-green-300'}>
                    {method || '—'}
                  </span>
                  {canAttemptSign ? ' · signature possible si TxShell' : ' · pas de signature'}
                  {account.shard != null && ` · shard ${account.shard}`}
                  {account.nonce != null && ` · nonce ${account.nonce}`}
                </p>
              </div>
              {account.loading && (
                <span className="text-[10px] text-gray-500">API MultiversX…</span>
              )}
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(address)}
                className="btn-secondary text-sm"
              >
                📋 Copier
              </button>
              <a
                href={LINKS.explorerAccount(address)}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-sm"
              >
                🔗 Explorer
              </a>
              <MoonpayButton currencyCode="EGLD" label="Acheter EGLD" className="text-sm" />
              <Link to="/marketplace" className="btn-secondary text-sm">
                Market →
              </Link>
            </div>
            {account.error && (
              <p className="text-xs text-amber-400 mt-2">Compte API: {account.error}</p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="card">
              <p className="text-xs text-gray-500 uppercase mb-1">EGLD (API)</p>
              <p className="text-xl font-bold">{account.balanceEgld.toFixed(6)}</p>
              <p className="text-[10px] text-gray-500">tokens hook: {egldBalance.toFixed(4)}</p>
              <p className="text-xs text-gray-500">${egldValueUsd.toFixed(2)}</p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500 uppercase mb-1">Tokens</p>
              <p className="text-xl font-bold">{tokens.length}</p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500 uppercase mb-1">NFTs</p>
              <p className="text-xl font-bold">{account.nftCount}</p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500 uppercase mb-1">Total ESDT ≈</p>
              <p className="text-xl font-bold">${totalEsdtUsd.toFixed(2)}</p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500 uppercase mb-1 flex items-center gap-1">
                Hatom HF <InfoTip k="scStatus" />
              </p>
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
                  ['nfts', 'NFTs', account.nftCount],
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

            {tab === 'nfts' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {account.nfts.length === 0 && !account.loading && (
                  <p className="col-span-full text-center text-gray-500 py-8">Aucun NFT sur ce wallet</p>
                )}
                {account.nfts.map(n => {
                  const img = n.media?.[0]?.url || n.url
                  return (
                    <a
                      key={n.identifier}
                      href={LINKS.explorerNft(n.identifier)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-[#2a2a3a] overflow-hidden hover:border-purple-500/50 transition-colors"
                    >
                      <div className="aspect-square bg-[#0a0a0f]">
                        {img ? (
                          <img src={img} alt={n.name} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-3xl">🎨</div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-semibold truncate">{n.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{n.collection}</p>
                      </div>
                    </a>
                  )
                })}
              </div>
            ) : (
              <>
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
                    {!allDisplayed.length && (
                      <p className="text-center text-gray-500 py-8">Aucun token</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
