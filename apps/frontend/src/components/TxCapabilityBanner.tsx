import { useWallet } from '../context/WalletContext'
import { canSignOnChain, hasSendTxInjected, signBlockReason } from '../lib/txCapability'

/** Surfaces signing gaps so users don't think Buy/List succeeded. */
export default function TxCapabilityBanner() {
  const { connected, method } = useWallet()
  const hasSend = hasSendTxInjected()
  const canSign = canSignOnChain(method)
  const reason = signBlockReason(method)

  if (!connected) {
    return (
      <div className="mb-4 rounded-xl border border-[#2a2a3a] bg-[#15151f] px-3 py-2 text-xs text-gray-400">
        Connecte <strong className="text-white">xPortal / DeFi Wallet / Web Wallet</strong> pour List /
        Buy / Bid. Ne jamais coller l’adresse protocole LIA. Coller erd1 = lecture seule.
      </div>
    )
  }

  if (method === 'paste_readonly') {
    return (
      <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
        <strong>Session lecture seule</strong> (adresse collée) — aucune TX List/Buy/Bid possible.
        Déconnecte et reconnecte via xPortal, extension ou Web Wallet MultiversX.
      </div>
    )
  }

  if (!canSign) {
    return (
      <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
        {reason || 'Signature non prête.'}{' '}
        <span className="opacity-80">
          (__xartistsSendTx {hasSend ? '✅' : '❌'} · method={method || '—'})
        </span>
      </div>
    )
  }

  return (
    <div className="mb-4 rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-300">
      Signature prête (sdk-dapp) — wallet user uniquement, jamais LIA ops.
    </div>
  )
}
