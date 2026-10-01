/** Trois salles distinctes — Pulse vert néon, Yield or, Sentinel bleu glace. */
import type { PackId } from '../config/agentPacks'
import { AGENT_PACKS } from '../config/agentPacks'

const ROOM: Record<
  PackId,
  { sky: string; fog: string; accent: string; mood: string }
> = {
  pulse: {
    sky: 'from-emerald-950 via-[#04110c] to-black',
    fog: 'rgba(16,185,129,0.35)',
    accent: 'border-emerald-400/30',
    mood: 'Salle Pulse — signaux rapides',
  },
  yield: {
    sky: 'from-amber-950 via-[#120e04] to-black',
    fog: 'rgba(245,158,11,0.28)',
    accent: 'border-amber-400/30',
    mood: 'Salle Yield — compound calme',
  },
  sentinel: {
    sky: 'from-sky-950 via-[#040816] to-black',
    fog: 'rgba(56,189,248,0.32)',
    accent: 'border-sky-400/30',
    mood: 'Salle Sentinel — veille',
  },
}

export default function PackRoomHolo({ packId }: { packId: PackId }) {
  const pack = AGENT_PACKS.find(p => p?.id === packId)
  const room = ROOM[packId] || ROOM.pulse

  return (
    <div className={`relative w-full h-[min(56vh,460px)] rounded-2xl overflow-hidden border ${room.accent} bg-gradient-to-b ${room.sky}`}>
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(ellipse at 50% 70%, ${room.fog}, transparent 60%)` }}
      />
      <div className="absolute inset-4 grid grid-cols-3 gap-2">
        {['Gauche', 'Fond', 'Droite'].map(wall => (
          <div key={wall} className={`rounded-xl border ${room.accent} bg-black/25 p-2 flex flex-col`}>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">{wall}</p>
            <div className="mt-2 grid grid-cols-2 gap-1.5 flex-1">
              {[1, 2, 3, 4].map(n => (
                <div
                  key={n}
                  className="rounded-lg bg-white/[0.04] border border-white/10 min-h-[3rem] flex items-center justify-center text-[10px] text-zinc-600"
                >
                  {n}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[min(92%,22rem)] rounded-xl border border-white/10 bg-black/55 px-3 py-2">
        <p className="text-[12px] text-white">
          {pack?.icon} {room.mood}
        </p>
        <p className="text-[10px] text-zinc-500 mt-0.5">Moniteur clone · paper · 4 œuvres / mur</p>
      </div>
    </div>
  )
}
