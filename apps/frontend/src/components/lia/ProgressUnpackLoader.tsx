/** Loader WebGL — pourcentage pour éviter l’écran noir au boot. */

type Props = {
  progress: number
  label?: string
}

export function ProgressUnpackLoader({ progress, label }: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(progress)))
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/90 backdrop-blur-md">
      <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-300/80 font-tech">
        LIA Hub · Control Room
      </p>
      <p className="text-sm text-zinc-300">
        {label || 'Initialisation de l’infrastructure xArtists…'}
      </p>
      <div className="h-1.5 w-48 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-[width] duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="tabular-nums text-xs text-zinc-500">{pct}%</p>
    </div>
  )
}

export default ProgressUnpackLoader
