import { useWalletTokens } from '../hooks/useWalletTokens'
import { useMultiversX } from '../hooks/useMultiversX'

const HATOM_DAPP = 'https://app.hatom.com'
const WALLET = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'
const IDENTIFIER_PREVIEW_LENGTH = 20

function HfBadge({ hf }: { hf: number }) {
  if (hf >= 999) return <span className="badge-gray">N/A</span>
  if (hf >= 2) return <span className="badge-green">✅ {hf.toFixed(2)} — Sûr</span>
  if (hf >= 1.5) return <span className="badge-orange">⚠️ {hf.toFixed(2)} — Attention</span>
  return <span className="badge-red">🚨 {hf.toFixed(2)} — Critique</span>
}

export default function HatomPage() {
  const { hatomTokens, hatomPosition, loading, refresh } = useWalletTokens()
  const { liaStatus } = useMultiversX()

  const hf = hatomPosition?.healthFactor ?? liaStatus?.portfolio?.hatom_health_factor ?? 999
  const supplied = hatomPosition?.totalSuppliedUsd ?? 0
  const borrowed = hatomPosition?.totalBorrowedUsd ?? 0
  const net = supplied - borrowed
  const claimHtm = hatomPosition?.claimableHtm ?? 0
  const claimUsd = hatomPosition?.claimableHtmUsd ?? 0
  const markets = hatomPosition?.markets ?? []
  const fromApi = hatomPosition?.source === 'api'

  // Fall back: if no Hatom API position, summarise H-tokens from wallet
  const walletSupplied = hatomTokens.reduce((s, t) => s + t.valueUsd, 0)

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black">🏦 Hatom Protocol</h1>
          <p className="text-gray-500 mt-1">Positions de LIA — lending & borrowing sur MultiversX</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} className="btn-secondary text-sm">🔄 Actualiser</button>
          <a href={HATOM_DAPP} target="_blank" rel="noreferrer" className="btn-primary text-sm">
            🏦 Ouvrir Hatom
          </a>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-[#16161f]" />
          ))}
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="card">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Health Factor</p>
              <div className="mt-1">
                <HfBadge hf={hf} />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {hf >= 999 ? 'Pas de dette active' : hf >= 2 ? 'Liquidation éloignée' : 'Surveiller de près!'}
              </p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Supplied (USD)</p>
              <p className="text-2xl font-black text-green-400">
                ${(supplied || walletSupplied).toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
              </p>
              {!fromApi && walletSupplied > 0 && (
                <p className="text-xs text-gray-500 mt-1">via H-tokens wallet</p>
              )}
            </div>
            <div className="card">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Borrowed (USD)</p>
              <p className={`text-2xl font-black ${borrowed > 0 ? 'text-orange-400' : 'text-gray-500'}`}>
                ${borrowed.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Net Position</p>
              <p className={`text-2xl font-black ${net >= 0 ? 'text-purple-400' : 'text-red-400'}`}>
                ${net.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Rewards */}
          {(claimHtm > 0 || claimUsd > 0) && (
            <div className="card mb-6 border-teal-500/30 bg-teal-500/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-teal-400 uppercase tracking-widest mb-1">🌾 Rewards Claimables</p>
                  <p className="text-2xl font-black">{claimHtm.toFixed(4)} HTM</p>
                  <p className="text-sm text-gray-400">≈ ${claimUsd.toFixed(2)}</p>
                </div>
                <a href={HATOM_DAPP} target="_blank" rel="noreferrer" className="btn-primary text-sm">
                  Claim sur Hatom
                </a>
              </div>
            </div>
          )}

          {/* Per-market breakdown (from API) */}
          {markets.length > 0 && (
            <div className="card mb-6">
              <h2 className="text-lg font-bold mb-4">📊 Détail par Marché</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase border-b border-[#2a2a3a]">
                      <th className="text-left py-2 px-3">Actif</th>
                      <th className="text-right py-2 px-3">Supplied</th>
                      <th className="text-right py-2 px-3">Borrowed</th>
                      <th className="text-right py-2 px-3">Supplied USD</th>
                      <th className="text-right py-2 px-3">Borrowed USD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {markets.map(m => (
                      <tr key={m.identifier} className="border-b border-[#2a2a3a]/50 hover:bg-[#111118]">
                        <td className="py-3 px-3">
                          <p className="font-semibold text-sm">{m.label}</p>
                          {m.identifier && (
                            <p className="text-xs mono text-gray-500">{m.identifier.slice(0, IDENTIFIER_PREVIEW_LENGTH)}...</p>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right mono text-sm text-green-400">
                          {m.supplied > 0 ? m.supplied.toLocaleString('fr-FR', { maximumFractionDigits: 4 }) : '—'}
                        </td>
                        <td className="py-3 px-3 text-right mono text-sm text-orange-400">
                          {m.borrowed > 0 ? m.borrowed.toLocaleString('fr-FR', { maximumFractionDigits: 4 }) : '—'}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-sm">
                          ${m.valueSuppliedUsd.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-sm text-orange-400">
                          {m.valueBorrowedUsd > 0 ? `$${m.valueBorrowedUsd.toFixed(2)}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* H-tokens in wallet (always shown) */}
          {hatomTokens.length > 0 && (
            <div className="card mb-6">
              <h2 className="text-lg font-bold mb-4">🪙 H-Tokens dans le Wallet</h2>
              <p className="text-xs text-gray-500 mb-3">
                Ces tokens représentent votre collateral déposé chez Hatom.
              </p>
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
                    {hatomTokens.map(t => (
                      <tr key={t.identifier} className="border-b border-[#2a2a3a]/50 hover:bg-[#111118]">
                        <td className="py-3 px-3">
                          <p className="font-semibold text-sm">{t.ticker}</p>
                          <p className="text-xs mono text-gray-500">{t.identifier}</p>
                        </td>
                        <td className="py-3 px-3 text-right mono text-sm">
                          {t.balance.toLocaleString('fr-FR', { maximumFractionDigits: 6 })}
                        </td>
                        <td className="py-3 px-3 text-right text-sm">${t.price.toFixed(6)}</td>
                        <td className="py-3 px-3 text-right font-bold text-sm text-green-400">
                          ${t.valueUsd.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-[#2a2a3a]">
                      <td colSpan={3} className="py-3 px-3 text-sm text-gray-400 font-semibold">Total H-tokens</td>
                      <td className="py-3 px-3 text-right font-black text-green-400">
                        ${hatomTokens.reduce((s, t) => s + t.valueUsd, 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* No position */}
          {!hatomPosition && hatomTokens.length === 0 && (
            <div className="card mb-6 text-center py-12">
              <p className="text-4xl mb-3">🏦</p>
              <p className="text-gray-400 font-semibold">Aucune position Hatom détectée</p>
              <p className="text-sm text-gray-500 mt-1">
                LIA n'a pas de collateral déposé ou l'API Hatom est temporairement indisponible.
              </p>
            </div>
          )}

          {/* Info source */}
          <div className="card mb-6">
            <div className="flex items-center gap-3">
              <span className="text-xl">ℹ️</span>
              <div>
                <p className="text-sm font-semibold">Source des données</p>
                <p className="text-xs text-gray-500">
                  {fromApi
                    ? '✅ Données récupérées via l\'API officielle Hatom'
                    : '🔍 Données estimées via les H-tokens détectés dans le wallet (API Hatom indisponible)'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4">🔗 Liens Rapides</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { href: `${HATOM_DAPP}/dashboard`, label: 'Mon Dashboard Hatom', icon: '📊' },
                { href: `${HATOM_DAPP}/market/EGLD`, label: 'Marché EGLD', icon: '💎' },
                { href: `${HATOM_DAPP}/market/USDC`, label: 'Marché USDC', icon: '💵' },
                { href: `https://explorer.multiversx.com/accounts/${WALLET}`, label: 'Explorer Wallet', icon: '🔗' },
                { href: 'https://docs.hatom.com', label: 'Documentation', icon: '📚' },
                { href: `${HATOM_DAPP}/market`, label: 'Tous les marchés', icon: '🏪' },
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