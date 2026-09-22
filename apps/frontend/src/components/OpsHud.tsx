import { useEffect, useState } from 'react'

type Lights = { paper: boolean; signal: 'BUY' | 'SELL' | 'WAIT'; breaker: boolean; supernova: boolean }

export default function OpsHud() {
  const [lights, setLights] = useState<Lights>({
    paper: true,
    signal: 'WAIT',
    breaker: false,
    supernova: true,
  })
  useEffect(() => {
    const id = window.setInterval(() => {
      const r = Math.random()
      setLights(prev => ({
        ...prev,
        signal: r > 0.62 ? 'BUY' : r > 0.28 ? 'SELL' : 'WAIT',
        breaker: r > 0.97,
      }))
    }, 3200)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <Light label="PAPER" on={lights.paper} color="violet" pulse />
      <Light
        label={lights.signal}
        on
        color={lights.signal === 'BUY' ? 'emerald' : lights.signal === 'SELL' ? 'rose' : 'zinc'}
        pulse={lights.signal !== 'WAIT'}
      />
      <Light label="BREAKER" on={lights.breaker} color="amber" pulse={lights.breaker} />
      <Light label="SUPERNOVA" on={lights.supernova} color="cyan" />
    </div>
  )
}

function Light({
  label, on, color, pulse,
}: {
  label: string
  on: boolean
  color: 'violet' | 'emerald' | 'rose' | 'amber' | 'cyan' | 'zinc'
  pulse?: boolean
}) {
  const map: Record<string, string> = {
    violet: 'bg-violet-400 shadow-violet-400/80',
    emerald: 'bg-emerald-400 shadow-emerald-400/80',
    rose: 'bg-rose-400 shadow-rose-400/80',
    amber: 'bg-amber-400 shadow-amber-400/80',
    cyan: 'bg-cyan-400 shadow-cyan-400/80',
    zinc: 'bg-zinc-500 shadow-zinc-500/50',
  }
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2.5 py-1">
      <span
        className={`h-2 w-2 rounded-full ${on ? map[color] : 'bg-zinc-700'} ${
          on && pulse ? 'animate-pulse' : ''
        } ${on ? 'shadow-[0_0_8px]' : ''}`}
        aria-hidden
      />
      <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">{label}</span>
    </div>
  )
}
