import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
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
        {xaRender("Connecte ton ")}<strong className="text-white">{xaRender("wallet utilisateur")}</strong> {xaRender(" (Web Wallet / extension) pour ")}{xaRender(action)}{xaRender(". Ne colle pas l’adresse protocole LIA.")}{xaRender(' ')}
        <button type="button" onClick={requestOpenConnect} className="text-purple-300 underline ml-1">
          {xaRender("Connect ")}</button>
      </div>
    )
  }
  if (isLiaOpsWallet(address)) {
    return (
      <div
        className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100"
        role="alert"
      >
        <strong>{xaRender("Wallet protocole LIA détecté")}</strong> {xaRender(" — interdit pour List / Buy / Bid / tip signé. Déconnecte et utilise ")}<em>{xaRender("ton")}</em> {xaRender(" wallet. ")}</div>
    )
  }
  if (method === 'paste_readonly') {
    return (
      <div
        className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100"
        role="status"
      >
        {xaRender("Session ")}<strong>{xaRender("lecture seule")}</strong> {xaRender(" (erd1 collé) — impossible de signer ")}{xaRender(action)}.{xaRender(' ')}
        <button type="button" onClick={requestOpenConnect} className="underline text-amber-50">
          {xaRender("Reconnecter Web Wallet / extension ")}</button>
      </div>
    )
  }
  return <>{xaRender(children)}</>
}
