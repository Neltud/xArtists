import {
  maySupportApplePay,
  maySupportGooglePay,
  type MoonpayPaymentMethod,
} from '../../lib/moonpay'

export type ExpressKind = 'apple' | 'google' | 'card' | 'moonpay'

const ITEMS: {
  kind: ExpressKind
  method?: MoonpayPaymentMethod
  label: string
  sub: string
  accent: string
}[] = [
  {
    kind: 'google',
    method: 'google_pay',
    label: 'Google Pay',
    sub: 'Chrome / Android · MoonPay',
    accent: 'border-blue-400/30 hover:bg-blue-500/10',
  },
  {
    kind: 'apple',
    method: 'apple_pay',
    label: 'Apple Pay',
    sub: 'Safari · MoonPay hosted',
    accent: 'border-white/20 hover:bg-white/10',
  },
  {
    kind: 'card',
    method: 'credit_debit_card',
    label: 'Carte bancaire',
    sub: 'via MoonPay',
    accent: 'border-white/10 hover:bg-white/10',
  },
  {
    kind: 'moonpay',
    label: 'MoonPay (tous moyens)',
    sub: 'Choix dans le widget',
    accent: 'border-purple-500/30 hover:bg-purple-500/10',
  },
]

export default function ExpressPaymentOptions({
  onSelect,
}: {
  onSelect: (kind: ExpressKind, method?: MoonpayPaymentMethod) => void
}) {
  const appleOk = maySupportApplePay()
  const googleOk = maySupportGooglePay()

  return (
    <div className="mt-2 space-y-2">
      <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-3 text-center">
        Express checkout
      </p>
      {ITEMS.map(it => {
        const hint =
          it.kind === 'apple' && !appleOk
            ? 'Surtout Safari / appareil Apple — MoonPay confirmera.'
            : it.kind === 'google' && !googleOk
              ? 'Surtout Chrome / Android — MoonPay confirmera.'
              : null
        return (
          <button
            key={it.kind}
            type="button"
            onClick={() => onSelect(it.kind, it.method)}
            className={`w-full flex items-center justify-between p-3 rounded-2xl border bg-white/5 transition-colors text-left ${it.accent}`}
          >
            <div>
              <p className="text-sm text-white font-medium flex items-center gap-2">
                {it.kind === 'google' && (
                  <span className="font-black text-blue-400" aria-hidden>
                    G
                  </span>
                )}
                {it.kind === 'apple' && <span aria-hidden></span>}
                {it.label}
              </p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{it.sub}</p>
              {hint && (
                <p className="text-[10px] text-amber-400/90 mt-0.5 normal-case tracking-normal">
                  {hint}
                </p>
              )}
            </div>
            <span className="text-cyan-400 text-xs font-mono shrink-0">Select</span>
          </button>
        )
      })}
    </div>
  )
}
