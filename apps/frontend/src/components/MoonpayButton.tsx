import { useState } from 'react'
import {
  openMoonpayBuy,
  type MoonpayPaymentMethod,
  isMoonpayLive,
  MOONPAY_DEFAULT_WALLET,
  isMoonPayConfigured,
} from '../lib/moonpay'

interface MoonpayButtonProps {
  walletAddress?: string
  currencyCode?: string
  label?: string
  className?: string
  paymentMethod?: MoonpayPaymentMethod
  baseCurrencyAmount?: string | number
}

export const MoonpayButton: React.FC<MoonpayButtonProps> = ({
  walletAddress = MOONPAY_DEFAULT_WALLET,
  currencyCode = 'EGLD',
  label,
  className = '',
  paymentMethod,
  baseCurrencyAmount,
}) => {
  const [opening, setOpening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const live = isMoonpayLive()

  const defaultLabel =
    paymentMethod === 'apple_pay'
      ? 'Apple Pay (MoonPay)'
      : paymentMethod === 'google_pay'
        ? 'Google Pay (MoonPay)'
        : paymentMethod === 'credit_debit_card'
          ? 'Carte (MoonPay)'
          : `Acheter ${currencyCode} avec MoonPay`

  const handleBuy = async () => {
    setOpening(true)
    setError(null)
    const result = await openMoonpayBuy({
      walletAddress,
      currencyCode,
      paymentMethod,
      baseCurrencyAmount,
    })
    if (!result.ok) setError(result.error || 'Achat par carte indisponible.')
    setOpening(false)
  }

  return (
    <div>
    <button
      type="button"
      onClick={() => void handleBuy()}
      disabled={opening || !isMoonPayConfigured()}
      className={
        className ||
        `bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-60 text-white px-5 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20`
      }
    >
      {opening ? (
        <>
          <span className="w-4 h-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
          Redirection…
        </>
      ) : (
        <>
          {paymentMethod === 'google_pay'
            ? 'G'
            : paymentMethod === 'apple_pay'
              ? ''
              : '💳'}{' '}
          {label || defaultLabel}
          {!live && (
            <span className="text-[10px] font-normal opacity-80 ml-1">(staging)</span>
          )}
        </>
      )}
    </button>
    {error && <p role="alert" className="mt-2 text-xs text-amber-300">{error}</p>}
    {!isMoonPayConfigured() && <p className="mt-2 text-xs text-zinc-400">Achat par carte indisponible pour le moment.</p>}
    </div>
  )
}

export default MoonpayButton
