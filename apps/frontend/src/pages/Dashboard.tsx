/**
 * Home demo — verrouillée clean. Aucun strip ops / SC / health.
 */
import { Link } from 'react-router-dom'
import PageGuide from '../components/PageGuide'
import PersonaWelcome from '../components/PersonaWelcome'
import SoftLaunchPath from '../components/SoftLaunchPath'
import { useEffect, useState } from 'react'

export default function Dashboard() {
  const [persona, setPersona] = useState<string | null>(null)

  useEffect(() => {
    try {
      setPersona(localStorage.getItem('xartists_persona'))
    } catch {
      /* ignore */
    }
  }, [])

  return (
    <div className="animate-fade-in space-y-6 pb-10 max-w-3xl">
      <PageGuide page="home" />

      <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] p-6 sm:p-10">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background:
              'radial-gradient(ellipse 70% 80% at 10% 20%, rgba(139,92,246,0.22), transparent), radial-gradient(ellipse 50% 60% at 90% 80%, rgba(34,211,238,0.1), transparent)',
          }}
        />
        <div className="relative z-[1] max-w-2xl space-y-4">
          <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-400/90 font-semibold">
            MultiversX · xArtists
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white leading-tight">
            Galerie · packs · <span className="gradient-text">musée</span>
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-lg">
            NFT MultiversX, packs agents Pulse · Yield · Sentinel, visites musée et Art Tours. Mode
            paper par défaut — pas de trading live sur cette démo.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link to="/museum" className="btn-primary">
              Musée 3D
            </Link>
            <Link to="/agents" className="btn-secondary">
              Packs
            </Link>
            <Link to="/gallery" className="btn-secondary">
              Galerie
            </Link>
            <Link to="/tours" className="btn-secondary">
              Tours
            </Link>
          </div>
        </div>
      </section>

      <SoftLaunchPath compact />

      {!persona && <PersonaWelcome />}

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-xs text-zinc-500 space-y-2">
        <p className="font-semibold text-zinc-200 text-sm">En bref</p>
        <ul className="list-disc pl-4 space-y-1.5">
          <li>
            <strong className="text-zinc-300">Packs</strong> — Pulse · Yield · Sentinel (accès agent,
            NFT d’entitlement)
          </li>
          <li>
            <strong className="text-zinc-300">Tours / Musée</strong> — culture & visite, pas un pack IA
          </li>
          <li>
            <strong className="text-zinc-300">Trading</strong> — board LIA en paper sur la démo
          </li>
        </ul>
      </div>

      <p className="text-[11px] text-zinc-600">
        <Link to="/wallet" className="text-cyan-300/90 hover:underline">
          Wallet
        </Link>
        {' · '}
        <Link to="/marketplace" className="text-cyan-300/90 hover:underline">
          Marketplace
        </Link>
        {' · '}
        <Link to="/my-packs" className="text-cyan-300/90 hover:underline">
          My Packs
        </Link>
        {' · '}
        <Link to="/legal" className="text-cyan-300/90 hover:underline">
          Mentions légales
        </Link>
      </p>
    </div>
  )
}
