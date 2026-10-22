import {localizeChild as xaLocalize, renderChild as xaRender, usePhraseLocale as xaUsePhraseLocale} from '../i18n/phraseRuntime'
/**
 * Comptes officiels + location d’espace (grille dégressive lieu × durée × murs).
 * On-chain rentPay only if VITE_VENUE_SC_ADDRESS + VITE_VENUE_CODEHASH_OK.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { requestOpenConnect } from '../lib/walletEvents'
import Phase4ReadinessBanner from '../components/Phase4ReadinessBanner'
import {
  VENUE_RENTAL_TIERS,
  VENUE_REVENUE_SPLIT,
  DURATION_OPTIONS,
  quoteVenueRental,
  splitVenuePayment,
  type VenueTierId,
} from '../config/venueRental'
import { useVenueRentTx } from '../hooks/useVenueRentTx'

type Role = 'museum' | 'gallery' | 'artist' | 'company'

const ROLES: { id: Role; label: string; hint: string }[] = [
  { id: 'museum', label: 'Musée / institution', hint: 'Lieu d’exposition permanent' },
  { id: 'gallery', label: 'Galerie', hint: 'Espace d’expo / vente' },
  { id: 'artist', label: 'Artiste', hint: 'Créateur · 1/1 · collections' },
  { id: 'company', label: 'Société', hint: 'Sponsor · mécénat · marque' },
]

export default function VenueAccountPage() {
  xaUsePhraseLocale()

  const { connected, address } = useWallet()
  const { live: venueLive, pending: venuePending, error: venueErr, rentPay, venueAddress } =
    useVenueRentTx()
  const [role, setRole] = useState<Role>('museum')
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [note, setNote] = useState('')
  const [done, setDone] = useState<string | null>(null)
  const [rentalTier, setRentalTier] = useState<VenueTierId>('iconic')
  const [months, setMonths] = useState(1)
  const [walls, setWalls] = useState(1)

  const tier = VENUE_RENTAL_TIERS.find(t => t.id === rentalTier) || VENUE_RENTAL_TIERS[0]
  const quote = useMemo(
    () =>
      quoteVenueRental({
        priceEurMonth: tier.priceEurMonth,
        months,
        walls,
      }),
    [tier.priceEurMonth, months, walls],
  )
  const split = useMemo(() => splitVenuePayment(quote.totalEur), [quote.totalEur])

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

  const bookRental = async () => {
    const payload = {
      type: 'VENUE_RENTAL',
      tier: tier.id,
      months,
      walls,
      priceEurMonth: tier.priceEurMonth,
      totalEur: quote.totalEur,
      perMonthEffective: quote.perMonthEffective,
      savingsPct: quote.savingsPct,
      split,
      mode: venueLive ? 'live-ready' : 'paper',
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
    // EUR catalog = paper journal; on-chain micro EGLD via scripts/rentpay_micro_test.sh
    await rentPay(tier.id, 0, {
      totalEur: quote.totalEur,
      months,
      walls,
      forcePaper: true,
      ...payload,
    })
    setDone(
      `Location ${tier.label} · ${walls} mur(s) · ${months} mois · ${quote.totalEur} € · ${
        venueLive ? 'SC registered (micro EGLD for on-chain test)' : 'paper fail-closed'
      }`,
    )
  }

  return (
    <div className="animate-fade-in space-y-6 pb-16 max-w-lg mx-auto">
      <header className="space-y-2">
        <p className="section-label">{xaRender("Démo live · paper")}</p>
        <h1 className="section-title display">{xaRender("Comptes & location")}</h1>
        <div className="atelier-title-rule" aria-hidden />
        <p className="section-lead">
          {xaRender("Louez un mur (Louvre, Orsay…) avec grille dégressive selon durée et nombre de murs.")}{xaRender(' ')}
          {xaRender(venueLive
            ? `SC live · ${venueAddress.slice(0, 14)}…`
            : 'Paper fail-closed jusqu’à VITE_VENUE_CODEHASH_OK.')}
        </p>
      </header>

      <Phase4ReadinessBanner variant="compact" />

      <section className="rounded-2xl border border-violet-500/25 bg-violet-950/20 p-4 space-y-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-violet-300/90">
          {xaRender("Location d’espace · grille dégressive ")}</p>
        <h2 className="text-lg font-semibold text-white">{xaRender("Mur d’exposition")}</h2>

        <div className="space-y-2">
          {xaRender(VENUE_RENTAL_TIERS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setRentalTier(t.id)}
              className={`w-full rounded-xl border px-3 py-2.5 text-left text-[12px] transition ${
                rentalTier === t.id
                  ? 'border-violet-400/50 bg-violet-500/15 text-white'
                  : 'border-white/10 bg-black/30 text-zinc-400'
              }`}
            >
              <span className="flex justify-between gap-2">
                <span className="font-semibold">{xaRender(t.label)}</span>
                <span className="text-amber-200/90">{xaRender(t.priceEurMonth)} {xaRender(" €/mois")}</span>
              </span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">
                {xaRender(t.examples.join(' · '))}
              </span>
            </button>
          )))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-[11px] text-zinc-500">{xaRender("Durée")}</span>
            <select
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              value={months}
              onChange={e => setMonths(Number(e.target.value))}
            >
              {xaRender(DURATION_OPTIONS.map(d => (
                <option key={d.months} value={d.months}>
                  {xaRender(d.label)}
                  {xaRender(d.multiplier < 1 ? ` (−${Math.round((1 - d.multiplier) * 100)}%)` : '')}
                </option>
              )))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] text-zinc-500">{xaRender("Murs")}</span>
            <select
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              value={walls}
              onChange={e => setWalls(Number(e.target.value))}
            >
              {xaRender([1, 2, 3, 4].map(n => (
                <option key={n} value={n}>
                  {xaRender(n)} {xaRender(" mur")}{xaRender(n > 1 ? 's' : '')}
                </option>
              )))}
            </select>
          </label>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-[12px] space-y-1.5">
          <p className="flex justify-between text-zinc-300">
            <span>{xaRender("Total paper")}</span>
            <span className="font-semibold text-white">{xaRender(quote.totalEur)} €</span>
          </p>
          <p className="flex justify-between text-zinc-500">
            <span>{xaRender("Effectif / mois")}</span>
            <span>{xaRender(quote.perMonthEffective)} €</span>
          </p>
          {xaRender(quote.savingsPct > 0 && (
            <p className="text-emerald-400/90">{xaRender("Économie grille −")}{xaRender(quote.savingsPct)}%</p>
          ))}
          <p className="text-[10px] text-zinc-600 pt-1 border-t border-white/5">
            {xaRender("Split : institution ")}{xaRender(VENUE_REVENUE_SPLIT.institution)}{xaRender("% · assoc.")}{xaRender(' ')}
            {xaRender(VENUE_REVENUE_SPLIT.associations)}{xaRender("% · LIA ")}{xaRender(VENUE_REVENUE_SPLIT.liaTreasury)}{xaRender("% · holders")}{xaRender(' ')}
            {xaRender(VENUE_REVENUE_SPLIT.holdersRewards)}%
          </p>
          <p className="text-[10px] text-zinc-500">
            {xaRender("→ inst. ")}{xaRender(split.institution.toFixed(1))} {xaRender(" € · assoc. ")}{xaRender(split.associations.toFixed(1))} {xaRender(" € · LIA")}{xaRender(' ')}
            {xaRender(split.liaTreasury.toFixed(1))} {xaRender(" € · holders ")}{xaRender(split.holdersRewards.toFixed(1))} €
          </p>
        </div>

        {xaRender(venueErr && <p className="text-xs text-rose-400">{xaRender(venueErr)}</p>)}
        <p className="text-[10px] text-zinc-500">
          {xaRender(venueLive
            ? `On-chain ready · ${venueAddress}`
            : 'Fail-closed · VITE_VENUE_SC_ADDRESS + VITE_VENUE_CODEHASH_OK après verify')}
        </p>
        <button
          type="button"
          className="btn-primary w-full"
          disabled={venuePending}
          onClick={() => void bookRental()}
        >
          {xaRender(venueLive
            ? `Réserver · ${quote.totalEur} € (journal + SC registered)`
            : `Réserver (paper) · ${quote.totalEur} €`)}
          {xaRender(venuePending ? '…' : '')}
        </button>
        {xaRender(done && <p className="text-[12px] text-emerald-300">{xaRender(done)}</p>)}
      </section>

      <div className="card space-y-3">
        <h2 className="text-sm font-semibold text-white">{xaRender("Compte officiel")}</h2>
        <div className="grid grid-cols-2 gap-2">
          {xaRender(ROLES.map(r => (
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
              <span className="font-semibold block text-zinc-200">{xaRender(r.label)}</span>
              <span className="text-[10px] text-zinc-500">{xaRender(r.hint)}</span>
            </button>
          )))}
        </div>

        <label className="block space-y-1">
          <span className="text-[11px] text-zinc-500">{xaRender("Nom")}</span>
          <input
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={xaLocalize("Musée / galerie / artiste")}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] text-zinc-500">{xaRender("Ville")}</span>
          <input
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder={xaLocalize("Paris")}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] text-zinc-500">{xaRender("Note")}</span>
          <textarea
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white min-h-[72px]"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder={xaLocalize("Programme d’expo, partenariat…")}
          />
        </label>

        {xaRender(!connected && (
          <p className="text-[12px] text-amber-200/90">{xaRender("Connectez un wallet pour enregistrer (paper).")}</p>
        ))}
        <button type="button" className="btn-primary w-full" onClick={submit}>
          {xaRender(connected ? 'Enregistrer le compte' : 'Connecter & enregistrer')}
        </button>
      </div>

      <p className="text-[11px] text-zinc-600">
        <Link to="/museum" className="text-zinc-400 underline-offset-2 hover:underline">
          {xaRender("Retour galerie 3D ")}</Link>
        {xaRender(' · ')}
        <Link to="/go-live" className="text-zinc-400 underline-offset-2 hover:underline">
          {xaRender("GO_LIVE ")}</Link>
        {xaRender(' · ')}
        <Link to="/ads" className="text-zinc-400 underline-offset-2 hover:underline">
          {xaRender("Enchères pubs ")}</Link>
      </p>
    </div>
  )
}
