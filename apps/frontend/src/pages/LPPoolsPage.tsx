import { useWalletTokens } from '../hooks/useWalletTokens'

const XEXCHANGE_APP = 'https://xexchange.com'
const WALLET = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'

function CategorySection({
  title,
  icon,
  tokens,
  emptyText,
}: {
  title: string
  icon: string
  tokens: Array<{ identifier: string; ticker: string; name: string; balance: number; price: number; valueUsd: number }>
  emptyText: string
}) {
  const total = tokens.reduce((s, t) => s + t.valueUsd, 0)
  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">
          {icon} {title}
        </h2>
        {tokens.length > 0 && (
          <span className="badge-purple">${total.toFixed(2)} USD</span>
        )}
      </div>
      {tokens.length === 0 ? (
        <p className="text-center text-gray-500 py-6">{emptyText}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-[#2a2a3a]">
                <th className="text-left py-2 px-3">Token</th>
                <th className="text-right py-2 px-3">Balance</th>
                <th className="text-right py-2 px-3">Prix</th>
                <th className="text-right py-2 px-3">Valeur USD</th>
                <th className="text-right py-2 px-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map(t => (
                <tr key={t.identifier} className="border-b border-[#2a2a3a]/50 hover:bg-[#111118] transition-colors">
                  <td className="py-3 px-3">
                    <p className="font-semibold text-sm">{t.ticker || t.name}</p>
                    <p className="text-xs mono text-gray-500">{t.identifier}</p>
                  </td>
                  <td className="py-3 px-3 text-right mono text-sm">
                    {t.balance.toLocaleString('fr-FR', { maximumFractionDigits: 6 })}
                  </td>
                  <td className="py-3 px-3 text-right text-sm">
                    {t.price > 0 ? `$${t.price.toFixed(6)}` : '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-sm text-purple-400">
                    {t.valueUsd > 0 ? `$${t.valueUsd.toFixed(2)}` : '—'}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <a
                      href={`${XEXCHANGE_APP}/farms`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      xExchange
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function LPPoolsPage() {
  const { lpTokens, farmTokens, loading, refresh, totalEsdtUsd } = useWalletTokens()

  const totalLp = lpTokens.reduce((s, t) => s + t.valueUsd, 0)
  const totalFarm = farmTokens.reduce((s, t) => s + t.valueUsd, 0)
  const totalDefi = totalLp + totalFarm

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black">💧 xExchange — LP & Farms</h1>
          <p className="text-gray-500 mt-1">Positions de liquidité et farming de LIA sur MultiversX</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} className="btn-secondary text-sm">🔄 Actualiser</button>
          <a href={`${XEXCHANGE_APP}/farms`} target="_blank" rel="noreferrer" className="btn-primary text-sm">
            🔵 Ouvrir xExchange
          </a>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-[#16161f]" />
          ))}
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className="card">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">LP Positions</p>
              <p className="text-2xl font-black">{lpTokens.length}</p>
              <p className="text-sm text-gray-400 mt-1">${totalLp.toFixed(2)} USD</p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Farm Positions</p>
              <p className="text-2xl font-black">{farmTokens.length}</p>
              <p className="text-sm text-gray-400 mt-1">${totalFarm.toFixed(2)} USD</p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Total DeFi</p>
              <p className="text-2xl font-black text-purple-400">${totalDefi.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {totalEsdtUsd > 0 ? `${((totalDefi / totalEsdtUsd) * 100).toFixed(1)}% du portfolio` : ''}
              </p>
            </div>
          </div>

          {/* LP Tokens */}
          <CategorySection
            title="LP Tokens (Liquidité)"
            icon="💧"
            tokens={lpTokens}
            emptyText="Aucun LP token détecté dans le wallet de LIA"
          />

          {/* Farm Tokens */}
          <CategorySection
            title="Farm / Staking Tokens"
            icon="🌾"
            tokens={farmTokens}
            emptyText="Aucun farm token détecté dans le wallet de LIA"
          />

          {/* No positions at all */}
          {lpTokens.length === 0 && farmTokens.length === 0 && (
            <div className="card mb-6 text-center py-12">
              <p className="text-4xl mb-3">💧</p>
              <p className="text-gray-400 font-semibold">Aucune position LP/Farm active</p>
              <p className="text-sm text-gray-500 mt-1">
                LIA n'a pas de positions de liquidité actives détectées sur xExchange.
              </p>
              <a
                href={`${XEXCHANGE_APP}/farms`}
                target="_blank"
                rel="noreferrer"
                className="btn-primary text-sm mt-4 inline-block"
              >
                🔵 Explorer les Farms xExchange
              </a>
            </div>
          )}

          {/* xExchange Quick Links */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4">🔵 xExchange — Liens Utiles</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { href: `${XEXCHANGE_APP}/swap`, label: 'Swap', icon: '🔄' },
                { href: `${XEXCHANGE_APP}/pools`, label: 'Pools', icon: '💧' },
                { href: `${XEXCHANGE_APP}/farms`, label: 'Farms', icon: '🌾' },
                { href: `${XEXCHANGE_APP}/metabonding`, label: 'Metabonding', icon: '🔗' },
                { href: `${XEXCHANGE_APP}/swap/USDC-c76f1f/TRO-94c925`, label: 'Acheter $TRO', icon: '🎨' },
                { href: `https://explorer.multiversx.com/accounts/${WALLET}`, label: 'Explorer Wallet', icon: '🔍' },
              ].map(l => (
                <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="btn-secondary text-sm text-center">
                  {l.icon} {l.label}
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}