import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

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
    blurb: 'Mint, collection, royalties, Studio phygital — garde la valeur de ton œuvre.',
    primary: { to: '/studio', label: 'Ouvrir le Studio' },
    secondary: { to: '/gallery', label: 'Voir la galerie' },
  },
  {
    id: 'collector',
    emoji: '🖼️',
    title: 'Collectionneur',
    blurb: 'Galerie, marketplace, bid — explorer et acquérir des NFT xArtists.',
    primary: { to: '/gallery', label: 'Explorer la galerie' },
    secondary: { to: '/marketplace', label: 'Marketplace' },
  },
  {
    id: 'investor',
    emoji: '📈',
    title: 'Investisseur',
    blurb: '$TRO (cap 500 000), LP, Hatom, packs agents LIA — suivi protocole.',
    primary: { to: '/tro', label: 'Token $TRO' },
    secondary: { to: '/portfolio', label: 'Portfolio LIA' },
  },
  {
    id: 'curious',
    emoji: '🔎',
    title: 'Curieux',
    blurb: 'Découvrir LIA, agents, DAO et le tableau de bord sans pression.',
    primary: { to: '/', label: 'Dashboard' },
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

/**
 * Fenêtre d'accueil : Qui êtes-vous ?
 * Accessible dialog — focus trap simple via role=dialog + Escape.
 */
export default function PersonaWelcome({ forceOpen = false, onClose }: Props) {
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

  if (!open) {
    return (
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        {chosen && (
          <span className="rounded-full border border-white/10 px-3 py-1">
            Parcours : <strong className="text-purple-300">{PERSONAS.find(p => p.id === chosen)?.title}</strong>
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
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={() => { setOpen(false); onClose?.() }} />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-purple-500/30 bg-[#0d0d14] p-6 sm:p-8 shadow-2xl">
        <p className="text-xs uppercase tracking-widest text-purple-400 mb-2">Bienvenue sur xArtists</p>
        <h2 id="persona-title" className="text-2xl sm:text-3xl font-black mb-2">
          Vous êtes… ?
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          Choisissez un parcours pour aller droit au but. Vous pourrez changer à tout moment.
        </p>

        <div className="grid sm:grid-cols-2 gap-3" role="list">
          {PERSONAS.map(p => (
            <button
              key={p.id}
              type="button"
              role="listitem"
              onClick={() => {
                setStoredPersona(p.id)
                setChosen(p.id)
                setOpen(false)
                onClose?.()
                // soft navigate via full path for GH pages basename
                window.location.hash = ''
                const base = import.meta.env.BASE_URL || '/'
                window.history.pushState({}, '', `${base}${p.primary.to.replace(/^\//, '')}`.replace(/\/\//g, '/'))
                window.dispatchEvent(new PopStateEvent('popstate'))
              }}
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
            onClick={() => {
              setStoredPersona('curious')
              setChosen('curious')
              setOpen(false)
              onClose?.()
            }}
          >
            Continuer sans choisir (curieux)
          </button>
          <Link
            to="/gallery"
            className="text-xs text-purple-400"
            onClick={() => {
              setOpen(false)
              onClose?.()
            }}
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
