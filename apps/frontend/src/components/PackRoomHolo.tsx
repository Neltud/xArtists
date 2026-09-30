/**
 * Salle pack — projection « holo » dashboard sur les murs (CSS 3D).
 */
import { useMemo } from 'react'
import type { PackId } from '../config/agentPacks'
import { AGENT_PACKS } from '../config/agentPacks'
import { MUSEUM_CAPACITY } from '../lib/museumCapacity'

const METRICS: Record<PackId, { label: string; value: string }[]> = {
  pulse: [
    { label: 'Signaux / 24h', value: '12' },
    { label: 'Intensité', value: '●●●' },
    { label: 'Mode', value: 'Paper' },
    { label: 'Pool bps', value: '4000' },
  ],
  yield: [
    { label: 'Claims / sem.', value: '2–4' },
    { label: 'Intensité', value: '●●○' },
    { label: 'Mode', value: 'Paper' },
    { label: 'Pool bps', value: '3500' },
  ],
  sentinel: [
    { label: 'Alertes', value: 'Veille' },
    { label: 'Intensité', value: '●○○' },
    { label: 'Mode', value: 'Paper' },
    { label: 'Pool bps', value: '2500' },
  ],
}

export default function PackRoomHolo({ packId }: { packId: PackId }) {
  const pack = AGENT_PACKS.find(p => p.id === packId)
  const metrics = METRICS[packId] || METRICS.pulse
  const walls = useMemo(() => [0, 1, 2, 3], [])

  return (
    <div className="relative w-full h-[min(52vh,420px)] rounded-2xl overflow-hidden border border-cyan-500/20 bg-[#060a12]">
      {/* floor grid */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(34,211,238,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.08) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          transform: 'perspective(600px) rotateX(62deg) translateY(40%)',
          transformOrigin: 'center top',
        }}
      />
      {/* 4 wall panels */}
      <div className="absolute inset-4 grid grid-cols-2 gap-3">
        {walls.map(i => (
          <div
            key={i}
            className="relative rounded-xl border border-cyan-400/25 bg-gradient-to-br from-cyan-950/40 to-black/60 p-3 shadow-[0_0_24px_-8px_rgba(34,211,238,0.45)] overflow-hidden"
          >
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.25),transparent_60%)]" />
            <p className="relative text-[10px] uppercase tracking-widest text-cyan-300/80">
              Mur {i + 1} · holo
            </p>
            <p className="relative text-sm font-semibold text-white mt-1">
              {metrics[i]?.label || 'Panel'}
            </p>
            <p className="relative text-2xl tabular-nums text-cyan-100 mt-2 font-mono">
              {metrics[i]?.value || '—'}
            </p>
            <p className="relative text-[10px] text-zinc-500 mt-auto pt-4">
              jusqu&apos;à {MUSEUM_CAPACITY.maxArtworksPerWall} œuvres
            </p>
          </div>
        ))}
      </div>
      <div className="absolute bottom-2 left-0 right-0 text-center text-[11px] text-cyan-200/70">
        {pack?.name || packId} · moniteur LIA · simulation
      </div>
    </div>
  )
}
