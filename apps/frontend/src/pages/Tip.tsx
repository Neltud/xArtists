import { useState } from 'react'
import { useMultiversX } from '../hooks/useMultiversX'
import MoonpayButton from '../components/MoonpayButton'
import { LINKS } from '../config/links'

const WALLET = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'
const BTC_ADDR = 'bc1qglq57zpqjpdqe83dv5lkt4ky39cqmlfsqr8z9s'

const SERVICES = [
  { id: 'signal_basic', name: 'Signal LIA Basic', price_egld: 0.001, desc: 'Signal marché complet' },
  { id: 'signal_premium', name: 'Signal LIA Premium', price_egld: 0.003, desc: 'Signal DCA prioritaire' },
  { id: 'esdt_scan', name: 'ESDT Scan', price_egld: 0.005, desc: 'Scan tokens + opportunités' },
  { id: 'portfolio_audit', name: 'Audit Portfolio', price_egld: 0.01, desc: 'Rapport portfolio complet' },
  { id: 'tro_analysis', name: 'Analyse $TRO', price_egld: 0.002, desc: 'Analyse pools + TVL' },
  { id: 'sentiment_report', name: 'Rapport Sentiment', price_egld: 0.002, desc: 'F&G + whale + funding' },
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
        <p className="text-gray-500 mt-1">Nelson Tuduri — @tudurioriginal | Artiste & LIA v6</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-lg font-bold mb-4">🔷 MultiversX (EGLD / $TRO)</h2>
          <div className="flex justify-center mb-4">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${WALLET}&bgcolor=16161f&color=ffffff`}
              alt="QR EGLD"
              className="rounded-xl border-4 border-[#2a2a3a]"
              width={180}
              height={180}
            />
          </div>
          <div className="bg-[#111118] rounded-lg p-3 mono text-xs text-gray-300 break-all mb-3">{WALLET}</div>
          <div className="flex gap-2">
            <button onClick={() => copy(WALLET, 'egld')} className="btn-secondary flex-1 text-sm">
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
          <h2 className="text-lg font-bold mb-4">🟠 Bitcoin (BTC)</h2>
          <div className="flex justify-center mb-4">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${BTC_ADDR}&bgcolor=16161f&color=f59e0b`}
              alt="QR BTC"
              className="rounded-xl border-4 border-[#2a2a3a]"
              width={180}
              height={180}
            />
          </div>
          <div className="bg-[#111118] rounded-lg p-3 mono text-xs text-gray-300 break-all mb-3">{BTC_ADDR}</div>
          <button onClick={() => copy(BTC_ADDR, 'btc')} className="btn-secondary w-full text-sm">
            {copied === 'btc' ? '✅ Copié!' : '📋 Copier BTC'}
          </button>
        </div>
      </div>

      <div className="card mb-8 border-emerald-500/20 bg-emerald-500/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold mb-1">💳 Acheter de l&apos;EGLD (fiat)</h2>
            <p className="text-sm text-gray-400">MoonPay → wallet MultiversX (carte).</p>
          </div>
          <MoonpayButton walletAddress={WALLET} currencyCode="EGLD" label="Acheter EGLD" />
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-bold mb-4">⚡ Services LIA — micropaiements EGLD</h2>
        <div className="space-y-2 mb-6">
          {SERVICES.map(s => (
            <div
              key={s.id}
              className="flex items-center justify-between p-3 rounded-xl bg-[#111118] border border-[#2a2a3a]"
            >
              <div>
                <p className="font-semibold text-sm">{s.name}</p>
                <p className="text-xs text-gray-500">{s.desc}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-yellow-400">{s.price_egld} EGLD</p>
                <p className="text-xs text-gray-500">${(s.price_egld * prices.egld).toFixed(4)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-[#111118] rounded-xl p-4 text-sm text-gray-400">
          <p className="font-semibold text-white mb-2">Comment payer</p>
          <p>Envoyer EGLD à l&apos;adresse ci-dessus avec data field service_id:CHAT_ID.</p>
        </div>
      </div>
    </div>
  )
}
