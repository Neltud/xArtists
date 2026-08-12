/**
 * Voluntary tip: EGLD transfer user → LIA ops with memo tip:mission|…
 * Not investment. Requires signable session (not paste).
 */
import { useState } from 'react'
import { useWallet, LIA_WALLET } from '../context/WalletContext'
import { useSendTransaction } from '../hooks/useSendTransaction'
import { canSignOnChain, signBlockReason } from '../lib/txCapability'
import { requestOpenConnect } from '../lib/walletEvents'
import { LINKS } from '../config/links'

const MEMOS = [
  { id: 'tip:mission', label: 'Mission' },
  { id: 'tip:reserve', label: 'Reserve' },
  { id: 'tip:ops', label: 'Ops gas' },
] as const

function egldToAtomic(egld: number): string {
  return BigInt(Math.round(egld * 1e18)).toString()
}

function strToHex(s: string): string {
  return Array.from(new TextEncoder().encode(s))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export default function TipEgldTransfer() {
  const { connected, address, method } = useWallet()
  const { send } = useSendTransaction()
  const [amount, setAmount] = useState('0.01')
  const [memo, setMemo] = useState<string>('tip:mission')
  const [pending, setPending] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [lastTx, setLastTx] = useState<string | null>(null)

  const block = signBlockReason(method)
  const canSign = canSignOnChain(method)

  const submit = async () => {
    setMsg(null)
    setLastTx(null)
    const n = parseFloat(amount)
    if (!Number.isFinite(n) || n <= 0) {
      setMsg('Montant EGLD invalide')
      return
    }
    if (n > 50) {
      setMsg('Plafond UI tip 50 EGLD (sécurité) — contact ops pour plus.')
      return
    }
    if (!connected || !address) {
      setMsg('Connecte ton wallet user')
      return
    }
    if (address.toLowerCase() === LIA_WALLET.toLowerCase()) {
      setMsg('LIA ops interdit comme source tip')
      return
    }
    if (block || !canSign) {
      setMsg(block || 'Signature non disponible')
      return
    }
    setPending(true)
    try {
      // MultiversX: data field = plain memo string (hex-encoded in some wallets — use ascii)
      const data = memo
      const res = await send(
        [
          {
            receiver: LIA_WALLET,
            value: egldToAtomic(n),
            gasLimit: 500_000,
            data,
            chainID: '1',
          },
        ],
        {
          processingMessage: 'Envoi tip…',
          successMessage: 'Tip soumis',
          errorMessage: 'Tip échoué',
        }
      )
      if (res.error) {
        setMsg(res.error)
        return
      }
      setLastTx(res.sessionId)
      setMsg('TX tip soumise — confirme dans le wallet. Pas un investissement.')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="card border-purple-500/25 mb-8">
      <h2 className="text-lg font-bold mb-1">Envoyer un tip EGLD (on-chain)</h2>
      <p className="text-xs text-gray-500 mb-4">
        Depuis <strong className="text-gray-300">ton</strong> wallet vers LIA Ops · memo traçable ·{' '}
        <strong className="text-amber-200">don, pas un investissement</strong>
      </p>

      {!connected ? (
        <button type="button" onClick={requestOpenConnect} className="btn-primary text-sm">
          🔗 Connecter pour tipper
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {MEMOS.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMemo(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  memo === m.id
                    ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40'
                    : 'bg-[#111118] border border-[#2a2a3a] text-gray-400'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] mono text-gray-600">memo: {memo}</p>
          <div className="flex flex-wrap gap-2 items-end">
            <label className="flex flex-col gap-1 text-[10px] uppercase text-gray-500">
              EGLD
              <input
                type="number"
                min={0}
                step={0.001}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-32 rounded-lg border border-[#2a2a3a] bg-[#15151f] px-2 py-1.5 text-sm text-white"
              />
            </label>
            <button
              type="button"
              disabled={pending || !!block || !canSign}
              onClick={submit}
              className="btn-primary text-sm disabled:opacity-40"
            >
              {pending ? '…' : 'Envoyer tip'}
            </button>
          </div>
          {(block || !canSign) && (
            <p className="text-xs text-amber-300">
              {block || 'Ouvre /tip avec Web Wallet / extension (pas paste).'}
            </p>
          )}
          {msg && <p className="text-xs text-gray-300">{msg}</p>}
          {lastTx && (
            <a
              className="text-xs text-purple-300 underline"
              href={`${LINKS.explorer}/transactions/${lastTx}`}
              target="_blank"
              rel="noreferrer"
            >
              Explorer session
            </a>
          )}
        </div>
      )}
    </div>
  )
}
