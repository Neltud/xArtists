import { PRE_MAINNET_DISCLAIMER, type PreMainnetModule } from '../config/preMainnet'

export default function PreMainnetBanner({
  module,
  className = '',
}: {
  module?: PreMainnetModule
  className?: string
}) {
  const status = module?.status ?? 'pre-mainnet'
  const title =
    status === 'shell'
      ? 'SHELL · PRE-MAINNET'
      : status === 'testnet-only'
        ? 'TESTNET ONLY'
        : 'PRE-MAINNET'

  return (
    <div
      className={`rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-amber-100 text-sm ${className}`}
      role="status"
    >
      <p className="font-semibold tracking-wide text-amber-200">{title}</p>
      {module && <p className="mt-1 text-amber-100/90">{module.blurb}</p>}
      <p className="mt-2 text-[11px] leading-relaxed text-amber-200/80">{PRE_MAINNET_DISCLAIMER}</p>
    </div>
  )
}
