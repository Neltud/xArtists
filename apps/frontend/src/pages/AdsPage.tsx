import { useState } from 'react'
import { LIA_WALLET } from '../config/links'

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

  const memo = `ad-bid:${slot}:${period}`

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-bold gradient-text">Espace pub · enchères</h1>
        <p className="text-sm text-gray-400 mt-2 leading-relaxed">
          Emplacements premium limités (3–5). Location d’espace pour drops et events culturels —{' '}
          <strong className="text-gray-300">pas un investissement</strong>. Revenus → treasury Mission /
          Reserve (traçable).
        </p>
      </header>

      <section className="card space-y-3">
        <h2 className="font-semibold">Slots</h2>
        <ul className="text-sm text-gray-400 space-y-2">
          {SLOTS.map((s) => (
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
          1) Prépare ton créatif (IPFS) · 2) Envoie EGLD vers treasury avec le memo · 3) Ops valide →
          diffusion. SC enchères = V2.
        </p>
        <label className="block text-xs text-gray-500">
          Slot
          <select
            className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] p-2 text-sm"
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
          >
            {SLOTS.map((s) => (
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
            onChange={(e) => setPeriod(e.target.value)}
          />
        </label>
        <label className="block text-xs text-gray-500">
          Titre
          <input
            className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] p-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Drop Alistor — mars"
          />
        </label>
        <label className="block text-xs text-gray-500">
          Lien https
          <input
            className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] p-2 text-sm"
            value={href}
            onChange={(e) => setHref(e.target.value)}
            placeholder="https://…"
          />
        </label>
        <label className="block text-xs text-gray-500">
          Image CID IPFS (optionnel)
          <input
            className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] p-2 text-sm mono"
            value={cid}
            onChange={(e) => setCid(e.target.value)}
            placeholder="Qm…"
          />
        </label>
        <label className="block text-xs text-gray-500">
          Offre EGLD (min indicatif 0.5)
          <input
            className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] p-2 text-sm"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>

        <div className="rounded-lg bg-[#0d0d14] border border-purple-500/30 p-3 text-xs space-y-2">
          <p>
            <span className="text-gray-500">Treasury Mission</span>
            <br />
            <span className="mono text-purple-300 break-all">{LIA_WALLET}</span>
          </p>
          <p>
            <span className="text-gray-500">Memo obligatoire</span>
            <br />
            <span className="mono text-emerald-400">{memo}</span>
          </p>
          <p className="text-gray-500">
            Catégories autorisées : art, drop, event culturel, outil créatif. Interdit d’imiter Connect /
            Buy.
          </p>
        </div>
      </section>

      <p className="text-xs text-gray-600 text-center">
        Après paiement, contacte ops avec txHash + créatif pour modération.
      </p>
    </div>
  )
}
