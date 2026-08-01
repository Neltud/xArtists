import { useWalletTokens } from '../hooks/useWalletTokens'
import { useMultiversX } from '../hooks/useMultiversX'

const HATOM_DAPP = 'https://app.hatom.com'
const WALLET = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'
const IDENTIFIER_PREVIEW_LENGTH = 20

function HfBadge({ hf, fromApi }: { hf: number; fromApi: boolean }) {
  if (!fromApi || hf >= 999) {
    return <span className="badge-gray">N/A — pas de dette mesurée</span>
  }
  if (hf >= 2) return <span className="badge-green">✅ {hf.toFixed(2)} — Sûr</span>
  if (hf >= 1.5) return <span className="badge-orange">⚠️ {hf.toFixed(2)} — Attention</span>
  return <span className="badge-red">🚨 {hf.toFixed(2)} — Critique</span>
}

export default function HatomPage() {
  const { hatomTokens, hatomPosition, loading, refresh } = useWalletTokens()
  const { liaStatus } = useMultiversX()

  const fromApi = hatomPosition?.source === 'api'
  const hf = fromApi
    ? (hatomPosition?.healthFactor ?? 999)
    : (liaStatus?.portfolio?.hatom_health_factor ?? 999)
  const supplied = hatomPosition?.totalSuppliedUsd ?? 0
  const borrowed = 0
  const net = supplied
  const claimHtm = hatomPosition?.claimableHtm ?? 0
  const claimUsd = hatomPosition?.claimableHtmUsd ?? 0
  const markets = hatomPosition?.markets ?? []

  const walletSupplied = hatomTokens.reduce((s, t) => s + t.valueUsd, 0)
  const displaySupplied = fromApi && supplied > 0 ? supplied : walletSupplied

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black">🏦 Hatom Protocol</h1>
          <p className="text-gray-500 mt-1">Collateral & dette LIA — lending MultiversX</p>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="card">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Health Factor</p>
              <div className="mt-1">
                <HfBadge hf={hf} fromApi={fromApi} />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {!fromApi
                  ? 'API Hatom indisponible — HF non fiable'
                  : hf >= 999
                    ? 'Pas de dette active'
                    : hf >= 2
                      ? 'Liquidation éloignée'
                      : 'Surveiller de près!'}
              </p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Collateral (USD)</p>
              <p className="text-2xl font-black text-green-400">
                ${displaySupplied.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {fromApi && supplied > 0 ? 'API Hatom (supplied)' : 'H-tokens wallet (approx)'}
              </p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Borrowed (USD)</p>
              <p className="text-2xl font-black text-gray-500">$0.00</p>
              <p className="text-xs text-gray-500 mt-1">Borrowing non affiché sur xArtists</p>
            </div>
            <div className="card">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Net Position</p>
              <p className={`text-2xl font-black ${net >= 0 ? 'text-purple-400' : 'text-red-400'}`}>
                {fromApi
                  ? `$${net.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}`
                  : `≈ $${walletSupplied.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}`}
              </p>
            </div>
          </div>

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

          {markets.length > 0 && (
            <div className="card mb-6">
              <h2 className="text-lg font-bold mb-4">📊 Collateral par marché</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase border-b border-[#2a2a3a]">
                      <th className="text-left py-2 px-3">Actif</th>
                      <th className="text-right py-2 px-3">Supplied</th>
                      <th className="text-right py-2 px-3">Supplied USD</th>
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
                        <td className="py-3 px-3 text-right font-bold text-sm">
                         ${m.valueSuppliedUsd.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {hatomTokens.length > 0 && (
            <div className="card mb-6">
              <h2 className="text-lg font-bold mb-4">🪙 H-Tokens (collateral proxy)</h2>
              <p className="text-xs text-gray-500 mb-3">
                Représentent le collateral déposé. Valeurs USD via prix MultiversX API (peuvent différer du dashboard Hatom).
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

          {!hatomPosition && hatomTokens.length === 0 && (
            <div className="card mb-6 text-center py-12">
              <p className="text-4xl mb-3">🏦</p>
              <p className="text-gray-400 font-semibold">Aucune position Hatom détectée</p>
              <p className="text-sm text-gray-500 mt-1">
                Pas de H-tokens wallet et API Hatom sans position.
              </p>
            </div>
          )}

          <div className="card mb-6">
            <div className="flex items-center gap-3">
              <span className="text-xl">ℹ️</span>
              <div>
                <p className="text-sm font-semibold">Source des données</p>
                <p className="text-xs text-gray-500">
                  {fromApi
                    ? '✅ API officielle Hatom — collateral & borrow fiables'
                    : '🔍 Fallback H-tokens wallet uniquement — borrow/HF non disponibles'}
                </p>
              </div>
            </div>
          </div>

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
