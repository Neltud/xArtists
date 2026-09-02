/**
 * Portal Dashboard ↔ Museum (CSS transition — no Framer/Three required).
 */
import { Link } from 'react-router-dom'

export default function Lia3DBridge({
  className = '',
}: {
  className?: string
}) {
  return (
    <Link
      to="/museum"
      className={`group relative block overflow-hidden rounded-2xl border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-950/40 via-black to-cyan-950/30 p-4 sm:p-5 transition-all hover:border-fuchsia-400/50 hover:shadow-[0_0_40px_rgba(217,70,239,0.15)] ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40 group-hover:opacity-70 transition-opacity"
        style={{
          background:
            'radial-gradient(ellipse at 30% 20%, rgba(217,70,239,0.25), transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(34,211,238,0.15), transparent 45%)',
        }}
      />
      <div className="relative z-[1] flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-fuchsia-300/90 font-semibold">
            LIA 3D Bridge
          </p>
          <p className="text-lg font-bold text-white mt-0.5">Entrer dans le Musée</p>
          <p className="text-xs text-zinc-400 mt-1 max-w-md">
            Catzligue · Mydee · visite guidée mondiale. VR Core = roadmap (LIA Pass).
          </p>
        </div>
        <span className="btn-primary text-xs shrink-0 group-hover:scale-105 transition-transform">
          Portal →
        </span>
      </div>
    </Link>
  )
}
