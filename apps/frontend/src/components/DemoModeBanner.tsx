import { Link } from 'react-router-dom'
import { DEMO_MODE } from '../config/demoMode'
import { isSupernovaLive, supernovaBannerText } from '../config/supernova'

/** Une ligne : paper + Supernova. */
export default function DemoModeBanner() {
  const sn = supernovaBannerText()
  const live = isSupernovaLive()
  if (!DEMO_MODE && !sn) return null

  return (
    <div className="border-b border-white/[0.06] bg-zinc-950/90" role="status">
      <div className="page-wrap py-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-zinc-500">
          {DEMO_MODE && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400/90" aria-hidden />
              <span className="text-zinc-400">Démo paper</span>
            </span>
          )}
          {sn && (
            <span className={live ? 'text-cyan-500/80' : 'text-amber-500/75'}>
              {sn}
            </span>
          )}
        </div>
        {DEMO_MODE && (
          <Link
            to="/agents"
            className="text-zinc-500 hover:text-white transition-colors"
          >
            Packs →
          </Link>
        )}
      </div>
    </div>
  )
}
