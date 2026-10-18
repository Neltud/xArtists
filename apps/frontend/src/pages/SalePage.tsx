/**
 * Public sale — Pulse · Yield · Sentinel — protocol UI + i18n.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LINKS } from '../config/links'
import { useI18n } from '../i18n/I18nContext'

type PackId = 'pulse' | 'yield' | 'sentinel' | 'bundle'

const PACKS: {
  id: PackId
  nameKey: string
  tagKey: string
  priceEur: number
  promoTroHint: string
}[] = [
  {
    id: 'pulse',
    nameKey: 'packs.pulse.name',
    tagKey: 'packs.pulse.tagline',
    priceEur: 110,
    promoTroHint: '≈ 90–120 $TRO',
  },
  {
    id: 'yield',
    nameKey: 'packs.yield.name',
    tagKey: 'packs.yield.tagline',
    priceEur: 75,
    promoTroHint: '≈ 60–90 $TRO',
  },
  {
    id: 'sentinel',
    nameKey: 'packs.sentinel.name',
    tagKey: 'packs.sentinel.tagline',
    priceEur: 50,
    promoTroHint: '≈ 40–60 $TRO',
  },
  {
    id: 'bundle',
    nameKey: 'sale.bundle',
    tagKey: 'sale.bundle.tagline',
    priceEur: 200,
    promoTroHint: '≈ 150–180 $TRO',
  },
]

export default function SalePage() {
  const { t } = useI18n()
  const [selected, setSelected] = useState<PackId>('pulse')
  const [erd, setErd] = useState('')
  const [email, setEmail] = useState('')
  const [pay, setPay] = useState<'eur' | 'tro' | 'egld'>('eur')
  const [sent, setSent] = useState(false)

  const active = useMemo(() => PACKS.find(p => p.id === selected)!, [selected])

  const onReserve = (e: React.FormEvent) => {
    e.preventDefault()
    const name = t(active.nameKey)
    const body = encodeURIComponent(
      `xArtists SALE reserve\nPack: ${name}\nPrice: ${active.priceEur} EUR\nPay: ${pay}\nERD: ${erd}\nEmail: ${email}`,
    )
    window.open(
      `mailto:hello@xartists.art?subject=${encodeURIComponent(`[SALE] ${name}`)}&body=${body}`,
      '_blank',
    )
    setSent(true)
  }

  return (
    <div className="xa-page animate-fade-in max-w-4xl mx-auto space-y-10 pb-20">
      <section className="xa-hero" style={{ maxWidth: '100%', paddingTop: '2rem' }}>
        <p className="xa-hero__kicker">{t('sale.title')}</p>
        <h1 className="xa-hero__title">{t('packs.title')}</h1>
        <p className="xa-hero__lead">{t('sale.lead')}</p>
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        {PACKS.map(p => {
          const on = selected === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p.id)}
              className={`xa-card text-left w-full transition ${
                on ? 'ring-1 ring-white/20 border-[var(--xa-border-strong)]' : ''
              }`}
            >
              <p className="text-lg font-semibold text-[var(--xa-text)]">{t(p.nameKey)}</p>
              <p className="text-sm text-[var(--xa-text-secondary)] mt-1">{t(p.tagKey)}</p>
              <p className="mt-4 text-3xl font-bold text-[var(--xa-text)] tabular-nums">
                {p.priceEur}
                <span className="text-base text-[var(--xa-text-muted)] ml-1">€</span>
              </p>
              <p className="mt-1 text-xs text-[var(--xa-accent)]">{p.promoTroHint}</p>
            </button>
          )
        })}
      </section>

      <section className="xa-card space-y-4">
        <h2 className="text-xl font-semibold text-[var(--xa-text)]">
          {t('sale.reserve')} · {t(active.nameKey)}
        </h2>
        <form onSubmit={onReserve} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {([['eur', 'EUR'], ['tro', '$TRO'], ['egld', 'EGLD']] as const).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setPay(k)}
                className={`rounded-full px-3 py-1.5 text-xs border transition ${
                  pay === k
                    ? 'border-[var(--xa-accent)] bg-[var(--xa-accent-soft)] text-[var(--xa-text)]'
                    : 'border-[var(--xa-border)] text-[var(--xa-text-muted)]'
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
            className="w-full rounded-xl border border-[var(--xa-border)] bg-black/40 px-4 py-3 text-sm text-[var(--xa-text)]"
          />
          <input
            required
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="email"
            className="w-full rounded-xl border border-[var(--xa-border)] bg-black/40 px-4 py-3 text-sm text-[var(--xa-text)]"
          />
          <button type="submit" className="xa-btn-primary">
            {t('sale.reserve')} {t(active.nameKey)} · {active.priceEur} €
          </button>
          {sent && (
            <p className="text-sm text-emerald-300/90">
              OK —{' '}
              <a className="underline" href={LINKS.discord} target="_blank" rel="noreferrer">
                Discord
              </a>
            </p>
          )}
        </form>
        <p className="xa-disclaimer">{t('packs.disclaimer')}</p>
      </section>

      <div className="flex flex-wrap gap-4 text-sm">
        <Link to="/agents" className="text-[var(--xa-text-secondary)] hover:text-[var(--xa-text)]">
          {t('nav.packs')}
        </Link>
        <Link to="/museum" className="text-[var(--xa-text-secondary)] hover:text-[var(--xa-text)]">
          {t('nav.museum')}
        </Link>
        <Link to="/tro" className="text-[var(--xa-text-secondary)] hover:text-[var(--xa-text)]">
          $TRO
        </Link>
      </div>
    </div>
  )
}
