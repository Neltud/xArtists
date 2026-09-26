/**
 * Comptes officiels + location d’espace d’expo (tarifs notoriété · split revenus).
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { requestOpenConnect } from '../lib/walletEvents'
import Phase4ReadinessBanner from '../components/Phase4ReadinessBanner'
import {
  VENUE_RENTAL_TIERS,
  VENUE_REVENUE_SPLIT,
  splitVenuePayment,
} from '../config/venueRental'

type Role = 'museum' | 'gallery' | 'artist' | 'company'

const ROLES: { id: Role; label: string; hint: string }[] = [
  { id: 'museum', label: 'Musée / institution', hint: 'Lieu d’exposition permanent' },
  { id: 'gallery', label: 'Galerie', hint: 'Espace d’expo / vente' },
  { id: 'artist', label: 'Artiste', hint: 'Créateur · 1/1 · collections' },
  { id: 'company', label: 'Société', hint: 'Sponsor · mécénat · marque' },
]

export default function VenueAccountPage() {
  const { connected, address } = useWallet()
  const [role, setRole] = useState<Role>('museum')
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [note, setNote] = useState('')
  const [done, setDone] = useState<string | null>(null)
  const [rentalTier, setRentalTier] = useState('iconic')

  const submit = () => {
    if (!connected) {
      requestOpenConnect()
      return
    }
    if (!name.trim()) return
    const payload = {
      role,
      name: name.trim(),
      city: city.trim(),
      note: note.trim(),
      wallet: address,
      mode: 'paper',
      ts: new Date().toISOString(),
    }
    try {
      const key = 'xartists_venue_intents'
      const prev = JSON.parse(localStorage.getItem(key) || '[]')
      prev.unshift(payload)
      localStorage.setItem(key, JSON.stringify(prev.slice(0, 20)))
    } catch {
      /* */
    }
    setDone(`${name} · ${role} · paper`)
    window.dispatchEvent(
      new CustomEvent('lia-intent', {
        detail: {
          lip: {
            raw: `register venue ${role} ${name}`,
            type: 'VENUE_REGISTER',
            paper: true,
            ...payload,
          },
        },
      }),
    )
  }

  const bookRental = () => {
    const tier = VENUE_RENTAL_TIERS.find(t => t.id === rentalTier) || VENUE_RENTAL_TIERS[0]
    const split = splitVenuePayment(tier.priceEurMonth)
    const payload = {
      type: 'VENUE_RENTAL',
      tier: tier.id,
      priceEur: tier.priceEurMonth,
      split,
      mode: 'paper',
      wallet: address || null,
      ts: new Date().toISOString(),
    }
    try {
      const key = 'xartists_venue_rentals'
      const prev = JSON.parse(localStorage.getItem(key) || '[]')
      prev.unshift(payload)
      localStorage.setItem(key, JSON.stringify(prev.slice(0, 30)))
    } catch {
      /* */
    }
    setDone(`Location ${tier.label} · ${tier.priceEurMonth} € / mois · paper`)
    window.dispatchEvent(
      new CustomEvent('lia-intent', {
        detail: { lip: { raw: `rent venue ${tier.id}`, ...payload } },
      }),
    )
  }

  const louvreSplit = splitVenuePayment(100)

  return (
    <div className="animate-fade-in space-y-6 pb-16 max-w-lg mx-auto">
      <header className="space-y-2">
        <p className="section-label">Démo live · paper</p>
        <h1 className="section-title display">Comptes & location</h1>
        <div className="atelier-title-rule" aria-hidden />
        <p className="section-lead">
          Musées, galeries, artistes — wallet MultiversX. Location d’espace selon notoriété. Paper
          jusqu’au SC identity / marketplace.
        </p>
      </header>

      <Phase4ReadinessBanner variant="compact" />

      <section className="rounded-2xl border border-violet-500/25 bg-violet-950/20 p-4 space-y-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-violet-300/90">Location d’espace</p>
        <h2 className="text-lg font-semibold text-white">Tarifs selon notoriété</h2>
        <p className="text-[13px] text-zinc-400 leading-relaxed">
          1 mur / mois. Split : institution, associations art numérique, LIA, holders (SC rewards).
        </p>
        <ul className="space-y-2">
          {VENUE_RENTAL_TIERS.map(tier => (
            <li key={tier.id}>
              <button
                type="button"
                onClick={() => setRentalTier(tier.id)}
                className={`w-full rounded-xl border px-3 py-2.5 flex justify-between gap-3 text-left transition ${
                  rentalTier === tier.id
                    ? 'border-violet-400/50 bg-violet-500/15'
                    : 'border-white/10 bg-black/30 hover:border-white/20'
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-white">{tier.label}</p>
                  <p className="text-[11px] text-zinc-500">{tier.examples.join(' · ')}</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">{tier.slotsHint}</p>
                </div>
                <p className="text-lg font-semibold text-amber-200 tabular-nums shrink-0">
                  {tier.priceEurMonth} €
                </p>
              </button>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400 pt-1">
          <p>
            Institution <span className="text-zinc-200">{VENUE_REVENUE_SPLIT.institution}%</span>
          </p>
          <p>
            Associations <span className="text-zinc-200">{VENUE_REVENUE_SPLIT.associations}%</span>
          </p>
          <p>
            LIA treasury <span className="text-zinc-200">{VENUE_REVENUE_SPLIT.liaTreasury}%</span>
          </p>
          <p>
            Holders SC <span className="text-zinc-200">{VENUE_REVENUE_SPLIT.holdersRewards}%</span>
          </p>
        </div>
        <p className="text-[10px] text-zinc-600">
          Ex. Louvre 100 € → institution {louvreSplit.institution.toFixed(0)} € · assoc.{" "}
          {louvreSplit.associations.toFixed(0)} € · LIA {louvreSplit.liaTreasury.toFixed(0)} € ·
          holders {louvreSplit.holdersRewards.toFixed(0)} €
        </p>
        <button type="button" className="btn-primary w-full" onClick={bookRental}>
          Réserver (paper) — {VENUE_RENTAL_TIERS.find(t => t.id === rentalTier)?.priceEurMonth} € / mois
        </button>
      </section>

      <div className="rounded-2xl border border-white/10 bg-zinc-950/50 p-4 space-y-4">
        <p className="text-[11px] uppercase tracking-wider text-zinc-500">Type de compte</p>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map(r => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id)}
              className={`rounded-xl border px-3 py-2.5 text-left text-[12px] transition ${
                role === r.id
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-100'
                  : 'border-white/10 bg-black/30 text-zinc-400'
              }`}
            >
              <span className="font-semibold block text-zinc-200">{r.label}</span>
              <span className="text-[10px] text-zinc-500">{r.hint}</span>
            </button>
          ))}
        </div>

        <label className="block space-y-1">
          <span className="text-[11px] text-zinc-500">Nom</span>
          <input
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Musée / galerie / artiste"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] text-zinc-500">Ville</span>
          <input
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="Paris"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] text-zinc-500">Note</span>
          <textarea
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white min-h-[72px]"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Programme d’expo, partenariat…"
          />
        </label>

        {!connected && (
          <p className="text-[12px] text-amber-200/90">Connectez un wallet pour enregistrer (paper).</p>
        )}
        <button type="button" className="btn-primary w-full" onClick={submit}>
          {connected ? 'Enregistrer le compte' : 'Connecter & enregistrer'}
        </button>
        {done && <p className="text-[12px] text-emerald-300">{done}</p>}
      </div>

      <p className="text-[11px] text-zinc-600">
        <Link to="/museum" className="text-zinc-400 underline-offset-2 hover:underline">
          Retour galerie 3D
        </Link>
        {' · '}
        <Link to="/ads" className="text-zinc-400 underline-offset-2 hover:underline">
          Enchères pubs
        </Link>
      </p>
    </div>
  )
}
