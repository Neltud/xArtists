/**
 * Badge B2B — moteur d'exécution / données Finance Computer.
 */
export default function FinanceComputerBadge({
  className = '',
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-violet-400/35 bg-violet-500/10 px-2.5 py-1 text-[10px] font-tech uppercase tracking-wide text-violet-100/90 ${className}`}
      title="Routage & métriques liquidité via Finance Computer API"
    >
      <span
        className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,0.8)]"
        aria-hidden
      />
      {compact ? 'Finance Computer' : 'Powered by Finance Computer API'}
    </span>
  )
}
