/**
 * Access terms — pack purchase disclaimer (paper trading).
 */
type Props = {
  open: boolean
  packLabel: string
  onAccept: () => void
  onCancel: () => void
}

export default function AccessTermsModal({ open, packLabel, onAccept, onCancel }: Props) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-labelledby="access-terms-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-purple-500/30 bg-black/85 backdrop-blur-md p-5 shadow-2xl">
        <h2 id="access-terms-title" className="text-lg font-bold text-amber-100">
          Access terms
        </h2>
        <p className="text-sm text-zinc-300 mt-3 leading-relaxed">
          You are purchasing an <strong className="text-white">access pass</strong> for{' '}
          <strong className="text-white">{packLabel}</strong>.
        </p>
        <ul className="mt-3 text-xs text-zinc-400 space-y-2 list-disc list-inside">
          <li>
            Trades shown are <strong className="text-amber-200/90">simulated (paper trading)</strong>{' '}
            unless GO_LIVE is enabled on-chain.
          </li>
          <li>
            <strong className="text-amber-200/90">No real funds</strong> are traded for this pack at
            this stage of the product.
          </li>
        </ul>
        <p className="text-[11px] text-zinc-500 mt-3">
          By continuing you acknowledge these terms.
        </p>
        <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button type="button" onClick={onCancel} className="btn-secondary text-sm min-h-[44px] min-w-[44px]">
            Cancel
          </button>
          <button type="button" onClick={onAccept} className="btn-primary text-sm min-h-[44px]">
            Accept & continue
          </button>
        </div>
      </div>
    </div>
  )
}
