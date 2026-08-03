import { useWallet } from '../context/WalletContext'

/**
 * Surfaces signing gaps so users don't think Buy/List succeeded.
 */
export default function TxCapabilityBanner() {
  const { connected, provider } = useWallet() as {
    connected: boolean
    provider?: string
  }

  const hasSend =
    typeof window !== 'undefined' &&
    typeof (window as unknown as { __xartistsSendTx?: unknown }).__xartistsSendTx ===
      'function'

  if (!connected) {
    return (
      <div className="mb-4 rounded-xl border border-[#2a2a3a] bg-[#15151f] px-3 py-2 text-xs text-gray-400">
        Connecte ton wallet pour List / Buy / Bid. Ne jamais utiliser l’adresse protocole LIA.
      </div>
    )
  }

  if (provider === 'web_wallet' || provider === 'manual') {
    return (
      <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
        Session adresse seule ou Web Wallet partiel — la signature on-chain nécessite xPortal / extension
        avec sdk-dapp (<code>__xartistsSendTx</code>
        {hasSend ? ' ✅' : ' ❌ non injecté'}).
      </div>
    )
  }

  if (!hasSend) {
    return (
      <div className="mb-4 rounded-xl border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-xs text-orange-200">
        Wallet connecté mais <strong>sdk-dapp send non branché</strong> — les TX List/Buy/Bid resteront en
        erreur jusqu’au bootstrap P0.
      </div>
    )
  }

  return (
    <div className="mb-4 rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-300">
      Signature prête (sdk-dapp).
    </div>
  )
}
