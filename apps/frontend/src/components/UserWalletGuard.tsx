import type { ReactNode } from 'react'
import { isLiaOpsWallet } from '../config/scStatus'

type Props = {
  address?: string | null
  children: ReactNode
  /** Action label for copy */
  action?: string
}

/**
 * Blocks List/Buy/Bid when session is LIA protocol wallet or missing.
 * Manual erd1 paste of LIA ops is also rejected.
 */
export default function UserWalletGuard({ address, children, action = 'signer' }: Props) {
  if (!address) {
    return (
      <div className="rounded-xl border border-[#2a2a3a] bg-[#15151f] p-4 text-sm text-gray-400">
        Connecte ton <strong className="text-white">wallet utilisateur</strong> (Web Wallet /
        extension) pour {action}. Ne colle pas l’adresse protocole LIA.
      </div>
    )
  }
  if (isLiaOpsWallet(address)) {
    return (
      <div
        className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100"
        role="alert"
      >
        <strong>Wallet protocole LIA détecté</strong> — interdit pour List / Buy / Bid. Déconnecte et
        utilise <em>ton</em> wallet (collectionneur / artiste). LIA Ops = exécution backend uniquement.
      </div>
    )
  }
  return <>{children}</>
}
