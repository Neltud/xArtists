/**
 * My Packs — on-chain vs paper.
 * Retour Stripe/Paybox (?paid=1&pack=…) → mark owned + ouverture theater.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { AGENT_PACKS, type PackId } from '../config/agentPacks'
import { timingDefaults } from '../config/chainTiming'
import { requestOpenConnect } from '../lib/walletEvents'
import { useUserAccount } from '../hooks/useUserAccount'
import { matchOnChainPacks, loadOwnedPacks, markPackOwned } from '../lib/nftPacks'
import PackOpenTheater from '../components/PackOpenTheater'

const API = (import.meta.env.VITE_ACCESS_API_BASE as string | undefined) || ''

const PACK_IDS: PackId[] = ['pulse', 'yield', 'sentinel']

function isPackId(v: string | null): v is PackId {
  return !!v && PACK_IDS.includes(v as PackId)
}

/** Dernière intention checkout (paper ou pré-redirect carte). */
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
  const chainHits = useMemo(() => matchOnChainPacks(account.nfts), [account.nfts])
  const [paperTick, setPaperTick] = useState(0)
  const paperPacks = useMemo(() => loadOwnedPacks(), [account.refreshedAt, connected, paperTick])
  const [params, setParams] = useSearchParams()
  const [mintStatus, setMintStatus] = useState<string | null>(null)
  const [theaterPack, setTheaterPack] = useState<PackId | null>(null)

  const paid = params.get('paid') === '1'
  const cancelled = params.get('cancelled') === '1'
  const sessionId = params.get('session_id')
  const packParam = params.get('pack')

  /** Retour paiement carte → pack local + theater une seule fois. */
  useEffect(() => {
    if (!paid) return
    const fromQuery = isPackId(packParam) ? packParam : null
    const fromIntent = readCheckoutIntentPack()
    const id = fromQuery || fromIntent
    if (!id) {
      setMintStatus('Retour paiement — pack non identifié (intent locale absente).')
      return
    }
    markPackOwned(id)
    setPaperTick(t => t + 1)
    setTheaterPack(id)
    setMintStatus(`Paiement reçu · ${id} enregistré (paper device).`)
    // Nettoyer query pour éviter rejoue theater au refresh
    const next = new URLSearchParams(params)
    next.delete('paid')
    next.delete('pack')
    // garder session_id pour poll mint si présent
    setParams(next, { replace: true })
  }, [paid, packParam]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sessionId || !API) {
      return
    }
    // poll seulement si on avait paid ou session encore en URL
    let stop = false
    let n = 0
    const pollMs = timingDefaults().mintStatusPollMs
    const poll = async () => {
      try {
        const r = await fetch(`${API}/v1/checkout/status/${sessionId}`)
        const j = await r.json()
        if (stop) return
        setMintStatus(
          `${j.status}${j.tx_hash ? ` · ${String(j.tx_hash).slice(0, 12)}…` : ''}${j.error ? ` · ${j.error}` : ''}`,
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
  }, [sessionId])

  const chainIds = new Set(chainHits.map(h => h.packId as PackId))
  const theaterProfile = theaterPack ? AGENT_PACKS.find(p => p.id === theaterPack) : null

  return (
    <div className="animate-fade-in space-y-8 pb-12 max-w-xl mx-auto">
      <header className="space-y-2">
        <p className="section-label">Compte</p>
        <h1 className="section-title display">My Packs</h1>
        <div className="atelier-title-rule" aria-hidden />
        <p className="section-lead">
          Packs agents détenus (on-chain ou paper local). Produits d’accès — pas un fonds.
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

      <section className="space-y-2">
        <h2 className="section-label">On-chain</h2>
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
        <h2 className="section-label">Paper / local</h2>
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
                  className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 flex justify-between gap-3 items-center"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{p?.name || id}</p>
                    <p className="text-[11px] text-zinc-500">
                      local{chainIds.has(id) ? ' · aussi on-chain' : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-[11px] text-cyan-300 hover:text-cyan-200 underline-offset-2 hover:underline"
                    onClick={() => setTheaterPack(id)}
                  >
                    Rouvrir
                  </button>
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

      {theaterProfile && (
        <PackOpenTheater
          pack={theaterProfile}
          open={!!theaterPack}
          onClose={() => setTheaterPack(null)}
        />
      )}
    </div>
  )
}
