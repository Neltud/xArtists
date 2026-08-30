/**
 * Visite guidée mondiale — stops from art_world_locations + LIA narration.
 * Cultural service (Tours) — not an agent pack.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadTourStops, type TourStop } from '../../lib/museumSpaces'
import LiaHost from './LiaHost'

export default function GuidedWorldTour() {
  const [stops, setStops] = useState<TourStop[]>([])
  const [i, setI] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let c = false
    ;(async () => {
      const rows = await loadTourStops()
      if (!c) {
        setStops(rows)
        setLoading(false)
      }
    })()
    return () => {
      c = true
    }
  }, [])

  const stop = stops[i]

  return (
    <div className="relative space-y-4">
      <div className="relative min-h-[280px] rounded-2xl border border-cyan-500/20 overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0a0e18] to-black">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, rgba(56,189,248,0.25), transparent 40%), radial-gradient(circle at 80% 70%, rgba(167,139,250,0.2), transparent 40%)',
          }}
        />
        <div className="relative z-[1] p-6 sm:p-8 flex flex-col justify-center min-h-[280px]">
          {loading && <p className="text-sm text-zinc-500">Chargement des destinations…</p>}
          {!loading && stop && (
            <>
              <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-300/80 font-semibold">
                Étape {i + 1} / {stops.length}
                {stop.region ? ` · ${stop.region}` : ''}
              </p>
              <h3 className="mt-2 text-3xl sm:text-4xl font-black text-white">
                {stop.city}
                <span className="text-zinc-500 font-semibold text-lg ml-2">{stop.country}</span>
              </h3>
              <p className="mt-2 text-zinc-300 max-w-lg leading-relaxed">{stop.focus}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  disabled={i <= 0}
                  onClick={() => setI(x => Math.max(0, x - 1))}
                >
                  ← Précédent
                </button>
                <button
                  type="button"
                  className="btn-primary text-xs"
                  disabled={i >= stops.length - 1}
                  onClick={() => setI(x => Math.min(stops.length - 1, x + 1))}
                >
                  Suivant →
                </button>
                <Link to="/tours" className="btn-secondary text-xs">
                  Carte mondiale Tours
                </Link>
              </div>
            </>
          )}
        </div>
        <LiaHost
          space="world_tour"
          lineExtra={
            stop
              ? `Nous sommes à ${stop.city}. Focus : ${stop.focus}. Ouvre la carte Tours pour les expos en cours.`
              : null
          }
        />
      </div>

      {!loading && stops.length > 0 && (
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
          {stops.slice(0, 48).map((s, idx) => (
            <button
              key={s.id + idx}
              type="button"
              onClick={() => setI(idx)}
              className={`rounded-full border px-2.5 py-1 text-[10px] transition-colors ${
                idx === i
                  ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-100'
                  : 'border-white/10 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {s.city}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
