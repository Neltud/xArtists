import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
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

/**
 * Barème réaliste (R&D / ops) — paiement manuel memo service id.
 * ~1 EGLD ≈ $4–5 (indicatif). Pas une promesse de rendement.
 */
const SERVICES = [
  {
    id: 'signal_basic',
    name: 'Signal LIA Basic',
    price_egld: 0.05,
    desc: '1 signal marché lecture · 24h',
  },
  {
    id: 'signal_premium',
    name: 'Signal LIA Premium',
    price_egld: 0.2,
    desc: 'Signaux prioritaires · 7 jours',
  },
  {
    id: 'esdt_scan',
    name: 'ESDT Scan',
    price_egld: 0.15,
    desc: 'Scan tokens + opportunités DEX',
  },
  {
    id: 'portfolio_audit',
    name: 'Audit Portfolio LIA',
    price_egld: 0.5,
    desc: 'Rapport book protocole structuré',
  },
  {
    id: 'tro_analysis',
    name: 'Analyse $TRO',
    price_egld: 0.08,
    desc: 'Pools + TVL + flux',
  },
  {
    id: 'sentiment_report',
    name: 'Rapport Sentiment',
    price_egld: 0.1,
    desc: 'F&G + funding + biais macro',
  },
]

export default function Tip() {
  const { prices } = useMultiversX()
  const [copied, setCopied] = useState('')
  const egldUsd = prices?.egldUsd ?? 4.5

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
        <p className="section-label">{xaRender("Tips & services")}</p>
        <h1 className="display text-3xl text-white">{xaRender("Soutenir LIA")}</h1>
        <p className="section-lead text-sm text-zinc-400">
          {xaRender("Paiement manuel vers l’adresse ops avec ")}<strong className="text-zinc-300">{xaRender("memo = service id")}</strong>{xaRender(". Pas de prestation automatisée on-chain pour l’instant. Tips ≠ investissement. ")}</p>
      </header>

      <div className="text-[11px] text-zinc-500 rounded-xl border border-white/10 bg-black/30 p-3">
        {xaRender("Wallet ")}<strong className="text-zinc-400">{xaRender("ops / protocole")}</strong> {xaRender(" (pas ton Connect). Split indicatif : Mission / Reserve / Ops — voir")}{xaRender(' ')}
        <a href={LINKS.treasuryPolicy} target="_blank" rel="noreferrer" className="underline">
          {xaRender("TREASURY_POLICY ")}</a>
        .
      </div>

      <TxCapabilityBanner />
      <TreasuryBanner />
      <TipEgldTransfer />

      <div className="card space-y-3">
        <h2 className="text-sm font-semibold text-white">{xaRender("Services LIA — barème réaliste")}</h2>
        <p className="text-[11px] text-zinc-500">
          {xaRender("Aligné sur le coût R&D / analyse (milliers d’heures). Montants en EGLD mainnet. ")}</p>
        <ul className="space-y-2">
          {xaRender(SERVICES.map(s => (
            <li
              key={s.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5"
            >
              <div>
                <p className="text-[13px] font-medium text-white">{xaRender(s.name)}</p>
                <p className="text-[11px] text-zinc-500">{xaRender(s.desc)}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">{xaRender("memo ")}<code className="text-cyan-400/80">{s.id}</code></p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-amber-300 font-semibold text-sm">{xaRender(s.price_egld)} {xaRender(" EGLD")}</p>
                <p className="text-[10px] text-zinc-500">≈ ${xaRender((s.price_egld * egldUsd).toFixed(2))}</p>
              </div>
            </li>
          )))}
        </ul>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-sm font-semibold text-white mb-3">{xaRender("MultiversX (EGLD)")}</h2>
          <div className="bg-black/40 rounded-xl p-3 mono text-xs text-zinc-300 break-all mb-3">{xaRender(WALLET)}</div>
          <div className="flex gap-2">
            <button type="button" onClick={() => copy(WALLET, 'egld')} className="btn-secondary flex-1 text-sm">
              {xaRender(copied === 'egld' ? 'Copié' : 'Copier')}
            </button>
            <a
              href={LINKS.explorerAccount(WALLET)}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-sm px-4"
            >
              {xaRender("Explorer ")}</a>
          </div>
        </div>
        <div className="card space-y-2">
          <h2 className="text-sm font-semibold text-white">{xaRender("Autres chaînes")}</h2>
          <p className="text-[11px] text-zinc-500 break-all">{xaRender("BTC · ")}{xaRender(BTC_ADDR)}</p>
          <p className="text-[11px] text-zinc-500 break-all">{xaRender("SOL · ")}{xaRender(SOL_ADDR)}</p>
          <MoonpayButton />
        </div>
      </div>

      <p className="text-[11px] text-zinc-600">
        {xaRender("Studio créateur → ")}<Link to="/studio" className="text-cyan-400 hover:underline">{xaRender("#/studio")}</Link>
        {xaRender(' · ')}
        {xaRender("Packs → ")}<Link to="/agents" className="text-cyan-400 hover:underline">{xaRender("#/agents")}</Link>
      </p>
    </div>
  )
}
