import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LIA_WALLET, LINKS } from '../config/links'

const SLOTS = [
  { id: 'home_hero', label: 'Dashboard hero', format: '1200×400 · 7 jours' },
  { id: 'market_sidebar', label: 'Market sidebar', format: '300×250 · 7 jours' },
  { id: 'studio_banner', label: 'Studio banner', format: 'Bandeau · 7 jours' },
  { id: 'drop_feature', label: 'Galerie featured', format: 'Drop · 3–7 jours' },
] as const

export default function AdsPage() {
  const [slot, setSlot] = useState<string>('home_hero')
  const [period, setPeriod] = useState('2026-w33')
  const [title, setTitle] = useState('')
  const [href, setHref] = useState('')
  const [amount, setAmount] = useState('1')
  const [cid, setCid] = useState('')
  const [copied, setCopied] = useState(false)

  const memo = `ad-bid:${slot}:${period}`

  const copyMemo = () => {
    navigator.clipboard.writeText(memo).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <header>
        <h1 className="text-2xl font-bold gradient-text">Espace pub · enchères</h1>
        <p className="text-sm text-gray-400 mt-2 leading-relaxed">
          Emplacements premium limités. Location d’espace pour drops et events culturels —{' '}
          <strong className="text-gray-300">pas un investissement</strong>. Revenus → treasury (traçable).
        </p>
      </header>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-100/90">
        Paiement V1 = transfer EGLD manuel vers <strong>LIA Ops</strong> avec memo. SC enchères = V2. Max
        1 pub active / slot.
      </div>

      <section className="card space-y-3">
        <h2 className="font-semibold">Slots</h2>
        <ul className="text-sm text-gray-400 space-y-2">
          {SLOTS.map(s => (
            <li key={s.id} className="flex justify-between gap-4 border-b border-[#2a2a3a] pb-2">
              <span className="text-gray-200">{s.label}</span>
              <span className="text-xs mono text-gray-500">{s.format}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card space-y-4">
        <h2 className="font-semibold">Bid V1 (paiement manuel)</h2>
        <p className="text-xs text-gray-500">
          1) Créatif IPFS · 2) EGLD + memo · 3) Ops valide → diffusion.
        </p>
        <label className="block text-xs text-gray-500">
          Slot
          <select
            className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] p-2 text-sm"
            value={slot}
            onChange={e => setSlot(e.target.value)}
          >
            {SLOTS.map(s => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-gray-500">
          Période (ex. 2026-w33)
          <input
            className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] p-2 text-sm mono"
            value={period}
            onChange={e => setPeriod(e.target.value)}
          />
        </label>
        <label className="block text-xs text-gray-500">
          Titre
          <input
            className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] p-2 text-sm"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Drop xArtists — mars"
          />
        </label>
        <label className="block text-xs text-gray-500">
          Lien https
          <input
            className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] p-2 text-sm"
            value={href}
            onChange={e => setHref(e.target.value)}
            placeholder="https://…"
          />
        </label>
        <label className="block text-xs text-gray-500">
          Image CID IPFS (optionnel)
          <input
            className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] p-2 text-sm mono"
            value={cid}
            onChange={e => setCid(e.target.value)}
            placeholder="Qm…"
          />
        </label>
        <label className="block text-xs text-gray-500">
          Offre EGLD (min indicatif 0.5)
          <input
            className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] p-2 text-sm"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
        </label>

        <div className="rounded-lg bg-[#0d0d14] border border-purple-500/30 p-3 text-xs space-y-2">
          <p>
            <span className="text-gray-500">Treasury (LIA Ops — Mission en attente d’adresses dédiées)</span>
            <br />
            <span className="mono text-purple-300 break-all">{LIA_WALLET}</span>
          </p>
          <p className="flex flex-wrap items-center gap-2">
            <span className="text-gray-500">Memo obligatoire</span>
            <span className="mono text-emerald-400">{memo}</span>
            <button type="button" onClick={copyMemo} className="btn-secondary text-[10px] px-2 py-1">
              {copied ? '✅' : 'Copier'}
            </button>
          </p>
          <p className="text-gray-500">
            Autorisé : art, drop, event culturel, outil créatif. Interdit d’imiter Connect / Buy.
          </p>
          <a
            href={LINKS.explorerAccount(LIA_WALLET)}
            target="_blank"
            rel="noreferrer"
            className="text-purple-300 underline"
          >
            Explorer treasury ↗
          </a>
        </div>
      </section>

      <p className="text-xs text-gray-600 text-center">
        Après paiement : txHash + créatif → ops ·{' '}
        <Link to="/tip" className="text-purple-400 underline">
          Tip
        </Link>
      </p>
    </div>
  )
}
