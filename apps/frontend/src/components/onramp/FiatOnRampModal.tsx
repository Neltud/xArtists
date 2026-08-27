import { useEffect, useState } from 'react'
import { MoonpayButton } from '../MoonpayButton'

type Step = 'ready' | 'paying' | 'verifying' | 'success'

export type FiatOnRampModalProps = {
  isOpen: boolean
  onClose: () => void
  intent?: string
  amount?: string
  asset?: string
  walletAddress?: string
}

/**
 * Fiat on-ramp modal (demo + MoonPay redirect).
 * Vite/MVX — no framer-motion. Real settlement = MoonPay hosted page.
 */
export default function FiatOnRampModal({
  isOpen,
  onClose,
  intent = '',
  amount = '50',
  asset = 'EGLD',
  walletAddress,
}: FiatOnRampModalProps) {
  const [step, setStep] = useState<Step>('ready')

  useEffect(() => {
    if (isOpen) setStep('ready')
  }, [isOpen])

  if (!isOpen) return null

  const simulateVerify = () => {
    setStep('verifying')
    window.setTimeout(() => setStep('success'), 1800)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onramp-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 shadow-2xl animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative h-20 bg-gradient-to-br from-cyan-500/20 to-purple-600/20 flex items-center justify-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 text-white/50 hover:text-white text-sm"
            aria-label="Fermer"
          >
            ✕
          </button>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-bold">
              Funding
            </p>
            <h2 id="onramp-title" className="text-lg font-bold text-white">
              On-Ramp Fiat → {asset}
            </h2>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {intent && (
            <p className="text-[11px] text-zinc-500 font-mono truncate">Intent: {intent}</p>
          )}

          <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm space-y-2">
            <div className="flex justify-between text-zinc-400">
              <span>Montant indicatif</span>
              <span className="text-white">{amount} USD</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Recevoir</span>
              <span className="text-cyan-400">{asset}</span>
            </div>
          </div>

          {step === 'ready' && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-500">
                Paiement réel via MoonPay (hosted). Simulation locale pour démo UI.
              </p>
              <MoonpayButton
                walletAddress={walletAddress}
                currencyCode={asset === '$TRO' || asset === 'TRO' ? 'EGLD' : asset}
                label={`Ouvrir MoonPay → ${asset}`}
                className="w-full"
              />
              <button type="button" className="btn-secondary w-full text-sm" onClick={simulateVerify}>
                Simuler paiement (demo)
              </button>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {(['Google Pay', 'Apple Pay', 'Card'] as const).map(label => (
                  <button
                    key={label}
                    type="button"
                    className="rounded-xl border border-white/10 bg-white/5 py-2 text-[10px] text-zinc-300 hover:bg-white/10"
                    onClick={simulateVerify}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'verifying' && (
            <div className="text-center py-8 space-y-3">
              <div className="w-10 h-10 mx-auto rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
              <p className="text-sm text-zinc-300 font-mono">Vérification…</p>
              <p className="text-[11px] text-zinc-500">Webhook / LIA orchestration (paper)</p>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8 space-y-3">
              <p className="text-3xl">✓</p>
              <h3 className="text-xl font-bold text-white">Succès (demo)</h3>
              <p className="text-sm text-zinc-400">
                En prod : livraison {asset} après webhook MoonPay signé.
              </p>
              <button type="button" className="btn-primary text-sm" onClick={onClose}>
                Fermer
              </button>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-black/30 text-center text-[10px] text-zinc-500 uppercase tracking-widest">
          MoonPay · MultiversX · pas de clé secrète en front
        </div>
      </div>
    </div>
  )
}
