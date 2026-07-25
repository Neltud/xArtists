import { useState } from 'react'
import { useMultiversX } from '../hooks/useMultiversX'

const WALLET = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'
const BTC_ADDR = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'

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
        <p className="text-gray-500 mt-1">Nelson Tuduri — @tudurioriginal | Artiste & Développeur LIA v6</p>
      </div>

      {/* QR Codes */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* EGLD */}
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
          <div className="bg-[#111118] rounded-lg p-3 mono text-xs text-gray-300 break-all mb-3">
            {WALLET}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => copy(WALLET, 'egld')}
              className="btn-secondary flex-1 text-sm"
            >
              {copied === 'egld' ? '✅ Copié!' : '📋 Copier'}
            </button>
            <a
              href={`https://explorer.multiversx.com/accounts/${WALLET}`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-sm px-4"
            >
              🔗
            </a>
          </div>
        </div>

        {/* BTC */}
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
          <div className="bg-[#111118] rounded-lg p-3 mono text-xs text-gray-300 break-all mb-3">
            {BTC_ADDR}
          </div>
          <button
            onClick={() => copy(BTC_ADDR, 'btc')}
            className="btn-secondary w-full text-sm"
          >
            {copied === 'btc' ? '✅ Copié!' : '📋 Copier l’adresse BTC'}
          </button>
        </div>
      </div>

      {/* GoFundMe */}
      <div className="card mb-8">
        <div className="flex items-start gap-4">
          <span className="text-4xl">🏗️</span>
          <div className="flex-1">
            <h2 className="text-lg font-bold">GoFundMe — Galerie xArtists 2026</h2>
            <p className="text-sm text-gray-400 mt-1 mb-4">
              Ouvrir une galerie physique à Saint-Maur-des-Fossés pour exposer l’art physique tokenisé via $TRO.
            </p>
            <div className="progress-bar mb-2">
              <div className="progress-fill" style={{ width: '0%' }} />
            </div>
            <p className="text-xs text-gray-500 mb-4">$0 / $10,000 collectés</p>
            <a
              href="https://www.gofundme.com/f/xartists-lia-v6"
              target="_blank"
              rel="noreferrer"
              className="btn-primary inline-block text-sm px-6 py-2.5"
            >
              💚 Soutenir sur GoFundMe
            </a>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="card">
        <h2 className="text-lg font-bold mb-4">⚡ Services LIA — Micropaiements EGLD</h2>
        <div className="space-y-2 mb-6">
          {SERVICES.map(s => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-[#111118] border border-[#2a2a3a]">
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
          <p className="font-semibold text-white mb-2">💡 Comment payer :</p>
          <p>Envoyer EGLD à l’adresse ci-dessus.</p>
          <p className="mt-1">Data field : <code className="bg-[#0a0a0f] px-2 py-0.5 rounded mono text-xs">service_id:VOTRE_CHAT_ID_TELEGRAM</code></p>
          <p className="mt-1 text-xs">Exemple : <code className="bg-[#0a0a0f] px-2 py-0.5 rounded mono">signal_basic:1642853719</code></p>
        </div>
      </div>
    </div>
  )
}
