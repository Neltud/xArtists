import { localizeChild as xaLocalize, renderChild as xaRender } from '../i18n/phraseRuntime'
/**
 * My Packs — on-chain vs paper + salles holo + GenesisCard3D (preuve visuelle S2).
 * Guest : salles verrouillées jusqu'à pack lié wallet / preview.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { AGENT_PACKS, PACK_VISUAL, type PackId } from '../config/agentPacks'
import { timingDefaults } from '../config/chainTiming'
import { requestOpenConnect } from '../lib/walletEvents'
import { useUserAccount } from '../hooks/useUserAccount'
import { matchOnChainPacks, loadOwnedPacks } from '../lib/nftPacks'
import { ROOM_META } from '../lib/holderAccess'
import PackRoomHolo from '../components/PackRoomHolo'
import GenesisCard3D from '../components/packs/GenesisCard3D'
import { fetchPayboxOrderStatus, type PayboxOrderResult } from '../lib/paybox'
import { getAccessToken } from '../lib/accessSession'

const API = (import.meta.env.VITE_ACCESS_API_BASE as string | undefined) || ''
const PACK_IDS: PackId[] = ['pulse', 'yield', 'sentinel']

const ROOM_BLURB: Record<string, string> = {
  pulse: 'Signaux & flux live',
  yield: 'Farming & liquidite $TRO',
  sentinel: 'Alertes & garde-fous',
}

export default function MyPacks() {
  const { connected, address } = useWallet()
  const account = useUserAccount(connected ? address : null)
  const [params, setParams] = useSearchParams()
  const [mintStatus, setMintStatus] = useState<string | null>(null)
  const [paperPacks] = useState<PackId[]>(() => loadOwnedPacks())
  const [activeRoom, setActiveRoom] = useState<PackId | null>(null)
  const paid = params.get('paid')
  const cancelled = params.get('cancelled')
  const sessionId = params.get('session_id')
  const orderId = params.get('order')
  const [orderStatus, setOrderStatus] = useState<PayboxOrderResult | null>(null)

  useEffect(() => {
    if (!paid) return
    setMintStatus(
      'Retour navigateur reçu — confirmation serveur en cours (IPN). Le flag ?paid= ne debloque pas les salles.',
    )
    const next = new URLSearchParams(params)
    next.delete('paid')
    setParams(next, { replace: true })
  }, [paid]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!orderId || !API || !connected) return
    let stop = false
    ;(async () => {
      for (let i = 0; i < 12; i++) {
        if (stop) return
        try {
          const st = await fetchPayboxOrderStatus(orderId, {
            buyerAddress: address || undefined,
            accessToken: address ? getAccessToken(address) || undefined : undefined,
          })
          if (stop) return
          setOrderStatus(st)
          if (st.server_confirmed) {
            setMintStatus(
              st.delivery_verified
                ? 'Livraison NFT enregistree par le serveur — verifier aussi la possession on-chain dans le wallet.'
                : 'Paiement confirme par le serveur — NFT non encore livre. Aucun droit on-chain accorde par ce paiement seul.',
            )
            return
          }
          if (st.status === 'refused' || st.status === 'cancelled') {
            setMintStatus(`Commande ${st.status}.`)
            return
          }
        } catch {
          /* retry */
        }
        await new Promise(r => setTimeout(r, timingDefaults().mintStatusPollMs || 2500))
      }
      setMintStatus(m => m || 'En attente de confirmation serveur (IPN).')
    })()
    return () => {
      stop = true
    }
  }, [orderId, connected, address])

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
        await new Promise(r => setTimeout(r, timingDefaults().mintStatusPollMs || 2500))
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
  const lockedIds = PACK_IDS.filter(id => !ownedAll.includes(id))

  return (
    <div className="xa-page animate-fade-in space-y-8 pb-12 max-w-xl mx-auto">
      <header className="space-y-2">
        <p className="section-label">{xaRender('Compte')}</p>
        <h1 className="section-title display">{xaRender('My Packs')}</h1>
        <div className="atelier-title-rule" aria-hidden />
        <p className="section-lead">
          {xaRender(
            '1 pack = 1 œuvre SFT Genesis (recto peinture · verso HUD) + 1 salle. Pas un fonds.',
          )}
        </p>
      </header>

      {xaRender(
        !connected && (
          <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 space-y-2">
            <p className="text-[13px] text-amber-100/95 leading-relaxed">
              <span className="font-semibold">{xaRender('Mode invite')}</span>{' '}
              {xaRender(
                ' — salles Pulse / Yield / Sentinel verrouillees tant qu aucun pack n est lie a un wallet.',
              )}
            </p>
            <button type="button" className="btn-primary text-sm" onClick={() => requestOpenConnect()}>
              {xaRender('Connecter xPortal ')}
            </button>
          </div>
        ),
      )}

      {xaRender(
        cancelled && (
          <p className="text-[13px] text-amber-200/90 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2">
            {xaRender('Paiement annule — aucun pack ajoute. ')}
          </p>
        ),
      )}

      {xaRender(
        orderStatus && (
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] text-zinc-300 space-y-1">
            <p>
              Commande <code className="text-[11px]">{xaRender(orderId || '')}</code>
              {' · '}
              {xaRender(
                orderStatus.server_confirmed
                  ? 'paiement confirme (serveur)'
                  : orderStatus.status === 'refused' || orderStatus.status === 'cancelled'
                    ? orderStatus.status
                    : 'paiement en attente / IPN',
              )}
            </p>
            {xaRender(
              orderStatus.pack_id && (
                <p className="text-[11px] text-zinc-500">pack: {xaRender(orderStatus.pack_id)}</p>
              ),
            )}
            {xaRender(
              orderStatus.server_confirmed && (
                <p className="text-[11px] text-amber-200/90">
                  {xaRender(orderStatus.delivery_verified
                    ? 'NFT livre selon le backend — validation wallet necessaire'
                    : 'NFT en attente de livraison — aucun acces NFT accorde')}
                </p>
              ),
            )}
          </div>
        ),
      )}

      {xaRender(
        mintStatus && (
          <p className="text-[13px] text-zinc-300 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
            {xaRender(mintStatus)}
          </p>
        ),
      )}

      {xaRender(
        ownedAll.length === 0 ? (
          <div className="card space-y-4 text-sm text-zinc-400">
            <p>{xaRender('Aucune salle deverrouillee pour l instant.')}</p>
            <div className="grid gap-3">
              {xaRender(
                PACK_IDS.map(id => {
                  const p = AGENT_PACKS.find(x => x?.id === id)
                  return (
                    <div
                      key={id}
                      className="rounded-xl border overflow-hidden"
                      style={{
                        borderColor: PACK_VISUAL[id].border,
                        background: PACK_VISUAL[id].accentSoft,
                      }}
                    >
                      <div className="p-3 pb-0 opacity-40 grayscale">
                        <GenesisCard3D id={id} autoRotate={false} sampleEdition={1} />
                      </div>
                      <div className="px-3 py-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium" style={{ color: PACK_VISUAL[id].accent }}>
                            {xaRender(p?.icon)} {xaRender(p?.name || id)}{' '}
                            <span className="text-[10px] uppercase tracking-wide text-[color:var(--xa-text-muted)]">
                              {xaRender('verrouillee ')}
                            </span>
                          </p>
                          <p className="text-[11px] text-zinc-500">{xaRender(ROOM_BLURB[id])}</p>
                        </div>
                        <Link
                          to={`/packs/${id}`}
                          className="text-[11px] underline shrink-0"
                          style={{ color: PACK_VISUAL[id].accent }}
                        >
                          {xaRender('Voir →')}
                        </Link>
                      </div>
                    </div>
                  )
                }),
              )}
            </div>
            <Link to="/intelligence/agents" className="btn-primary text-sm inline-block">
              {xaRender('Voir les packs / deverrouiller ')}
            </Link>
          </div>
        ) : (
          <section className="space-y-4">
            <h2 className="section-label">
              {xaRender('Tes œuvres Genesis (')}{xaRender(String(ownedAll.length))})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {xaRender(
                ownedAll.map(id => {
                  const onChain = chainHits.some(h => h.packId === id)
                  const hit = chainHits.find(h => h.packId === id)
                  return (
                    <div key={id} className="space-y-2">
                      <GenesisCard3D
                        id={id}
                        sampleEdition={onChain ? 1 : 47}
                      />
                      <p className="text-center text-[11px] text-zinc-500">
                        {xaRender(onChain ? 'on-chain' : 'apercu local / paper')}{' '}
                        {hit ? `· ${hit.identifier}` : ''}
                      </p>
                    </div>
                  )
                }),
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {xaRender(
                ownedAll.map(id => {
                  const p = AGENT_PACKS.find(x => x?.id === id)
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveRoom(id)}
                      className="rounded-full px-3 py-1.5 text-[12px] border border-[color:var(--xa-border)] text-[color:var(--xa-text-secondary)]"
                      style={
                        room === id
                          ? {
                              borderColor: PACK_VISUAL[id].border,
                              background: PACK_VISUAL[id].accentSoft,
                              color: PACK_VISUAL[id].accent,
                            }
                          : undefined
                      }
                    >
                      {xaRender(p?.icon)} {xaRender(p?.name || id)}
                    </button>
                  )
                }),
              )}
            </div>
            {xaRender(room && <PackRoomHolo packId={room} />)}
            <div className="grid gap-2">
              {xaRender(
                ownedAll.map(id => {
                  const p = AGENT_PACKS.find(x => x?.id === id)
                  const meta = ROOM_META[id]
                  const onChain = chainHits.some(h => h.packId === id)
                  return (
                    <Link
                      key={id}
                      to={`/command-center?room=${id}`}
                      className="rounded-xl border px-4 py-3 flex justify-between items-center"
                      style={{
                        borderColor: PACK_VISUAL[id].border,
                        background: PACK_VISUAL[id].accentSoft,
                      }}
                    >
                      <div>
                        <p className="text-sm font-medium text-white">
                          {xaRender(p?.icon)} {xaRender(p?.name || id)}
                          <span className="ml-2 text-[10px] font-normal text-zinc-500">
                            {xaRender(onChain ? 'on-chain' : 'apercu local')}
                          </span>
                        </p>
                        <p className="text-[11px] text-zinc-500">{xaRender(p?.tagline || meta?.title)}</p>
                      </div>
                      <span className="text-[11px]" style={{ color: PACK_VISUAL[id].accent }}>
                        {xaRender('Command →')}
                      </span>
                    </Link>
                  )
                }),
              )}
            </div>

            {xaRender(
              lockedIds.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h3 className="text-[11px] uppercase tracking-wide text-zinc-600">
                    {xaRender('Encore verrouillees')}
                  </h3>
                  <div className="grid gap-1.5">
                    {xaRender(
                      lockedIds.map(id => {
                        const p = AGENT_PACKS.find(x => x?.id === id)
                        return (
                          <div
                            key={id}
                            className="rounded-lg border px-3 py-2 flex justify-between items-center gap-2 text-[12px] text-[color:var(--xa-text-secondary)]"
                            style={{ borderColor: PACK_VISUAL[id].border }}
                          >
                            <span>
                              {xaRender(p?.icon)} {xaRender(p?.name || id)} · {xaRender(ROOM_BLURB[id])}
                            </span>
                            <Link
                              to={`/packs/${id}`}
                              className="text-[color:var(--xa-accent)] text-[11px] underline"
                            >
                              {xaRender('Debloquer ')}
                            </Link>
                          </div>
                        )
                      }),
                    )}
                  </div>
                </div>
              ),
            )}
          </section>
        ),
      )}

      <section className="space-y-2">
        <h2 className="section-label">{xaRender('On-chain')}</h2>
        {xaRender(
          chainHits.length === 0 ? (
            <p className="text-[12px] text-zinc-600 rounded-xl border border-white/[0.06] px-3 py-3">
              {xaRender('Aucun pack agent detecte dans le wallet ')}
              {xaRender(connected ? '' : ' — connecte xPortal pour scanner')}.
            </p>
          ) : (
            <ul className="space-y-2">
              {xaRender(
                chainHits.map(h => {
                  const p = AGENT_PACKS.find(x => x?.id === h.packId)
                  return (
                    <li
                      key={h.identifier}
                      className="text-[13px] text-zinc-300 rounded-xl border border-white/10 px-3 py-2"
                    >
                      {xaRender(p?.name || h.packId)} · {xaRender(h.identifier)}
                    </li>
                  )
                }),
              )}
            </ul>
          ),
        )}
      </section>

      <p className="text-[11px] text-zinc-600">
        <Link to="/intelligence/agents" className="text-[color:var(--xa-accent)] hover:underline">
          {xaRender('Voir les packs → ')}
        </Link>
        {' · '}
        <Link to="/packs/sentinel" className="text-[color:var(--xa-accent)] hover:underline">
          {xaRender('Smoke Sentinel 50€')}
        </Link>
      </p>
    </div>
  )
}
