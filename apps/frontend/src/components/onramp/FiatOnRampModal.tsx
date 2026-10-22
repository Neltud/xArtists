import { useEffect, useState } from 'react'
import { useWallet } from '../../context/WalletContext'
import {
  openMoonpayBuy,
  isMoonPayConfigured,
  maySupportApplePay,
  maySupportGooglePay,
  MOONPAY_DEFAULT_WALLET,
  type MoonpayPaymentMethod,
} from '../../lib/moonpay'
import ExpressPaymentOptions, { type ExpressKind } from './ExpressPaymentOptions'
import MoonpayButton from '../MoonpayButton'

type Step = 'ready' | 'redirecting'

export type FiatOnRampModalProps = {
  isOpen: boolean
  onClose: () => void
  intent?: string
  amount?: string
  asset?: string
  walletAddress?: string
}

/** Fiat on-ramp — Google Pay + Apple Pay + card via MoonPay hosted. */
export default function FiatOnRampModal({
  isOpen,
  onClose,
  intent = '',
  amount = '50',
  asset = 'EGLD',
  walletAddress,
}: FiatOnRampModalProps) {
  const { address, connected } = useWallet()
  const [step, setStep] = useState<Step>('ready')
  const [error, setError] = useState<string | null>(null)

  const recipient =
    walletAddress?.startsWith('erd1')
      ? walletAddress
      : connected && address?.startsWith('erd1')
        ? address
        : MOONPAY_DEFAULT_WALLET

  const currency =
    asset === '$TRO' || asset === 'TRO' ? 'EGLD' : asset || 'EGLD'

  useEffect(() => {
    if (isOpen) { setStep('ready'); setError(null) }
  }, [isOpen])

  if (!isOpen) return null

  const launch = async (method?: MoonpayPaymentMethod) => {
    setStep('redirecting')
    setError(null)
    const result = await openMoonpayBuy({
      walletAddress: recipient,
      currencyCode: currency,
      paymentMethod: method,
      baseCurrencyAmount: amount,
      baseCurrencyCode: 'usd',
    })
    if (!result.ok) setError(result.error || 'Achat par carte indisponible.')
    setStep('ready')
  }

  const onExpress = (kind: ExpressKind, method?: MoonpayPaymentMethod) => {
    if (kind === 'moonpay') {
      void launch(undefined)
      return
    }
    void launch(method)
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
        <div className="relative h-20 bg-gradient-to-br from-blue-500/15 via-zinc-100/5 to-purple-600/20 flex items-center justify-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 text-white/50 hover:text-white text-sm"
            aria-label="Fermer"
          >
            ✕
          </button>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-300 font-bold">
              Google Pay · Apple Pay · Card
            </p>
            <h2 id="onramp-title" className="text-lg font-bold text-white">
              On-Ramp → {currency}
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
              <span className="text-cyan-400">{currency}</span>
            </div>
            <div className="flex justify-between text-zinc-400 text-[11px]">
              <span>Wallet</span>
              <span className="text-zinc-300 font-mono truncate max-w-[12rem]" title={recipient}>
                {recipient.slice(0, 8)}…{recipient.slice(-6)}
              </span>
            </div>
            {!connected && (
              <p className="text-[10px] text-amber-300/90">
                Connecte ton wallet ou renseigne et vérifie ton adresse dans MoonPay.
              </p>
            )}
          </div>

          {error && <p role="alert" className="text-sm text-amber-300">{error}</p>}

          {step === 'ready' && (
            <>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => void launch('google_pay')}
                  disabled={!isMoonPayConfigured()}
                  className="w-full py-3.5 rounded-2xl bg-white text-zinc-900 font-semibold flex items-center justify-center gap-2 hover:bg-zinc-100 transition-colors border border-white/10"
                >
                  <span
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white border border-zinc-200 text-[11px] font-black text-[#4285F4]"
                    aria-hidden
                  >
                    G
                  </span>
                  Payer avec Google Pay
                </button>
                {maySupportGooglePay() ? (
                  <p className="text-[10px] text-emerald-400/90 text-center">
                    Navigateur compatible détecté — finalisation dans MoonPay.
                  </p>
                ) : (
                  <p className="text-[10px] text-zinc-500 text-center">
                    Google Pay : Chrome / Android + moyen de paiement Google.
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => void launch('apple_pay')}
                  disabled={!isMoonPayConfigured()}
                  className="w-full py-3.5 rounded-2xl bg-black border border-white/20 text-white font-semibold flex items-center justify-center gap-2 hover:bg-zinc-900 transition-colors"
                >
                  <span className="text-lg" aria-hidden>
                    
                  </span>
                  Payer avec Apple Pay
                </button>
                {maySupportApplePay() ? (
                  <p className="text-[10px] text-emerald-400/90 text-center">
                    Appareil compatible — Safari recommandé.
                  </p>
                ) : (
                  <p className="text-[10px] text-zinc-500 text-center">
                    Apple Pay web : Safari + carte dans Apple Wallet.
                  </p>
                )}
              </div>

              <ExpressPaymentOptions onSelect={onExpress} />

              <MoonpayButton
                walletAddress={recipient}
                currencyCode={currency}
                baseCurrencyAmount={amount}
                paymentMethod="credit_debit_card"
                label="Payer par carte (MoonPay)"
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              />

              <MoonpayButton
                walletAddress={recipient}
                currencyCode={currency}
                baseCurrencyAmount={amount}
                label="Ouvrir MoonPay (tous moyens)"
                className="w-full btn-secondary text-sm py-3"
              />

            </>
          )}

          {step === 'redirecting' && (
            <div className="text-center py-8 space-y-3">
              <div className="w-10 h-10 mx-auto rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
              <p className="text-sm text-zinc-300">Ouverture de MoonPay…</p>
              <p className="text-[11px] text-zinc-500">
                Vérification du lien de paiement…
              </p>
            </div>
          )}

        </div>

        <div className="px-6 py-3 bg-black/30 text-center text-[10px] text-zinc-500 uppercase tracking-widest">
          Moyens de paiement proposés selon ton pays et ton éligibilité dans MoonPay
        </div>
      </div>
    </div>
  )
}
