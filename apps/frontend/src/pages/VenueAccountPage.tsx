/**
 * Comptes officiels — lieux d’expo, musées, artistes, sociétés (démo paper).
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { requestOpenConnect } from '../lib/walletEvents'
import Phase4ReadinessBanner from '../components/Phase4ReadinessBanner'

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

  return (
    <div className="animate-fade-in space-y-6 pb-16 max-w-lg mx-auto">
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Démo live · paper
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Compte officiel</h1>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Musées, galeries, artistes et sociétés — liez un wallet MultiversX. Enregistrement paper
          jusqu’au SC identity / marketplace.
        </p>
      </header>

      <Phase4ReadinessBanner variant="compact" />

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
          <span className="text-[11px] text-zinc-500">Nom officiel</span>
          <input
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white"
            placeholder="ex. Musée du Louvre · Studio Tuduri"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] text-zinc-500">Ville</span>
          <input
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white"
            placeholder="Paris"
            value={city}
            onChange={e => setCity(e.target.value)}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] text-zinc-500">Pitch / note (optionnel)</span>
          <textarea
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white min-h-[72px]"
            placeholder="Expo, collection, mécénat…"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </label>

        <div className="rounded-xl border border-white/8 bg-black/30 px-3 py-2 text-[11px] text-zinc-500">
          Wallet :{' '}
          {connected ? (
            <span className="font-mono text-emerald-300/90">
              {address?.slice(0, 8)}…{address?.slice(-6)}
            </span>
          ) : (
            <span className="text-amber-200/80">non connecté</span>
          )}
        </div>

        <button
          type="button"
          onClick={submit}
          className="w-full rounded-xl bg-amber-200/90 text-zinc-950 py-3 text-sm font-semibold"
        >
          {!connected ? 'Connecter le wallet' : 'Enregistrer (paper)'}
        </button>

        {done && (
          <p className="text-[12px] text-emerald-300/90 text-center">Intent enregistré · {done}</p>
        )}
      </div>

      <p className="text-[11px] text-zinc-600 leading-relaxed">
        Démo marketing : wallet = identité · paper = pas d’engagement on-chain.{' '}
        <Link to="/museum" className="text-zinc-400 hover:text-white">
          Galerie
        </Link>
        {' · '}
        <Link to="/go-live" className="text-zinc-400 hover:text-white">
          GO_LIVE
        </Link>
      </p>
    </div>
  )
}
