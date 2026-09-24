/**
 * My Packs — on-chain vs paper. Pas de 2e catalogue d’achat.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { AGENT_PACKS, type PackId } from '../config/agentPacks'
import { timingDefaults } from '../config/chainTiming'
import { requestOpenConnect } from '../lib/walletEvents'
import { useUserAccount } from '../hooks/useUserAccount'
import { matchOnChainPacks, loadOwnedPacks } from '../lib/nftPacks'

const API = (import.meta.env.VITE_ACCESS_API_BASE as string | undefined) || ''

export default function MyPacks() {
  const { connected, address } = useWallet()
  const account = useUserAccount(connected ? address : null)
  const chainHits = useMemo(() => matchOnChainPacks(account.nfts), [account.nfts])
  const paperPacks = useMemo(() => loadOwnedPacks(), [account.refreshedAt, connected])
  const [params] = useSearchParams()
  const [mintStatus, setMintStatus] = useState<string | null>(null)

  const paid = params.get('paid') === '1'
  const cancelled = params.get('cancelled') === '1'
  const sessionId = params.get('session_id')

  useEffect(() => {
    if (!paid || !sessionId || !API) {
      if (paid && !sessionId) setMintStatus('Retour paiement — mint si backend configuré.')
      return
    }
    let stop = false
    let n = 0
    const pollMs = timingDefaults().mintStatusPollMs
    const poll = async () => {
      try {
        const r = await fetch(`${API}/v1/checkout/status/${sessionId}`)
        const j = await r.json()
        if (stop) return
        setMintStatus(
          `${j.status}${j.tx_hash ? ` · ${String(j.tx_hash).slice(0, 12)}…` : ''}${j.error ? ` · ${j.error}` : ''}`
        )
        if (j.status === 'minted' || j.status === 'failed') return
      } catch {
        if (!stop) setMintStatus('Statut mint…')
      }
      n += 1
      if (n < 40 && !stop) setTimeout(poll, pollMs)
    }
    poll()
    return () => {
      stop = true
    }
  }, [paid, sessionId])

  const chainIds = new Set(chainHits.map(h => h.packId as PackId))

  return (
    <div className="animate-fade-in space-y-8 pb-12 max-w-xl mx-auto">
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Compte</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">My Packs</h1>
        <p className="text-[13px] text-zinc-500">
          On-chain = NFT détecté. Paper = intention locale sur cet appareil.
        </p>
        {!connected && (
          <button type="button" onClick={() => requestOpenConnect()} className="btn-secondary text-sm">
            Connecter wallet
          </button>
        )}
        {paid && <p className="text-xs text-emerald-400/90">Retour paiement OK{mintStatus ? ` · ${mintStatus}` : ''}</p>}
        {cancelled && <p className="text-xs text-amber-200/90">Paiement annulé</p>}
      </header>

      <section className="space-y-2">
        <h2 className="text-[11px] uppercase tracking-wider text-zinc-500">On-chain</h2>
        {chainHits.length === 0 ? (
          <p className="text-[12px] text-zinc-600 rounded-xl border border-white/[0.06] px-3 py-3">
            Aucun pack agent détecté dans le wallet.
          </p>
        ) : (
          <ul className="space-y-2">
            {chainHits.map(h => {
              const p = AGENT_PACKS.find(x => x.id === h.packId)
              return (
                <li
                  key={h.identifier || String(h.packId)}
                  className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 flex justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{p?.name || h.packId}</p>
                    <p className="text-[11px] text-zinc-500 mono">{h.identifier}</p>
                  </div>
                  <span className="text-[10px] text-emerald-300 shrink-0">on-chain</span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-[11px] uppercase tracking-wider text-zinc-500">Paper / local</h2>
        {paperPacks.length === 0 ? (
          <p className="text-[12px] text-zinc-600 rounded-xl border border-white/[0.06] px-3 py-3">
            Aucune intention paper sur cet appareil.
          </p>
        ) : (
          <ul className="space-y-2">
            {paperPacks.map(id => {
              const p = AGENT_PACKS.find(x => x.id === id)
              return (
                <li
                  key={id}
                  className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 flex justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{p?.name || id}</p>
                    <p className="text-[11px] text-zinc-500">
                      local{chainIds.has(id) ? ' · aussi on-chain' : ''}
                    </p>
                  </div>
                  <span className="text-[10px] text-amber-200 shrink-0">paper</span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <p className="text-[12px] text-zinc-600">
        <Link to="/payments" className="text-zinc-400 hover:text-white underline-offset-2 hover:underline">
          Historique paiements paper
        </Link>
        {' · '}
        <Link to="/agents" className="text-zinc-400 hover:text-white underline-offset-2 hover:underline">
          Acheter un pack
        </Link>
      </p>
    </div>
  )
}
