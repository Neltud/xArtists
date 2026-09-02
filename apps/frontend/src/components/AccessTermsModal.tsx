/**
 * Legal-honest Terms of Access — blocks checkout until accepted.
 * Model C: access pass only · paper trading · not a fund.
 */

type Props = {
  open: boolean
  packName: string
  priceEur: number
  onAccept: () => void
  onCancel: () => void
}

export default function AccessTermsModal({ open, packName, priceEur, onAccept, onCancel }: Props) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-labelledby="access-terms-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-[#12121a] p-5 shadow-xl">
        <h2 id="access-terms-title" className="text-lg font-bold text-amber-100">
          Terms of Access
        </h2>
        <p className="text-sm text-zinc-300 mt-3 leading-relaxed">
          You are purchasing an <strong className="text-white">access pass</strong> for{' '}
          <strong className="text-white">
            {packName} ({priceEur} €)
          </strong>
          . A membership NFT will be minted to your wallet after payment.
        </p>
        <ul className="mt-3 text-xs text-zinc-400 space-y-2 list-disc list-inside">
          <li>
            Trades shown are <strong className="text-amber-200/90">simulated (paper trading)</strong>{' '}
            based on LIA signals.
          </li>
          <li>
            <strong className="text-amber-200/90">No real funds</strong> are traded for this pack at
            this stage (Model C).
          </li>
          <li>This is <strong>not</strong> an investment product and not a managed fund.</li>
          <li>No guarantee of profit. Past paper results ≠ future results.</li>
        </ul>
        <p className="text-[11px] text-zinc-500 mt-3">
          FR — Vous achetez un pass d’accès (NFT). Les performances affichées sont simulées. Aucun
          fonds n’est tradé pour votre compte à ce stade.
        </p>
        <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button type="button" onClick={onCancel} className="btn-secondary text-sm">
            Cancel
          </button>
          <button type="button" onClick={onAccept} className="btn-primary text-sm">
            I understand — continue to payment
          </button>
        </div>
      </div>
    </div>
  )
}
