/** CTA on-ramp EGLD via MoonPay */
import { useState } from 'react'
import { useWallet } from '../context/WalletContext'
import { isMoonPayConfigured, moonpayStatusHint, openMoonPayBuy } from '../lib/moonpay'
import { useToast } from './ui/Toast'

type Props = {
  amountEur?: number
  className?: string
  label?: string
}

export default function MoonPayBuyButton({ amountEur = 50, className = '', label }: Props) {
  const { address, connected } = useWallet()
  const { push } = useToast()
  const [busy, setBusy] = useState(false)
  const on = isMoonPayConfigured()

  const onClick = async () => {
    setBusy(true)
    try {
      const r = await openMoonPayBuy({
        walletAddress: connected && address?.startsWith('erd1') ? address : undefined,
        baseCurrencyAmount: amountEur,
        baseCurrencyCode: 'eur',
        currencyCode: 'egld',
        redirectURL:
          typeof window !== 'undefined'
            ? `${window.location.origin}${window.location.pathname}#/wallet?moonpay=done`
            : undefined,
      })
      if (!r.ok) push(r.error || 'MoonPay indisponible', 'err')
      else push('MoonPay ouvert — finalise l’achat EGLD', 'info')
    } finally {
      setBusy(false)
    }
  }

  if (!on) {
    return (
      <p className="text-[11px] text-zinc-600">
        MoonPay : configure <code className="text-[10px]">VITE_MOONPAY_API_KEY</code> (secrets Pages).
      </p>
    )
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={busy}
        onClick={() => void onClick()}
        className={className || 'btn-primary text-sm'}
      >
        {busy ? '…' : label || `Acheter EGLD · MoonPay (~${amountEur} €)`}
      </button>
      <p className="text-[10px] text-zinc-500">
        Carte / Apple Pay · {moonpayStatusHint()} · fonds vers ton wallet MultiversX
      </p>
    </div>
  )
}
