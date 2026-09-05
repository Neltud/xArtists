/**
 * My Packs — possession on-chain vs paper (pas de 2e catalogue d’achat).
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { AGENT_PACKS, type PackId } from '../config/agentPacks'
import { timingDefaults } from '../config/chainTiming'
import { requestOpenConnect } from '../lib/walletEvents'
import { useUserAccount } from '../hooks/useUserAccount'
import { matchOnChainPacks, loadOwnedPacks } from '../lib/nftPacks'
import InfoTip from '../components/InfoTip'

const API = (import.meta.env.VITE_ACCESS_API_BASE as string | undefined) || ''

export default function MyPacks() {
  const { connected, address, method } = useWallet()
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
      if (paid && !sessionId) setMintStatus('Retour paiement — suivi mint si webhook configuré.')
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
          `${j.status}${j.tx_hash ? ` · tx ${String(j.tx_hash).slice(0, 12)}…` : ''}${
            j.error ? ` · ${j.error}` : ''
          }`
        )
        if (j.status === 'minted' || j.status === 'failed') return
      } catch {
        if (!stop) setMintStatus('Lecture statut mint…')
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
    <div className="animate-fade-in space-y-8 pb-12 max-w-2xl">
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Compte</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">My Packs</h1>
        <p className="text-sm text-zinc-400 inline-flex flex-wrap items-center gap-1">
          Vos packs — on-chain et paper
          <InfoTip>
            <strong className="text-white block mb-1">Deux listes</strong>
            <span className="text-zinc-400">
              On-chain = NFT sur votre adresse. Paper = intention locale / checkout sans mint encore.
            </span>
          </InfoTip>
        </p>
      </header>

      {(paid || cancelled || mintStatus) && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-zinc-400 space-y-1">
          {paid && <p className="text-emerald-200/90">Retour paiement enregistré</p>}
          {cancelled && <p className="text-amber-200/90">Paiement annulé</p>}
          {mintStatus && <p>{mintStatus}</p>}
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-zinc-950/50 p-4 space-y-2">
        <h2 className="text-sm font-semibold text-white">Wallet</h2>
        {connected && address ? (
          <>
            <p className="font-mono text-xs text-zinc-400 break-all">{address}</p>
            <p className="text-[10px] text-zinc-600">{method || '—'}</p>
          </>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-zinc-500">Connectez un wallet pour lire les NFT.</p>
            <button type="button" onClick={requestOpenConnect} className="btn-primary text-xs">
              Connecter
            </button>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-white">On-chain</h2>
        {!connected ? (
          <p className="text-xs text-zinc-500">Wallet requis.</p>
        ) : account.loading ? (
          <p className="text-xs text-zinc-500">Lecture…</p>
        ) : chainHits.length === 0 ? (
          <p className="text-xs text-zinc-500 rounded-xl border border-white/5 px-3 py-4">
            Aucun pack détecté sur cette adresse.
          </p>
        ) : (
          <ul className="grid gap-2">
            {chainHits.map(h => {
              const p = AGENT_PACKS.find(x => x.id === h.packId)
              return (
                <li
                  key={h.identifier || h.packId}
                  className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 flex justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{p?.name || h.packId}</p>
                    <p className="text-[11px] text-zinc-500 font-mono truncate max-w-[240px]">
                      {h.identifier}
                    </p>
                  </div>
                  <span className="text-[10px] text-emerald-300/90 shrink-0">on-chain</span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-white">Paper / local</h2>
        {paperPacks.length === 0 ? (
          <p className="text-xs text-zinc-500 rounded-xl border border-white/5 px-3 py-4">
            Aucune intention paper sur cet appareil.
          </p>
        ) : (
          <ul className="grid gap-2">
            {paperPacks.map(id => {
              const p = AGENT_PACKS.find(x => x.id === id)
              const alsoChain = chainIds.has(id)
              return (
                <li
                  key={id}
                  className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{p?.name || id}</p>
                    <p className="text-[11px] text-zinc-500">
                      local
                      {alsoChain ? ' · aussi on-chain' : ''}
                    </p>
                  </div>
                  <span className="text-[10px] text-amber-200/90 shrink-0">paper</span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <p className="text-sm text-zinc-400">
        Pour souscrire :{' '}
        <Link to="/agents" className="text-white underline-offset-2 hover:underline">
          page Packs
        </Link>
        {' '}(un seul parcours d’achat).
      </p>
    </div>
  )
}
