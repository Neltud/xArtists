import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMultiversX } from '../hooks/useMultiversX'
import MoonpayButton from '../components/MoonpayButton'
import TreasuryBanner from '../components/TreasuryBanner'
import TipEgldTransfer from '../components/TipEgldTransfer'
import TxCapabilityBanner from '../components/TxCapabilityBanner'
import PageGuide from '../components/PageGuide'
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
    <div className="animate-fade-in max-w-2xl mx-auto space-y-6 pb-10">
      <PageGuide page="tip" />

      <header className="space-y-2">
        <p className="section-label">Soutenir · LIA ops</p>
        <h1 className="section-title display">Tip & services</h1>
        <div className="atelier-title-rule" aria-hidden />
        <p className="section-lead">
          Dons volontaires vers la treasury protocole —{' '}
          <strong className="text-zinc-300">pas un investissement</strong>, pas une part de fonds.{' '}
          <Link to="/editions" className="text-violet-300 underline-offset-2 hover:underline">
            xArtists Editions
          </Link>
        </p>
      </header>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-100/90 leading-relaxed">
        Les adresses ci-dessous sont <strong>LIA Ops / protocole</strong> (pas ton wallet Connect).
        Split indicatif tips : Mission / Reserve / Ops — voir{' '}
        <a href={LINKS.treasuryPolicy} target="_blank" rel="noreferrer" className="underline">
          TREASURY_POLICY
        </a>
        .
      </div>

      <TxCapabilityBanner />
      <TreasuryBanner />
      <TipEgldTransfer />

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-sm font-semibold text-white mb-3">MultiversX (EGLD)</h2>
          <div className="bg-black/40 rounded-xl p-3 mono text-xs text-zinc-300 break-all mb-3">
            {WALLET}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => copy(WALLET, 'egld')} className="btn-secondary flex-1 text-sm">
              {copied === 'egld' ? 'Copié' : 'Copier'}
            </button>
            <a
              href={LINKS.explorerAccount(WALLET)}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-sm px-4"
            >
              Explorer
            </a>
          </div>
        </div>

        <div className="card">
          <h2 className="text-sm font-semibold text-white mb-3">Bitcoin</h2>
          <div className="bg-black/40 rounded-xl p-3 mono text-xs text-zinc-300 break-all mb-3">
            {BTC_ADDR}
          </div>
          <button type="button" onClick={() => copy(BTC_ADDR, 'btc')} className="btn-secondary w-full text-sm">
            {copied === 'btc' ? 'Copié' : 'Copier BTC'}
          </button>
        </div>

        <div className="card md:col-span-2">
          <h2 className="text-sm font-semibold text-white mb-3">Solana</h2>
          <div className="bg-black/40 rounded-xl p-3 mono text-xs text-zinc-300 break-all mb-3">
            {SOL_ADDR}
          </div>
          <button type="button" onClick={() => copy(SOL_ADDR, 'sol')} className="btn-secondary text-sm">
            {copied === 'sol' ? 'Copié' : 'Copier SOL'}
          </button>
        </div>
      </div>

      <div className="card border-emerald-500/20 bg-emerald-500/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-white mb-1">Acheter EGLD (fiat)</h2>
            <p className="text-sm text-zinc-400">MoonPay → <strong>ton</strong> wallet (pas LIA ops).</p>
          </div>
          <MoonpayButton currencyCode="EGLD" label="Acheter EGLD" />
        </div>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-white mb-2">Services LIA — barème indicatif</h2>
        <p className="text-xs text-zinc-500 mb-4">
          Paiement manuel vers l’adresse EGLD avec memo service id. Pas de prestation automatisée
          on-chain pour l’instant.
        </p>
        <div className="space-y-2">
          {SERVICES.map(s => (
            <div
              key={s.id}
              className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/[0.06]"
            >
              <div>
                <p className="font-semibold text-sm text-white">{s.name}</p>
                <p className="text-xs text-zinc-500">
                  {s.desc} · memo <code className="text-[10px] text-zinc-400">{s.id}</code>
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-amber-300 tabular-nums">{s.price_egld} EGLD</p>
                <p className="text-xs text-zinc-500">${(s.price_egld * prices.egld).toFixed(4)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
