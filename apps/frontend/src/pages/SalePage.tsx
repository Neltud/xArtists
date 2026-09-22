/**
 * Public sale — Pulse · Yield · Sentinel
 * Off-chain reservation until minter codeHash ≠ null.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LINKS } from '../config/links'

type PackId = 'pulse' | 'yield' | 'sentinel' | 'bundle'

const PACKS: {
  id: PackId
  name: string
  tagline: string
  priceEur: number
  promoTroHint: string
  supply: string
  accent: string
  glow: string
}[] = [
  {
    id: 'sentinel',
    name: 'Sentinel',
    tagline: 'Alertes · garde-fous · veille',
    priceEur: 8,
    promoTroHint: '≈ 40–60 $TRO',
    supply: '777',
    accent: 'from-sky-400/20 to-transparent',
    glow: 'shadow-sky-500/20',
  },
  {
    id: 'yield',
    name: 'Yield',
    tagline: 'Sleeve DeFi · compound view',
    priceEur: 12,
    promoTroHint: '≈ 60–90 $TRO',
    supply: '500',
    accent: 'from-teal-400/20 to-transparent',
    glow: 'shadow-teal-500/20',
  },
  {
    id: 'pulse',
    name: 'Pulse',
    tagline: 'Signaux · micro-arb · board',
    priceEur: 18,
    promoTroHint: '≈ 90–120 $TRO',
    supply: '333',
    accent: 'from-emerald-400/25 to-transparent',
    glow: 'shadow-emerald-500/25',
  },
  {
    id: 'bundle',
    name: 'Trio',
    tagline: 'Les 3 packs · lancement',
    priceEur: 29,
    promoTroHint: '≈ 150–180 $TRO',
    supply: '100',
    accent: 'from-violet-400/30 via-fuchsia-500/10 to-cyan-400/10',
    glow: 'shadow-violet-500/30',
  },
]

export default function SalePage() {
  const [selected, setSelected] = useState<PackId>('bundle')
  const [erd, setErd] = useState('')
  const [email, setEmail] = useState('')
  const [pay, setPay] = useState<'eur' | 'tro' | 'egld'>('eur')
  const [sent, setSent] = useState(false)

  const active = useMemo(() => PACKS.find(p => p.id === selected)!, [selected])

  const onReserve = (e: React.FormEvent) => {
    e.preventDefault()
    const body = encodeURIComponent(
      `xArtists SALE reserve\nPack: ${active.name}\nPrice: ${active.priceEur} EUR\nPay: ${pay}\nERD: ${erd}\nEmail: ${email}`,
    )
    window.open(
      `mailto:hello@xartists.art?subject=${encodeURIComponent(`[SALE] ${active.name}`)}&body=${body}`,
      '_blank',
    )
    setSent(true)
  }

  return (
    <div className="animate-fade-in pb-20 max-w-4xl mx-auto space-y-10">
      <header className="relative overflow-hidden rounded-[2rem] border border-white/10 px-6 py-12 md:px-12 md:py-16">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c0c14] via-[#12081c] to-[#061018]" />
        <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-violet-600/30 blur-[100px]" />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-300/90 mb-3">
            Public sale · launch
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-[1.05] tracking-tight">
            Trois packs.
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-200 via-fuchsia-200 to-cyan-200">
              Une entrée dans xArtists.
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-[15px] text-zinc-400 leading-relaxed">
            Pulse · Yield · Sentinel — accès board & signaux. Promo $TRO. Mint dès SC live. Pas de promesse de rendement.
          </p>
        </div>
      </header>

      <section className="grid sm:grid-cols-2 gap-4">
        {PACKS.map(p => {
          const on = selected === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p.id)}
              className={`text-left overflow-hidden rounded-3xl border p-5 transition-all ${
                on ? `border-white/25 bg-zinc-950/80 ring-1 ring-white/20 ${p.glow}` : 'border-white/8 bg-zinc-950/50'
              }`}
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${p.accent} opacity-80`} />
              <div className="relative">
                <p className="text-lg font-semibold text-white">{p.name}</p>
                <p className="text-[12px] text-zinc-500 mt-1">{p.tagline}</p>
                <p className="mt-4 text-3xl font-bold text-white">
                  {p.priceEur}<span className="text-base text-zinc-500 ml-1">€</span>
                </p>
                <p className="mt-1 text-[12px] text-violet-300/80">{p.promoTroHint}</p>
              </div>
            </button>
          )
        })}
      </section>

      <section className="rounded-3xl border border-white/10 bg-zinc-950/60 p-6 md:p-8 space-y-4">
        <h2 className="text-xl font-semibold text-white">Réserver · {active.name}</h2>
        <form onSubmit={onReserve} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {([['eur', 'EUR'], ['tro', '$TRO'], ['egld', 'EGLD']] as const).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setPay(k)}
                className={`rounded-full px-3 py-1.5 text-[12px] border ${
                  pay === k ? 'border-violet-400/50 bg-violet-500/15 text-violet-100' : 'border-white/10 text-zinc-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            required
            value={erd}
            onChange={e => setErd(e.target.value.trim())}
            placeholder="erd1…"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white"
          />
          <input
            required
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="email"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white"
          />
          <button type="submit" className="btn-primary text-sm py-3 px-8">
            Réserver {active.name} · {active.priceEur} €
          </button>
          {sent && (
            <p className="text-[13px] text-emerald-300/90">
              Demande ouverte.{' '}
              <a className="underline" href={LINKS.discord} target="_blank" rel="noreferrer">Discord</a>
            </p>
          )}
        </form>
        <p className="text-[11px] text-zinc-600">
          SC minter pas encore déployé — réservation off-chain, mint ultérieur. Pas un conseil d’investissement.
        </p>
      </section>

      <div className="flex flex-wrap gap-3 text-[13px]">
        <Link to="/agents" className="text-zinc-400 hover:text-white">Détail packs</Link>
        <Link to="/museum" className="text-zinc-400 hover:text-white">Galerie</Link>
        <Link to="/tro" className="text-zinc-400 hover:text-white">$TRO</Link>
      </div>
    </div>
  )
}
