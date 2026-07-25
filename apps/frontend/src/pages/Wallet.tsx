import { useState, useEffect } from 'react'
import { useMultiversX } from '../hooks/useMultiversX'

const MVX_API = 'https://api.multiversx.com'
const WALLET = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'

export default function Wallet() {
  const { prices, liaStatus } = useMultiversX()
  const [tokens, setTokens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${MVX_API}/accounts/${WALLET}/tokens?size=50`)
      .then(r => r.json())
      .then(data => {
        const filtered = data
          .filter((t: any) => {
            const bal = parseFloat(t.balance ?? '0') / Math.pow(10, t.decimals ?? 18)
            return bal > 0
          })
          .map((t: any) => ({
            ...t,
            balanceFormatted: parseFloat(t.balance ?? '0') / Math.pow(10, t.decimals ?? 18),
            valueUsd: (parseFloat(t.balance ?? '0') / Math.pow(10, t.decimals ?? 18)) * (t.price ?? 0),
          }))
          .sort((a: any, b: any) => b.valueUsd - a.valueUsd)
        setTokens(filtered)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const hf = liaStatus?.portfolio?.hatom_health_factor ?? 999
  const hfColor = hf > 2 ? 'text-green-400' : hf > 1.5 ? 'text-orange-400' : 'text-red-400'

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black">👛 Wallet MultiversX</h1>
        <p className="text-gray-500 mt-1">Balances en temps réel — Mainnet</p>
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

      {/* Balances principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">EGLD</p>
          <p className="text-xl font-bold">{(liaStatus?.portfolio?.egld_balance ?? 0).toFixed(6)}</p>
          <p className="text-xs text-gray-500">${((liaStatus?.portfolio?.egld_balance ?? 0) * prices.egld).toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">$TRO</p>
          <p className="text-xl font-bold mono">—</p>
          <p className="text-xs text-gray-500">TRO-94c925</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Portfolio Total</p>
          <p className="text-xl font-bold">${(liaStatus?.portfolio?.total_usd ?? 0).toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Hatom HF</p>
          <p className={`text-xl font-bold ${hfColor}`}>{hf >= 999 ? 'N/A' : hf.toFixed(2)}</p>
        </div>
      </div>

      {/* Tokens */}
      <div className="card">
        <h2 className="text-lg font-bold mb-4">🪙 Tous les Tokens</h2>
        {loading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
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
                {tokens.slice(0, 20).map((t: any) => (
                  <tr key={t.identifier} className="border-b border-[#2a2a3a]/50 hover:bg-[#111118] transition-colors">
                    <td className="py-3 px-3">
                      <p className="font-semibold text-sm">{t.ticker || t.identifier?.split('-')[0]}</p>
                      <p className="text-xs mono text-gray-500">{t.identifier}</p>
                    </td>
                    <td className="py-3 px-3 text-right mono text-sm">{t.balanceFormatted.toFixed(6)}</td>
                    <td className="py-3 px-3 text-right text-sm">${(t.price ?? 0).toFixed(6)}</td>
                    <td className="py-3 px-3 text-right font-bold text-sm">${t.valueUsd.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">Aucun token trouvé</p>
        )}
      </div>
    </div>
  )
}
