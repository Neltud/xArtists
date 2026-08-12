import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMultiversX } from '../hooks/useMultiversX'
import MoonpayButton from '../components/MoonpayButton'
import TreasuryBanner from '../components/TreasuryBanner'
import { LINKS, LIA_WALLET } from '../config/links'
import { LIA_MULTICHAIN } from '../config/multichain'

const WALLET = LIA_WALLET
const BTC_ADDR = LIA_MULTICHAIN.btc.address
const SOL_ADDR = LIA_MULTICHAIN.sol.address

const SERVICES = [
  { id: 'signal_basic', name: 'Signal LIA Basic', price_egld: 0.001, desc: 'Signal marché (lecture)' },
  { id: 'signal_premium', name: 'Signal LIA Premium', price_egld: 0.003, desc: 'Signal prioritaire' },
  { id: 'esdt_scan', name: 'ESDT Scan', price_egld: 0.005, desc: 'Scan tokens + opportunités' },
  { id: 'portfolio_audit', name: 'Audit Portfolio LIA', price_egld: 0.01, desc: 'Rapport book protocole' },
  { id: 'tro_analysis', name: 'Analyse $TRO', price_egld: 0.002, desc: 'Pools + TVL' },
  { id: 'sentiment_report', name: 'Rapport Sentiment', price_egld: 0.002, desc: 'F&G + funding' },
]

export default function Tip() {
  const { prices } = useMultiversX()
  const [copied, setCopied] = useState('')

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(''), 2000)
    })
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black">💜 Soutenir xArtists</h1>
        <p className="text-gray-500 mt-1">
          Dons volontaires vers la treasury protocole —{' '}
          <strong className="text-gray-300">pas un investissement</strong>, pas une part de fonds.{' '}
          <Link to="/editions" className="text-purple-300 underline">
            xArtists Editions
          </Link>
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-100/90 leading-relaxed">
        Les adresses ci-dessous sont <strong>LIA Ops / protocole</strong> (pas ton wallet Connect).
        Split indicatif tips : Mission / Reserve / Ops — voir{' '}
        <a href={LINKS.treasuryPolicy} target="_blank" rel="noreferrer" className="underline">
          TREASURY_POLICY
        </a>
        . Memo recommandé : <code className="text-[10px]">tip:mission</code>
      </div>

      <div className="mb-6">
        <TreasuryBanner />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-lg font-bold mb-4">🔷 MultiversX (EGLD)</h2>
          <div className="bg-[#111118] rounded-lg p-3 mono text-xs text-gray-300 break-all mb-3">
            {WALLET}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => copy(WALLET, 'egld')}
              className="btn-secondary flex-1 text-sm"
            >
              {copied === 'egld' ? '✅ Copié!' : '📋 Copier'}
            </button>
            <a
              href={LINKS.explorerAccount(WALLET)}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-sm px-4"
            >
              🔗
            </a>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-bold mb-4">🟠 Bitcoin</h2>
          <div className="bg-[#111118] rounded-lg p-3 mono text-xs text-gray-300 break-all mb-3">
            {BTC_ADDR}
          </div>
          <button
            type="button"
            onClick={() => copy(BTC_ADDR, 'btc')}
            className="btn-secondary w-full text-sm"
          >
            {copied === 'btc' ? '✅ Copié!' : '📋 Copier BTC'}
          </button>
          <a
            href={LIA_MULTICHAIN.btc.explorer}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-purple-400 mt-2 inline-block"
          >
            mempool ↗
          </a>
        </div>

        <div className="card md:col-span-2">
          <h2 className="text-lg font-bold mb-4">◎ Solana</h2>
          <div className="bg-[#111118] rounded-lg p-3 mono text-xs text-gray-300 break-all mb-3">
            {SOL_ADDR}
          </div>
          <button type="button" onClick={() => copy(SOL_ADDR, 'sol')} className="btn-secondary text-sm">
            {copied === 'sol' ? '✅ Copié!' : '📋 Copier SOL'}
          </button>
          <a
            href={LIA_MULTICHAIN.sol.explorer}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-purple-400 ml-3"
          >
            Solscan ↗
          </a>
        </div>
      </div>

      <div className="card mb-8 border-emerald-500/20 bg-emerald-500/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold mb-1">💳 Acheter EGLD (fiat)</h2>
            <p className="text-sm text-gray-400">MoonPay → <strong>ton</strong> wallet (pas LIA ops).</p>
          </div>
          <MoonpayButton currencyCode="EGLD" label="Acheter EGLD" />
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-bold mb-2">⚡ Services LIA — barème indicatif</h2>
        <p className="text-xs text-zinc-500 mb-4">
          Paiement manuel vers l’adresse EGLD ci-dessus avec memo service id. Pas de prestation
          automatisée on-chain pour l’instant.
        </p>
        <div className="space-y-2 mb-6">
          {SERVICES.map(s => (
            <div
              key={s.id}
              className="flex items-center justify-between p-3 rounded-xl bg-[#111118] border border-[#2a2a3a]"
            >
              <div>
                <p className="font-semibold text-sm">{s.name}</p>
                <p className="text-xs text-gray-500">
                  {s.desc} · memo <code className="text-[10px]">{s.id}</code>
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-yellow-400">{s.price_egld} EGLD</p>
                <p className="text-xs text-gray-500">${(s.price_egld * prices.egld).toFixed(4)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
