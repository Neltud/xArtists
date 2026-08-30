import { Link } from 'react-router-dom'
import PageGuide from '../components/PageGuide'
import PaperSoulScore from '../components/PaperSoulScore'
import PersonaWelcome from '../components/PersonaWelcome'
import DualMarketplaceStrip from '../components/DualMarketplaceStrip'
import CommanderStrip from '../components/commander/CommanderStrip'
import GSNBanner from '../components/GSNBanner'
import ExplainCards from './ExplainCards'
import AdSlot from '../components/AdSlot'
import SocialOpsStrip from '../components/SocialOpsStrip'
import ScStatusBanner from '../components/ScStatusBanner'
import DataHealthStrip from '../components/DataHealthStrip'
import LiaRunStrip from '../components/LiaRunStrip'
import Lia3DBridge from '../components/ui/Lia3DBridge'
import { useEffect, useState } from 'react'

function PersonaQuickLinks({ persona }: { persona: string }) {
  return (
    <div className="card flex flex-wrap gap-2 items-center">
      <span className="text-xs text-zinc-500">Profil · {persona}</span>
      <Link to="/agents" className="btn-secondary !py-1.5 !px-3 text-xs">
        Packs
      </Link>
      <Link to="/trading" className="btn-secondary !py-1.5 !px-3 text-xs">
        Trading
      </Link>
      <Link to="/tours" className="btn-secondary !py-1.5 !px-3 text-xs">
        Tours
      </Link>
      <Link to="/museum" className="btn-secondary !py-1.5 !px-3 text-xs">
        Musée
      </Link>
    </div>
  )
}

export default function Dashboard() {
  const [persona, setPersona] = useState<string | null>(null)
  const live =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_LIA_LIVE_TRADING === '1'

  useEffect(() => {
    try {
      setPersona(localStorage.getItem('xartists_persona'))
    } catch {
      /* ignore */
    }
  }, [])

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      <PageGuide page="home" />

      <LiaRunStrip />

      <Lia3DBridge />

      <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] p-6 sm:p-10">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background:
              'radial-gradient(ellipse 70% 80% at 10% 20%, rgba(139,92,246,0.25), transparent), radial-gradient(ellipse 50% 60% at 90% 80%, rgba(34,211,238,0.12), transparent)',
          }}
        />
        <div className="relative z-[1] max-w-2xl space-y-4">
          <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-400/90 font-semibold">
            MultiversX · Agent layer
          </p>
          <h1 className="display text-4xl sm:text-5xl leading-[1.05]">
            L’intention devient{' '}
            <span className="gradient-text">action</span>
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-lg">
            xArtists — galerie NFT, packs agents, Art Tours, musée immersif et board LIA. Paper par
            défaut. Ton wallet signe. Vellum orchestre côté ops.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link to="/agents" className="btn-primary">
              Packs Agents
            </Link>
            <Link to="/museum" className="btn-secondary">
              Musée 3D
            </Link>
            <Link to="/tours" className="btn-secondary">
              Art Tours
            </Link>
            <Link to="/marketplace" className="btn-secondary">
              Marketplace
            </Link>
          </div>
          <p className="text-[11px] text-zinc-600">
            ⌘K / Ctrl+K — intention · Guardian · on-ramp EGLD
          </p>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link to="/sitemap" className="btn-ghost text-xs">
          Plan du site
        </Link>
        <Link to="/entity" className="btn-ghost text-xs">
          Entité
        </Link>
        <Link to="/sim" className="btn-ghost text-xs">
          Sim Lab
        </Link>
      </div>

      <SocialOpsStrip />
      <ScStatusBanner />
      <DataHealthStrip />

      {!persona && <PersonaWelcome />}
      {persona && <PersonaQuickLinks persona={persona} />}

      <div className="grid md:grid-cols-2 gap-4">
        <PaperSoulScore />
        <div className="card text-xs text-zinc-500 space-y-2">
          <p className="font-semibold text-zinc-200 text-sm">À retenir</p>
          <ul className="list-disc pl-4 space-y-1.5">
            <li>
              <strong className="text-zinc-300">Packs</strong> = Pulse / Yield / Sentinel
            </li>
            <li>
              <strong className="text-zinc-300">Tours</strong> = service culturel, pas un pack IA
            </li>
            <li>
              <strong className="text-zinc-300">Musée</strong> = Catzligue / Mydee / guide mondial
            </li>
            <li>
              <strong className="text-zinc-300">Trading</strong> = board LIA paper
              {live ? ' · ⚠ flag live' : ' · live OFF'}
            </li>
            <li>Stripe · MoonPay pour on-ramp</li>
          </ul>
        </div>
      </div>

      <DualMarketplaceStrip />
      <CommanderStrip />
      <GSNBanner />
      <ExplainCards />
      <AdSlot />
    </div>
  )
}
