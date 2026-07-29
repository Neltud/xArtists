import { useState } from 'react'

/**
 * MoonpayButton — fiat on-ramp to buy EGLD via Moonpay.
 *
 * Redirects to the Moonpay hosted buy page with the recipient wallet address
 * and currency (EGLD) pre-filled. The public API key is read from
 * `VITE_MOONPAY_PUBLIC_KEY` (configure in your .env) and falls back to
 * Moonpay's sandbox/staging URL when no key is set so the flow is still
 * demoable. Wire a real key before production use.
 *
 * Usage:
 *   <MoonpayButton />                         // uses LIA wallet + EGLD default
 *   <MoonpayButton walletAddress="erd1..." /> // custom recipient
 *   <MoonpayButton currencyCode="USDC-c76f1f" />
 */

const DEFAULT_WALLET = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'

interface MoonpayButtonProps {
  walletAddress?: string
  currencyCode?: string
  label?: string
  className?: string
}

export const MoonpayButton: React.FC<MoonpayButtonProps> = ({
  walletAddress = DEFAULT_WALLET,
  currencyCode = 'EGLD',
  label = 'Acheter EGLD avec Moonpay',
  className = '',
}) => {
  const [opening, setOpening] = useState(false)

  const handleBuy = () => {
    setOpening(true)
    const publicKey = import.meta.env.VITE_MOONPAY_PUBLIC_KEY as string | undefined
    const isLive = Boolean(publicKey)
    const base = isLive
      ? 'https://buy.moonpay.com'
      : 'https://buy-staging.moonpay.com'

    const params = new URLSearchParams({
      apiKey: publicKey || 'pk_test_123', // sandbox placeholder
      currencyCode,
      walletAddress,
      // EGLD lives on MultiversX
      ...(currencyCode.toUpperCase() === 'EGLD' ? { chain: 'multiversx' } : {}),
    })

    const url = `${base}/?${params.toString()}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setTimeout(() => setOpening(false), 1200)
  }

  return (
    <button
      onClick={handleBuy}
      disabled={opening}
      className={`bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-60 text-white px-5 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 ${className}`}
    >
      {opening ? (
        <>
          <span className="w-4 h-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
          Redirection…
        </>
      ) : (
        <>💳 {label}</>
      )}
    </button>
  )
}

export default MoonpayButton
