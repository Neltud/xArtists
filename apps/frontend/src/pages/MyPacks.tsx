/**
 * My Packs — on-chain vs paper + salles holo (1 ambiance / pack).
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { AGENT_PACKS, type PackId } from '../config/agentPacks'
import { timingDefaults } from '../config/chainTiming'
import { requestOpenConnect } from '../lib/walletEvents'
import { useUserAccount } from '../hooks/useUserAccount'
import { matchOnChainPacks, loadOwnedPacks, markPackOwned } from '../lib/nftPacks'
import { ROOM_META } from '../lib/holderAccess'
import PackRoomHolo from '../components/PackRoomHolo'

const API = (import.meta.env.VITE_ACCESS_API_BASE as string | undefined) || ''

const PACK_IDS: PackId[] = ['pulse', 'yield', 'sentinel']

function isPackId(v: string | null): v is PackId {
  return !!v && PACK_IDS.includes(v as PackId)
}

function readCheckoutIntentPack(): PackId | null {
  try {
    const raw = localStorage.getItem('xartists_access_checkout_intent')
    if (!raw) return null
    const j = JSON.parse(raw) as { packId?: string }
    return isPackId(j.packId ?? null) ? j.packId! : null
  } catch {
    return null
  }
}

export default function MyPacks() {
  const { connected, address } = useWallet()
  const account = useUserAccount(connected ? address : null)
  const [params, setParams] = useSearchParams()
  const [mintStatus, setMintStatus] = useState<string | null>(null)
  const [paperPacks, setPaperPacks] = useState<PackId[]>(() => loadOwnedPacks())
  const [activeRoom, setActiveRoom] = useState<PackId | null>(null)
  const paid = params.get('paid')
  const packParam = params.get('pack')
  const cancelled = params.get('cancelled')
  const sessionId = params.get('session_id')

  useEffect(() => {
    if (!paid) return
    const fromQuery = isPackId(packParam) ? packParam : null
    const intent = readCheckoutIntentPack()
    const id = fromQuery || intent
    if (!id) {
      setMintStatus('Retour paiement — pack non identifié.')
      return
    }
    markPackOwned(id)
    setPaperPacks(loadOwnedPacks())
    setActiveRoom(id)
    setMintStatus(`Pack ${id} ajouté (paper).`)
    try {
      localStorage.removeItem('xartists_access_checkout_intent')
    } catch {
      /* */
    }
    const next = new URLSearchParams(params)
    next.delete('paid')
    next.delete('pack')
    setParams(next, { replace: true })
  }, [paid, packParam]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sessionId || !API) return
    let stop = false
    ;(async () => {
      for (let i = 0; i < 8; i++) {
        if (stop) return
        try {
          const r = await fetch(`${API}/access/session/${sessionId}`)
          if (!r.ok) continue
          const j = (await r.json()) as { status?: string }
          if (j.status === 'minted' || j.status === 'failed') return
        } catch {
          /* */
        }
        await new Promise(r => setTimeout(r, timingDefaults.pollMs))
      }
    })()
    return () => {
      stop = true
    }
  }, [sessionId])

  const chainHits = useMemo(() => matchOnChainPacks(account.nfts || []), [account.nfts])
  const ownedAll = Array.from(
    new Set([...paperPacks, ...chainHits.map(h => h.packId as PackId)].filter(Boolean)),
  ) as PackId[]

  const room = activeRoom && ownedAll.includes(activeRoom) ? activeRoom : ownedAll[0] || null

  return (
    <div className="animate-fade-in space-y-8 pb-12 max-w-xl mx-auto">
      <header className="space-y-2">
        <p className="section-label">Compte</p>
        <h1 className="section-title display">My Packs</h1>
        <div className="atelier-title-rule" aria-hidden />
        <p className="section-lead">
          1 pack = 1 salle (ambiance distincte) + moniteur. Pas un fond d’investissement.
        </p>
      </header>

      {!connected && (
        <button type="button" className="btn-primary" onClick={() => requestOpenConnect()}>
          Connecter wallet
        </button>
      )}

      {cancelled && (
        <p className="text-[13px] text-amber-200/90 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2">
          Paiement annulé — aucun pack ajouté.
        </p>
      )}

      {mintStatus && (
        <p className="text-[13px] text-zinc-300 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
          {mintStatus}
        </p>
      )}

      {ownedAll.length === 0 ? (
        <div className="card space-y-3 text-sm text-zinc-400">
          <p>Aucune salle pour l’instant.</p>
          <Link to="/agents" className="btn-primary text-sm inline-block">
            Voir les packs
          </Link>
        </div>
      ) : (
        <section className="space-y-3">
          <h2 className="section-label">Tes salles ({ownedAll.length})</h2>
          <div className="flex flex-wrap gap-2">
            {ownedAll.map(id => {
              const p = AGENT_PACKS.find(x => x?.id === id)
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveRoom(id)}
                  className={`rounded-full px-3 py-1.5 text-[12px] border ${
                    room === id
                      ? 'border-violet-400/50 bg-violet-500/20 text-white'
                      : 'border-white/10 text-zinc-400'
                  }`}
                >
                  {p?.icon} {p?.name || id}
                </button>
              )
            })}
          </div>
          {room && <PackRoomHolo packId={room} />}
          <div className="grid gap-2">
            {ownedAll.map(id => {
              const p = AGENT_PACKS.find(x => x?.id === id)
              const meta = ROOM_META[id]
              return (
                <Link
                  key={id}
                  to={`/command-center?room=${id}`}
                  className="rounded-xl border border-violet-500/25 bg-violet-500/[0.08] px-4 py-3 flex justify-between items-center"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {p?.icon} {p?.name || id}
                    </p>
                    <p className="text-[11px] text-zinc-500">{p?.tagline || meta?.title}</p>
                  </div>
                  <span className="text-[11px] text-violet-200">Command →</span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="section-label">On-chain</h2>
        {chainHits.length === 0 ? (
          <p className="text-[12px] text-zinc-600 rounded-xl border border-white/[0.06] px-3 py-3">
            Aucun pack agent détecté dans le wallet.
          </p>
        ) : (
          <ul className="space-y-2">
            {chainHits.map(h => {
              const p = AGENT_PACKS.find(x => x?.id === h.packId)
              return (
                <li
                  key={h.identifier}
                  className="text-[13px] text-zinc-300 rounded-xl border border-white/10 px-3 py-2"
                >
                  {p?.name || h.packId} · {h.identifier}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <p className="text-[11px] text-zinc-600">
        <Link to="/agents" className="text-cyan-400 hover:underline">
          Voir les packs →
        </Link>
      </p>
    </div>
  )
}
