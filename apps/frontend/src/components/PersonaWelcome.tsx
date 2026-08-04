import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export type Persona = 'artist' | 'collector' | 'investor' | 'curious'

const STORAGE_KEY = 'xartists_persona_v1'

const PERSONAS: {
  id: Persona
  emoji: string
  title: string
  blurb: string
  primary: { to: string; label: string }
  secondary: { to: string; label: string }
}[] = [
  {
    id: 'artist',
    emoji: '🎨',
    title: 'Artiste',
    blurb:
      'Créez et publiez vos œuvres (Studio). NFT phygital, royalties, galerie xArtists — vous gardez la valeur de votre art.',
    primary: { to: '/studio', label: 'Ouvrir le Studio' },
    secondary: { to: '/gallery', label: 'Voir la galerie' },
  },
  {
    id: 'collector',
    emoji: '🖼️',
    title: 'Collectionneur',
    blurb:
      'Explorez la galerie et le marketplace. Achats on-chain dès que le smart contract est déployé ; XOXNO en alternative.',
    primary: { to: '/gallery', label: 'Explorer la galerie' },
    secondary: { to: '/marketplace', label: 'Marketplace' },
  },
  {
    id: 'investor',
    emoji: '📈',
    title: 'Investisseur',
    blurb:
      'Suivez $TRO (plafond 500 000), le portfolio LIA, les pools et les packs agents. Pas de conseil financier.',
    primary: { to: '/tro', label: 'Token $TRO' },
    secondary: { to: '/portfolio', label: 'Portfolio LIA' },
  },
  {
    id: 'curious',
    emoji: '🔎',
    title: 'Curieux',
    blurb:
      'Découvrez le tableau de bord LIA, les agents et la DAO à votre rythme — sans engagement.',
    primary: { to: '/', label: 'Tableau de bord' },
    secondary: { to: '/agents', label: 'Agents IA' },
  },
]

export function getStoredPersona(): Persona | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'artist' || v === 'collector' || v === 'investor' || v === 'curious') return v
  } catch {
    /* ignore */
  }
  return null
}

export function setStoredPersona(p: Persona | null) {
  try {
    if (!p) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, p)
  } catch {
    /* ignore */
  }
}

type Props = {
  forceOpen?: boolean
  onClose?: () => void
}

export default function PersonaWelcome({ forceOpen = false, onClose }: Props) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [chosen, setChosen] = useState<Persona | null>(null)

  useEffect(() => {
    const existing = getStoredPersona()
    setChosen(existing)
    setOpen(forceOpen || !existing)
  }, [forceOpen])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        onClose?.()
      }
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  const selectPersona = (id: Persona, goPrimary: boolean) => {
    setStoredPersona(id)
    setChosen(id)
    setOpen(false)
    onClose?.()
    if (goPrimary) {
      const p = PERSONAS.find(x => x.id === id)
      if (p) navigate(p.primary.to)
    }
  }

  if (!open) {
    return (
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        {chosen && (
          <span className="rounded-full border border-white/10 px-3 py-1">
            Parcours :{' '}
            <strong className="text-purple-300">{PERSONAS.find(p => p.id === chosen)?.title}</strong>
          </span>
        )}
        <button
          type="button"
          className="underline text-purple-400 hover:text-purple-300"
          onClick={() => setOpen(true)}
        >
          Changer de profil
        </button>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="persona-title"
      aria-describedby="persona-desc"
    >
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={() => {
          selectPersona(chosen || 'curious', false)
        }}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-purple-500/30 bg-[#0d0d14] p-6 sm:p-8 shadow-2xl">
        <p className="text-xs uppercase tracking-widest text-purple-400 mb-2">Bienvenue sur xArtists</p>
        <h2 id="persona-title" className="text-2xl sm:text-3xl font-black mb-2">
          Qui êtes-vous ?
        </h2>
        <p id="persona-desc" className="text-sm text-gray-400 mb-6">
          Choisissez un parcours pour accéder plus vite aux bonnes pages. Vous pourrez modifier ce choix à tout
          moment.
        </p>

        <div className="grid sm:grid-cols-2 gap-3">
          {PERSONAS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => selectPersona(p.id, true)}
              className="text-left rounded-2xl border border-[#2a2a3a] bg-[#12121a] p-4 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            >
              <span className="text-3xl" aria-hidden>
                {p.emoji}
              </span>
              <p className="font-bold text-lg mt-2">{p.title}</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{p.blurb}</p>
              <span className="inline-block mt-3 text-xs font-semibold text-purple-400">
                {p.primary.label} →
              </span>
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3 justify-between items-center">
          <button
            type="button"
            className="text-xs text-gray-500 underline"
            onClick={() => selectPersona('curious', false)}
          >
            Continuer sans choisir
          </button>
          <Link
            to="/gallery"
            className="text-xs text-purple-400"
            onClick={() => selectPersona('collector', false)}
          >
            Galerie directe →
          </Link>
        </div>
      </div>
    </div>
  )
}

export function PersonaQuickLinks({ persona }: { persona: Persona | null }) {
  const p = PERSONAS.find(x => x.id === persona) || PERSONAS[3]
  return (
    <nav aria-label="Parcours recommandé" className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
      <Link to={p.primary.to} className="btn-primary text-center text-xs sm:text-sm py-2.5">
        {p.primary.label}
      </Link>
      <Link to={p.secondary.to} className="btn-secondary text-center text-xs sm:text-sm py-2.5">
        {p.secondary.label}
      </Link>
      <Link to="/studio" className="btn-secondary text-center text-xs sm:text-sm py-2.5">
        Studio
      </Link>
      <Link to="/agents" className="btn-secondary text-center text-xs sm:text-sm py-2.5">
        Agents
      </Link>
    </nav>
  )
}
