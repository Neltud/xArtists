import {localizeChild as xaLocalize, renderChild as xaRender, usePhraseLocale as xaUsePhraseLocale} from '../i18n/phraseRuntime'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LIA_WALLET, LINKS } from '../config/links'
import { dispatch8008 } from '../config/agent8008'

const SLOTS = [
  { id: 'home_hero', label: 'Dashboard hero', format: '1200×400 · 7 jours' },
  { id: 'market_sidebar', label: 'Market sidebar', format: '300×250 · 7 jours' },
  { id: 'studio_banner', label: 'Studio banner', format: 'Bandeau · 7 jours' },
  { id: 'drop_feature', label: 'Galerie featured', format: 'Drop · 3–7 jours' },
] as const

export default function AdsPage() {
  xaUsePhraseLocale()

  const [slot, setSlot] = useState<string>('home_hero')
  const [period, setPeriod] = useState('2026-w39')
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
      dispatch8008('ADS_BID', {
        raw: memo,
        slot,
        period,
        title: title || undefined,
        href: href || undefined,
        amountEgld: amount,
        cid: cid || undefined,
        paper: true,
      })
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <header>
        <h1 className="text-2xl font-bold gradient-text">{xaRender("Espace pub · enchères")}</h1>
        <p className="text-sm text-gray-400 mt-2 leading-relaxed">
          {xaRender("Emplacements premium limités. Location d’espace pour drops et events culturels —")}{xaRender(' ')}
          <strong className="text-gray-300">{xaRender("pas un investissement")}</strong>{xaRender(". Revenus → treasury (traçable). ")}</p>
      </header>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-100/90">
        {xaRender("Paiement V1 = transfer EGLD manuel vers ")}<strong>{xaRender("LIA Ops")}</strong> {xaRender(" avec memo. SC enchères = V2 · créative IPFS après validation. Max 1 pub active / slot. Intent")}{xaRender(' ')}
        <span className="font-mono">{xaRender("ADS_BID")}</span> {xaRender(" → agent 8008 (journal). ")}</div>

      <section className="card space-y-3">
        <h2 className="font-semibold">{xaRender("Slots")}</h2>
        <ul className="text-sm text-gray-400 space-y-2">
          {xaRender(SLOTS.map(s => (
            <li key={s.id} className="flex justify-between gap-4 border-b border-[#2a2a3a] pb-2">
              <button
                type="button"
                onClick={() => setSlot(s.id)}
                className={`text-left ${
                  slot === s.id ? 'text-white font-medium' : 'text-gray-200'
                }`}
              >
                {xaRender(s.label)}
              </button>
              <span className="text-xs mono text-gray-500">{xaRender(s.format)}</span>
            </li>
          )))}
        </ul>
      </section>

      <section className="card space-y-4">
        <h2 className="font-semibold">{xaRender("Bid V1 (paiement manuel)")}</h2>
        <p className="text-xs text-gray-500">
          {xaRender("1) Créatif IPFS · 2) EGLD + memo · 3) Ops valide → diffusion ")}</p>
        <label className="block text-xs text-gray-500">
          {xaRender("Période ")}<input
            className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] px-3 py-2 text-sm text-white mono"
            value={period}
            onChange={e => setPeriod(e.target.value)}
          />
        </label>
        <label className="block text-xs text-gray-500">
          {xaRender("Titre créative ")}<input
            className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] px-3 py-2 text-sm text-white"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={xaLocalize("Votre publicité ici")}
          />
        </label>
        <label className="block text-xs text-gray-500">
          {xaRender("Lien ")}<input
            className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] px-3 py-2 text-sm text-white"
            value={href}
            onChange={e => setHref(e.target.value)}
            placeholder="https://…"
          />
        </label>
        <label className="block text-xs text-gray-500">
          {xaRender("CID IPFS (optionnel) ")}<input
            className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] px-3 py-2 text-sm text-white mono"
            value={cid}
            onChange={e => setCid(e.target.value)}
            placeholder={xaLocalize("bafy…")}
          />
        </label>
        <label className="block text-xs text-gray-500">
          {xaRender("Offre EGLD ")}<input
            className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] px-3 py-2 text-sm text-white"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
        </label>
        <div className="rounded-lg bg-[#111118] border border-[#2a2a3a] p-3 space-y-2 text-xs">
          <p className="flex flex-wrap items-center gap-2">
            <span className="text-gray-500">{xaRender("Memo obligatoire")}</span>
            <span className="mono text-emerald-400">{xaRender(memo)}</span>
            <button type="button" onClick={copyMemo} className="btn-secondary text-[10px] px-2 py-1">
              {xaRender(copied ? '✅ + intent 8008' : 'Copier + intent')}
            </button>
          </p>
          <p className="text-gray-500">
            {xaRender("Autorisé : art, drop, event culturel, outil créatif. Interdit d’imiter Connect / Buy. ")}</p>
          <a
            href={LINKS.explorerAccount(LIA_WALLET)}
            target="_blank"
            rel="noreferrer"
            className="text-purple-300 underline"
          >
            {xaRender("Explorer treasury ↗ ")}</a>
        </div>
      </section>

      <p className="text-xs text-gray-600 text-center">
        {xaRender("Après paiement : txHash + créatif → ops ·")}{xaRender(' ')}
        <Link to="/tip" className="text-purple-400 underline">
          {xaRender("Tip ")}</Link>
        {xaRender(' · ')}
        <Link to="/lia" className="text-purple-400 underline">
          {xaRender("LIA 8008 ")}</Link>
      </p>

      <section className="card space-y-3 border border-cyan-500/20">
        <h2 className="font-semibold text-cyan-200/90">{xaRender("Ops · publier le gagnant (IPFS)")}</h2>
        <ol className="text-xs text-zinc-400 space-y-2 list-decimal list-inside leading-relaxed">
          <li>
            {xaRender("Bidder paie EGLD + memo")}{xaRender(' ')}
            <span className="font-mono text-zinc-300">{xaRender("ad-bid:slot:period")}</span>
          </li>
          <li>{xaRender("Upload créative → IPFS (CID) ou URL HTTPS stable")}</li>
          <li>
            {xaRender("Éditer ")}<span className="font-mono">{xaRender("public/data/ads_active.json")}</span> {xaRender(" (status active, imageCid/imageUrl, href) ")}</li>
          <li>{xaRender("Commit + Pages deploy — 1 créative max / slot")}</li>
          <li>{xaRender("Label : publicité · pas un investissement")}</li>
        </ol>
        <p className="text-[11px] text-zinc-600">{xaRender("docs/OPS_ADS.md · sample = tunnel démo")}</p>
      </section>
    </div>
  )
}
