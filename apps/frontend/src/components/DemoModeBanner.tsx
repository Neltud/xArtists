import { Link } from 'react-router-dom'
import { DEMO_MODE } from '../config/demoMode'
import { isSupernovaLive, supernovaBannerText } from '../config/supernova'

export default function DemoModeBanner() {
  const sn = supernovaBannerText()
  const live = isSupernovaLive()
  if (!DEMO_MODE && !sn) return null

  return (
    <div className="border-b border-white/[0.05] bg-black/50 backdrop-blur-md" role="status">
      <div className="page-wrap py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-zinc-500">
          {DEMO_MODE && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400/90 animate-pulse" aria-hidden />
              <span className="text-zinc-400">Paper</span>
            </span>
          )}
          {sn && <span className={live ? 'text-cyan-400/80' : 'text-amber-500/70'}>{sn}</span>}
        </div>
        {DEMO_MODE && (
          <Link to="/agents" className="text-zinc-500 hover:text-white transition-colors duration-300">
            Packs →
          </Link>
        )}
      </div>
    </div>
  )
}
