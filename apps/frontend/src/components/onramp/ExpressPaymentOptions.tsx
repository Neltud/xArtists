/** Express checkout options — opens FiatOnRamp or parent handler. */

export type ExpressKind = 'google' | 'apple' | 'card' | 'moonpay'

export default function ExpressPaymentOptions({
  onSelect,
}: {
  onSelect: (kind: ExpressKind) => void
}) {
  const items: { kind: ExpressKind; label: string; sub: string }[] = [
    { kind: 'moonpay', label: 'MoonPay', sub: 'EGLD / cards' },
    { kind: 'google', label: 'Google Pay', sub: 'via MoonPay' },
    { kind: 'apple', label: 'Apple Pay', sub: 'via MoonPay' },
    { kind: 'card', label: 'Debit / Credit', sub: 'via MoonPay' },
  ]

  return (
    <div className="mt-4 space-y-2">
      <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-3 text-center">
        Express checkout
      </p>
      {items.map(it => (
        <button
          key={it.kind}
          type="button"
          onClick={() => onSelect(it.kind)}
          className="w-full flex items-center justify-between p-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left"
        >
          <div>
            <p className="text-sm text-white font-medium">{it.label}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{it.sub}</p>
          </div>
          <span className="text-cyan-400 text-xs font-mono">Select</span>
        </button>
      ))}
    </div>
  )
}
