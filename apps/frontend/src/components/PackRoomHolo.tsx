/**
 * Salle holder futuriste — 3 murs + moniteur clone (CSS 3D, léger).
 */
import { useMemo } from 'react'
import type { PackId } from '../config/agentPacks'
import { AGENT_PACKS } from '../config/agentPacks'

const METRICS: Record<PackId, { label: string; value: string }[]> = {
  pulse: [
    { label: 'Signaux', value: 'haute densité' },
    { label: 'Mode', value: 'paper' },
    { label: 'Clone', value: 'LIA Pulse' },
  ],
  yield: [
    { label: 'Sleeve', value: 'Hatom / LP' },
    { label: 'Mode', value: 'paper' },
    { label: 'Clone', value: 'LIA Yield' },
  ],
  sentinel: [
    { label: 'Veille', value: 'risk on' },
    { label: 'Mode', value: 'paper' },
    { label: 'Clone', value: 'LIA Sentinel' },
  ],
}

const GLOW: Record<PackId, string> = {
  pulse: 'rgba(52,211,153,0.45)',
  yield: 'rgba(45,212,191,0.45)',
  sentinel: 'rgba(56,189,248,0.5)',
}

export default function PackRoomHolo({ packId }: { packId: PackId }) {
  const pack = AGENT_PACKS.find(p => p.id === packId)
  const metrics = METRICS[packId] || METRICS.pulse
  const glow = GLOW[packId] || GLOW.pulse
  const walls = useMemo(() => ['Nord', 'Est', 'Ouest'], [])

  return (
    <div className="relative w-full h-[min(56vh,460px)] rounded-2xl overflow-hidden border border-white/10 bg-[#05060d]">
      <div
        className="absolute inset-0 opacity-50"
        style={{
          background: `radial-gradient(ellipse at 50% 80%, ${glow}, transparent 55%)`,
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[55%] opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          transform: 'perspective(700px) rotateX(68deg)',
          transformOrigin: 'center bottom',
        }}
      />

      <div className="absolute inset-3 flex items-stretch gap-2" style={{ perspective: '900px' }}>
        {walls.map((w, i) => (
          <div
            key={w}
            className="flex-1 rounded-xl border border-white/10 bg-black/35 backdrop-blur-sm p-3 flex flex-col"
            style={{
              transform: i === 0 ? 'rotateY(18deg)' : i === 2 ? 'rotateY(-18deg)' : 'translateZ(12px)',
            }}
          >
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">Mur {w}</p>
            <p className="text-sm text-white mt-1">{pack?.name || packId} · 4 slots</p>
            <div className="mt-3 grid grid-cols-2 gap-1.5 flex-1">
              {[0, 1, 2, 3].map(s => (
                <div
                  key={s}
                  className="rounded-lg border border-white/10 bg-white/[0.04] min-h-[3.2rem] flex items-center justify-center text-[10px] text-zinc-600"
                >
                  œuvre {s + 1}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 bottom-3 w-[min(92%,20rem)] rounded-xl border border-white/15 bg-black/60 px-3 py-2 backdrop-blur">
        <p className="text-[11px] text-cyan-200/90">
          {pack?.icon} Moniteur {pack?.name} — clone rewards paper
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
          {metrics.map(m => (
            <span key={m.label} className="text-[10px] text-zinc-400">
              {m.label}: <span className="text-zinc-200">{m.value}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
