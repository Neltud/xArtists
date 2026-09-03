import { DEMO_MODE } from '../config/demoMode'

/** Une ligne discrète — pas de checklist technique. */
export default function DemoModeBanner() {
  if (!DEMO_MODE) return null
  return (
    <div className="border-b border-white/[0.05] bg-black/40" role="status">
      <div className="page-wrap py-1.5 text-[11px] text-zinc-600 tracking-wide">
        Démo · mode paper
      </div>
    </div>
  )
}
