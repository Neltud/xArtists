/**
 * Packs Agents IA — page produit unique, design pro.
 * Pulse · Yield · Sentinel uniquement. NFT = forme d’accès, pas un 2e rayon.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import PackCheckout from '../components/PackCheckout'
import {
  AGENT_PACKS,
  type AgentPackProfile,
  type PackId,
} from '../config/agentPacks'
import { canBuyAgent } from '../config/scStatus'

const ACCENT: Record<PackId, { ring: string; bar: string; soft: string }> = {
  pulse: {
    ring: 'border-emerald-500/35 hover:border-emerald-400/50',
    bar: 'bg-emerald-400',
    soft: 'from-emerald-500/10 to-transparent',
  },
  yield: {
    ring: 'border-teal-500/35 hover:border-teal-400/50',
    bar: 'bg-teal-400',
    soft: 'from-teal-500/10 to-transparent',
  },
  sentinel: {
    ring: 'border-sky-500/35 hover:border-sky-400/50',
    bar: 'bg-sky-400',
    soft: 'from-sky-500/10 to-transparent',
  },
}

const RISK_LABEL: Record<AgentPackProfile['risk'], string> = {
  medium: 'Profil actif',
  lower: 'Profil modéré',
  low: 'Profil prudent',
}

export default function Agents() {
  const [selected, setSelected] = useState<PackId | null>(null)
  const mintLive = canBuyAgent()
  const active = AGENT_PACKS.find(p => p.id === selected) || null

  return (
    <div className="animate-fade-in pb-14 max-w-5xl mx-auto">
      <header className="mb-10 space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Agents IA · MultiversX
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
          Trois packs d’accès
        </h1>
        <p className="text-zinc-400 text-[15px] leading-relaxed max-w-xl">
          Pulse, Yield et Sentinel donnent accès aux signaux et au board LIA. Chaque pack est un
          produit unique, livré comme NFT d’entitlement — pas un fonds, pas de rendement promis.
        </p>
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-zinc-500">
          <li>Mode paper sur la démo</li>
          <li>Wallet utilisateur pour toute signature</li>
          <li>
            <Link to="/tours" className="text-zinc-400 underline-offset-2 hover:underline">
              Art Tours
            </Link>{' '}
            = culture, hors packs
          </li>
        </ul>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
        {AGENT_PACKS.map(p => {
          const a = ACCENT[p.id]
          const isOn = selected === p.id
          return (
            <article
              key={p.id}
              className={`relative flex flex-col rounded-2xl border bg-gradient-to-b ${a.soft} bg-zinc-950/80 p-5 transition-colors ${a.ring} ${
                isOn ? 'ring-1 ring-white/20' : ''
              }`}
            >
              <div className={`absolute top-0 left-6 right-6 h-px ${a.bar} opacity-60`} />
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <h2 className="text-xl font-semibold text-white tracking-tight">{p.name}</h2>
                <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                  {RISK_LABEL[p.risk]}
                </span>
              </div>
              <p className="text-[13px] text-zinc-400 mb-4 min-h-[2.5rem]">{p.tagline}</p>

              <p className="text-3xl font-semibold text-white tabular-nums tracking-tight mb-1">
                {p.priceEur.list}
                <span className="text-base font-normal text-zinc-500 ml-1">€</span>
              </p>
              <p className="text-[11px] text-zinc-600 mb-5">prix list · accès pack</p>

              <div className="mb-4">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1.5">
                  Intensité signaux
                </p>
                <div className="flex gap-1">
                  {[1, 2, 3].map(i => (
                    <span
                      key={i}
                      className={`h-1 flex-1 rounded-full ${
                        i <= p.signalIntensity ? a.bar : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-zinc-500 mt-2">{p.activity}</p>
              </div>

              <div className="mb-4">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1.5">
                  Stratégies
                </p>
                <p className="text-[12px] text-zinc-300 font-mono tracking-wide">
                  {p.strategies.join(' · ')}
                </p>
              </div>

              <div className="mb-3 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1.5">Inclus</p>
                <ul className="space-y-1">
                  {p.entitlements.map(e => (
                    <li key={e} className="text-[12px] text-zinc-300 flex gap-2">
                      <span className="text-zinc-600 shrink-0">—</span>
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-5">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1.5">
                  Non inclus
                </p>
                <ul className="space-y-1">
                  {p.notIncluded.slice(0, 3).map(e => (
                    <li key={e} className="text-[11px] text-zinc-500 flex gap-2">
                      <span className="text-zinc-700 shrink-0">×</span>
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelected(p.id)
                  requestAnimationFrame(() => {
                    document
                      .getElementById('pack-pay')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                  })
                }}
                className={`w-full rounded-xl py-2.5 text-sm font-medium transition-colors ${
                  isOn
                    ? 'bg-white text-zinc-900'
                    : 'bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                {isOn ? 'Sélectionné' : 'Sélectionner'}
              </button>
            </article>
          )
        })}
      </div>

      <section className="mb-10 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[640px] text-left text-[13px]">
          <caption className="sr-only">Comparatif des packs Pulse, Yield et Sentinel</caption>
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03]">
              <th className="px-4 py-3 font-medium text-zinc-500">Critère</th>
              {AGENT_PACKS.map(p => (
                <th key={p.id} className="px-4 py-3 font-semibold text-white">
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-zinc-400">
            <tr className="border-b border-white/[0.06]">
              <td className="px-4 py-3 text-zinc-500">Prix list</td>
              {AGENT_PACKS.map(p => (
                <td key={p.id} className="px-4 py-3 text-white font-medium tabular-nums">
                  {p.priceEur.list} €
                </td>
              ))}
            </tr>
            <tr className="border-b border-white/[0.06]">
              <td className="px-4 py-3 text-zinc-500">Profil</td>
              {AGENT_PACKS.map(p => (
                <td key={p.id} className="px-4 py-3">
                  {RISK_LABEL[p.risk]}
                </td>
              ))}
            </tr>
            <tr className="border-b border-white/[0.06]">
              <td className="px-4 py-3 text-zinc-500">Intensité signaux</td>
              {AGENT_PACKS.map(p => (
                <td key={p.id} className="px-4 py-3">
                  <span className="inline-flex gap-0.5" aria-label={`${p.signalIntensity} sur 3`}>
                    {[1, 2, 3].map(i => (
                      <span
                        key={i}
                        className={`h-1.5 w-4 rounded-full ${
                          i <= p.signalIntensity ? ACCENT[p.id].bar : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </span>
                </td>
              ))}
            </tr>
            <tr className="border-b border-white/[0.06]">
              <td className="px-4 py-3 text-zinc-500">Cadence</td>
              {AGENT_PACKS.map(p => (
                <td key={p.id} className="px-4 py-3 text-[12px] leading-snug">
                  {p.activity}
                </td>
              ))}
            </tr>
            <tr className="border-b border-white/[0.06]">
              <td className="px-4 py-3 text-zinc-500">Stratégies</td>
              {AGENT_PACKS.map(p => (
                <td key={p.id} className="px-4 py-3 font-mono text-[11px] text-zinc-300">
                  {p.strategies.join(', ')}
                </td>
              ))}
            </tr>
            <tr className="border-b border-white/[0.06]">
              <td className="px-4 py-3 text-zinc-500">NFT d’accès</td>
              {AGENT_PACKS.map(p => (
                <td key={p.id} className="px-4 py-3 text-zinc-300">
                  Oui
                </td>
              ))}
            </tr>
            <tr className="border-b border-white/[0.06]">
              <td className="px-4 py-3 text-zinc-500">Clé API limitée</td>
              {AGENT_PACKS.map(p => (
                <td key={p.id} className="px-4 py-3">
                  {p.entitlements.some(e => /API/i.test(e)) ? 'Oui' : '—'}
                </td>
              ))}
            </tr>
            <tr className="border-b border-white/[0.06]">
              <td className="px-4 py-3 text-zinc-500">Part de pool</td>
              {AGENT_PACKS.map(p => (
                <td key={p.id} className="px-4 py-3 tabular-nums">
                  {(p.shareOfPackPoolBps / 100).toFixed(0)} %
                </td>
              ))}
            </tr>
            <tr className="border-b border-white/[0.06]">
              <td className="px-4 py-3 text-zinc-500">Rendement garanti</td>
              {AGENT_PACKS.map(p => (
                <td key={p.id} className="px-4 py-3 text-zinc-500">
                  Non
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 text-zinc-500">Mandat de gestion</td>
              {AGENT_PACKS.map(p => (
                <td key={p.id} className="px-4 py-3 text-zinc-500">
                  Non
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </section>

      <section
        id="pack-pay"
        className="rounded-2xl border border-white/10 bg-zinc-950/60 p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Souscription</h2>
            <p className="text-[12px] text-zinc-500 mt-0.5">
              {active
                ? `${active.name} · ${active.priceEur.list} € · paiement carte puis NFT d’accès`
                : 'Choisissez un pack ci-dessus pour continuer.'}
            </p>
          </div>
          {!mintLive && (
            <span className="text-[10px] uppercase tracking-wider text-amber-200/80 border border-amber-500/25 rounded-full px-2 py-0.5">
              Mint on-chain ultérieur
            </span>
          )}
        </div>
        <PackCheckout packId={selected} onClear={() => setSelected(null)} />
      </section>

      <p className="mt-8 text-[12px] text-zinc-600 leading-relaxed max-w-2xl">
        Les packs n’entraînent aucun mandat de gestion sur vos fonds. Le board LIA reste en paper sur
        cette démo. Après achat, suivez l’état dans{' '}
        <Link
          to="/my-packs"
          className="text-zinc-400 hover:text-white underline-offset-2 hover:underline"
        >
          My Packs
        </Link>
        .
      </p>
    </div>
  )
}
