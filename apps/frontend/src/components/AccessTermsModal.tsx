import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/**
 * Access terms — pack purchase disclaimer (paper trading).
 * Shell tokens: acid accent, graphite surface.
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
      <div className="w-full max-w-md rounded-2xl border border-[color:var(--xa-border-strong)] bg-[color:var(--xa-bg-elevated)] backdrop-blur-md p-5 shadow-2xl">
        <h2 id="access-terms-title" className="text-lg font-bold text-[color:var(--xa-text)]">
          {xaRender("Access terms ")}</h2>
        <p className="text-sm text-[color:var(--xa-text-secondary)] mt-3 leading-relaxed">
          {xaRender("You are purchasing an ")}<strong className="text-[color:var(--xa-text)]">{xaRender("access pass")}</strong> {xaRender(" for")}{xaRender(' ')}
          <strong className="text-[color:var(--xa-accent)]">{xaRender(packLabel)}</strong>.
        </p>
        <ul className="mt-3 text-xs text-[color:var(--xa-text-muted)] space-y-2 list-disc list-inside">
          <li>
            {xaRender("Trades shown are ")}<strong className="text-[color:var(--xa-accent)]">{xaRender("simulated (paper trading)")}</strong>{xaRender(' ')}
            {xaRender("unless GO_LIVE is enabled on-chain. ")}</li>
          <li>
            <strong className="text-[color:var(--xa-accent)]">{xaRender("No real funds")}</strong> {xaRender(" are traded for this pack at this stage of the product. ")}</li>
        </ul>
        <p className="text-[11px] text-[color:var(--xa-text-muted)] mt-3">
          {xaRender("By continuing you acknowledge these terms. ")}</p>
        <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button type="button" onClick={onCancel} className="btn-secondary text-sm min-h-[44px] min-w-[44px]">
            {xaRender("Cancel ")}</button>
          <button type="button" onClick={onAccept} className="btn-primary text-sm min-h-[44px]">
            {xaRender("Accept & continue ")}</button>
        </div>
      </div>
    </div>
  )
}
