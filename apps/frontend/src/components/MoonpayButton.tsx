import { useState } from 'react'
import {
  openMoonpayBuy,
  type MoonpayPaymentMethod,
  isMoonpayLive,
  MOONPAY_DEFAULT_WALLET,
} from '../lib/moonpay'

interface MoonpayButtonProps {
  walletAddress?: string
  currencyCode?: string
  label?: string
  className?: string
  /** Pre-select Apple Pay / Google Pay / card in MoonPay widget */
  paymentMethod?: MoonpayPaymentMethod
  baseCurrencyAmount?: string | number
}

/**
 * MoonPay hosted on-ramp (EGLD / crypto).
 * Apple Pay: pass paymentMethod="apple_pay" — works best in Safari; not in iframe.
 */
export const MoonpayButton: React.FC<MoonpayButtonProps> = ({
  walletAddress = MOONPAY_DEFAULT_WALLET,
  currencyCode = 'EGLD',
  label,
  className = '',
  paymentMethod,
  baseCurrencyAmount,
}) => {
  const [opening, setOpening] = useState(false)
  const live = isMoonpayLive()

  const defaultLabel =
    paymentMethod === 'apple_pay'
      ? 'Apple Pay (MoonPay)'
      : paymentMethod === 'google_pay'
        ? 'Google Pay (MoonPay)'
        : paymentMethod === 'credit_debit_card'
          ? 'Carte (MoonPay)'
          : `Acheter ${currencyCode} avec MoonPay`

  const handleBuy = () => {
    setOpening(true)
    openMoonpayBuy({
      walletAddress,
      currencyCode,
      paymentMethod,
      baseCurrencyAmount,
    })
    setTimeout(() => setOpening(false), 1200)
  }

  return (
    <button
      type="button"
      onClick={handleBuy}
      disabled={opening}
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
          {paymentMethod === 'apple_pay' ? '' : '💳'} {label || defaultLabel}
          {!live && (
            <span className="text-[10px] font-normal opacity-80 ml-1">(staging)</span>
          )}
        </>
      )}
    </button>
  )
}

export default MoonpayButton
