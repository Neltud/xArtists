import { DEMO_MODE } from '../config/demoMode'
import { supernovaBannerText } from '../config/supernova'

/** Une ligne discrète — paper + fenêtre Supernova. */
export default function DemoModeBanner() {
  const sn = supernovaBannerText()
  if (!DEMO_MODE && !sn) return null
  return (
    <div className="border-b border-white/[0.05] bg-black/40" role="status">
      <div className="page-wrap py-1.5 text-[11px] text-zinc-600 tracking-wide flex flex-wrap gap-x-3 gap-y-0.5">
        {DEMO_MODE && <span>Démo · mode paper</span>}
        {sn && <span className="text-amber-500/80">{sn}</span>}
      </div>
    </div>
  )
}
