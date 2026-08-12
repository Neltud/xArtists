import type { ReactNode } from 'react'
import { isLiaOpsWallet } from '../config/scStatus'
import { useWallet } from '../context/WalletContext'
import { requestOpenConnect } from '../lib/walletEvents'

type Props = {
  address?: string | null
  children: ReactNode
  /** Action label for copy */
  action?: string
}

/**
 * Blocks List/Buy/Bid when session is LIA protocol, missing, or paste_readonly.
 */
export default function UserWalletGuard({ address, children, action = 'signer' }: Props) {
  const { method } = useWallet()

  if (!address) {
    return (
      <div className="rounded-xl border border-[#2a2a3a] bg-[#15151f] p-4 text-sm text-gray-400">
        Connecte ton <strong className="text-white">wallet utilisateur</strong> (Web Wallet /
        extension) pour {action}. Ne colle pas l’adresse protocole LIA.{' '}
        <button type="button" onClick={requestOpenConnect} className="text-purple-300 underline ml-1">
          Connect
        </button>
      </div>
    )
  }
  if (isLiaOpsWallet(address)) {
    return (
      <div
        className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100"
        role="alert"
      >
        <strong>Wallet protocole LIA détecté</strong> — interdit pour List / Buy / Bid / tip signé.
        Déconnecte et utilise <em>ton</em> wallet.
      </div>
    )
  }
  if (method === 'paste_readonly') {
    return (
      <div
        className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100"
        role="status"
      >
        Session <strong>lecture seule</strong> (erd1 collé) — impossible de signer {action}.{' '}
        <button type="button" onClick={requestOpenConnect} className="underline text-amber-50">
          Reconnecter Web Wallet / extension
        </button>
      </div>
    )
  }
  return <>{children}</>
}
