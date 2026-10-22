import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/**
 * Bandeau info mainnet — statuts SC, limites connues, liens explorer.
 * Lecture publique uniquement (pas de signature).
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MAINNET_ADDRESSES } from '../config/contracts'
import {
  canBuyAgent,
  canListBuyNft,
  canSpinSlot,
  canStakeTro,
} from '../config/scStatus'

type EgldSnap = { price: number | null; epoch: number | null }

export default function ChainInfoBanner({ compact = false }: { compact?: boolean }) {
  const [egld, setEgld] = useState<EgldSnap>({ price: null, epoch: null })

  useEffect(() => {
    let c = false
    fetch('https://api.multiversx.com/economics', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (c || !j) return
        setEgld({
          price: Number(j.price) || null,
          epoch: Number(j.epoch) || null,
        })
      })
      .catch(() => {})
    return () => {
      c = true
    }
  }, [])

  const rows: { label: string; ok: boolean; note: string; href?: string }[] = [
    {
      label: 'Marketplace NFT',
      ok: canListBuyNft(),
      note: canListBuyNft() ? 'list/buy prêts (éviter listing #1 inactif)' : 'codehash / gate',
      href: `https://explorer.multiversx.com/accounts/${MAINNET_ADDRESSES.nft_marketplace}`,
    },
    {
      label: 'Staking $TRO',
      ok: canStakeTro(),
      note: canStakeTro() ? 'SC live' : 'bientôt / gate',
      href: `https://explorer.multiversx.com/accounts/${MAINNET_ADDRESSES.tro_staking}`,
    },
    {
      label: 'Agents marketplace',
      ok: canBuyAgent(),
      note: canBuyAgent() ? 'achat pack possible si mint live' : 'UI ouverte · mint selon gate',
      href: `https://explorer.multiversx.com/accounts/${MAINNET_ADDRESSES.agents_marketplace}`,
    },
    {
      label: 'Slot casino',
      ok: canSpinSlot(),
      note: canSpinSlot()
        ? 'spin EGLD'
        : 'souvent isPayable=false — spin EGLD rejeté on-chain',
      href: `https://explorer.multiversx.com/accounts/${MAINNET_ADDRESSES.slot_casino}`,
    },
  ]

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold">
            {xaRender("MultiversX · Mainnet ")}</p>
          <p className="text-[13px] text-zinc-300 mt-0.5">
            {xaRender("EGLD")}{xaRender(' ')}
            <span className="text-white tabular-nums font-medium">
              {xaRender(egld.price != null ? `$${egld.price.toFixed(2)}` : '—')}
            </span>
            {xaRender(egld.epoch != null && (
              <span className="text-zinc-500 text-[11px] ml-2">{xaRender("epoch ")}{xaRender(egld.epoch)}</span>
            ))}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-200">
            {xaRender("SC déployés ")}</span>
          <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold text-amber-100">
            {xaRender("LIA = paper ")}</span>
          <span className="rounded-full border border-white/15 px-2 py-0.5 text-[9px] font-semibold text-zinc-400">
            {xaRender("TX = xPortal ")}</span>
        </div>
      </div>

      {xaRender(!compact && (
        <ul className="grid sm:grid-cols-2 gap-2">
          {xaRender(rows.map(r => (
            <li
              key={r.label}
              className="rounded-xl border border-white/8 bg-black/30 px-2.5 py-2 flex items-start gap-2"
            >
              <span
                className={`mt-0.5 shrink-0 h-2 w-2 rounded-full ${
                  r.ok ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-white">{xaRender(r.label)}</p>
                <p className="text-[10px] text-zinc-500 leading-snug">{xaRender(r.note)}</p>
              </div>
              {xaRender(r.href && (
                <a
                  href={r.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-cyan-400/90 shrink-0"
                >
                  ↗
                </a>
              ))}
            </li>
          )))}
        </ul>
      ))}

      <p className="text-[10px] text-zinc-600 leading-relaxed">
        {xaRender("Token $TRO · ")}<code className="text-[9px]">TRO-94c925</code>
        {xaRender(' · ')}
        {xaRender("USDC · ")}<code className="text-[9px]">USDC-c76f1f</code>
        {xaRender(' · ')}
        {xaRender("Signatures on-chain uniquement via wallet utilisateur (xPortal). Trading agent = lecture / intents paper jusqu&apos;à activation produit explicite. ")}</p>

      <div className="flex flex-wrap gap-2 text-[11px]">
        <Link to="/go-live" className="text-cyan-400 hover:underline">
          {xaRender("Checklist GO_LIVE → ")}</Link>
        <Link to="/agents" className="text-zinc-400 hover:underline">
          {xaRender("Packs + On-Ramp → ")}</Link>
        <Link to="/lia" className="text-zinc-400 hover:underline">
          {xaRender("Hub LIA → ")}</Link>
        <Link to="/command-center" className="text-zinc-400 hover:underline">
          {xaRender("Command Center → ")}</Link>
      </div>
    </div>
  )
}
