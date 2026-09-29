/**
 * Salle holder 3D-lite — 1 NFT pack = 1 salle.
 * Moniteur agent IA (clone LIA rewards paper) + desk trading avec Grok.
 */
import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useUserAccount } from '../hooks/useUserAccount'
import { AGENT_PACKS, type PackId } from '../config/agentPacks'
import { holderStatus, canEnterRoom, ROOM_META } from '../lib/holderAccess'
import { requestOpenConnect } from '../lib/walletEvents'
import PackAgentMonitor from '../components/PackAgentMonitor'

const VALID: PackId[] = ['pulse', 'yield', 'sentinel']

function isPackId(v: string | undefined): v is PackId {
  return !!v && VALID.includes(v as PackId)
}

export default function HolderRoomPage() {
  const { packId: raw } = useParams<{ packId: string }>()
  const packId = isPackId(raw) ? raw : null
  const { connected, address } = useWallet()
  const account = useUserAccount(connected ? address : null)
  const status = useMemo(() => holderStatus(account.nfts), [account.nfts, account.refreshedAt])

  if (!packId) return <Navigate to="/my-packs" replace />

  const meta = ROOM_META[packId]
  const pack = AGENT_PACKS.find(p => p.id === packId)!
  const allowed = canEnterRoom(status, packId)
  const source = status.onchain.includes(packId)
    ? 'on-chain'
    : status.paper.includes(packId)
      ? 'paper device'
      : null

  if (!allowed) {
    return (
      <div className="animate-fade-in max-w-lg mx-auto space-y-6 pb-16">
        <header className="space-y-2">
          <p className="section-label">Salle reservee</p>
          <h1 className="section-title display text-2xl">
            {meta.emoji} {meta.title}
          </h1>
          <p className="text-[13px] text-zinc-500 leading-relaxed">
            Acces reserve aux detenteurs du pack <strong className="text-zinc-300">{pack.name}</strong>.
            Une salle par NFT — pas de passe-partout.
          </p>
        </header>
        {!connected && (
          <button type="button" className="btn-primary w-full" onClick={() => requestOpenConnect()}>
            Connecter wallet
          </button>
        )}
        <Link to="/agents" className="btn-secondary w-full text-center block">
          Obtenir le pack {pack.name}
        </Link>
        <Link to="/my-packs" className="text-[12px] text-zinc-500 hover:text-zinc-300 block text-center">
          ← My Packs
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-5 pb-20 max-w-2xl mx-auto">
      {/* 3D-lite room shell */}
      <div
        className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${meta.accent} p-1`}
      >
        <div className="rounded-[1.35rem] bg-[#0a0a12]/90 backdrop-blur-xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold">
                Salle holder · {source}
              </p>
              <h1 className="display text-2xl sm:text-3xl text-white mt-1">
                {meta.emoji} {meta.title}
              </h1>
              <p className="text-[12px] text-zinc-400 mt-1 max-w-md">{pack.tagline}</p>
            </div>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[10px] text-emerald-200">
              acces OK
            </span>
          </div>

          {/* Virtual room grid */}
          <div className="grid grid-cols-3 gap-2 h-28 sm:h-36">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="rounded-xl border border-white/8 bg-black/40 flex items-center justify-center relative overflow-hidden"
              >
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    background:
                      i === 1
                        ? 'radial-gradient(circle at 50% 80%, rgba(167,139,250,0.35), transparent 70%)'
                        : 'radial-gradient(circle at 50% 50%, rgba(34,211,238,0.15), transparent 70%)',
                  }}
                />
                <span className="relative text-2xl opacity-80">{i === 1 ? pack.icon : '🖼'}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-zinc-600 text-center">
            Scene 3D-lite · moniteur central = agent {pack.name} (clone LIA paper)
          </p>
        </div>
      </div>

      <PackAgentMonitor packId={packId} />

      <section className="rounded-2xl border border-violet-500/25 bg-violet-950/20 p-4 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-300/90">
          Trading live-in · avec Grok
        </p>
        <p className="text-[12px] text-zinc-400 leading-relaxed">
          Desk paper + signaux pack. Execution on-chain uniquement si tu signes (xPortal / Web Wallet).
          LIA / clone ne deplace jamais tes fonds sans toi.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link to={`/trading?pack=${packId}&desk=1`} className="btn-primary text-sm">
            Ouvrir le desk trading
          </Link>
          <Link to="/lia" className="btn-secondary text-sm">
            Vue LIA performance
          </Link>
        </div>
      </section>

      <div className="flex flex-wrap gap-3 text-[12px] text-zinc-500">
        <Link to="/my-packs" className="hover:text-zinc-300">
          My Packs
        </Link>
        <span>·</span>
        <Link to="/museum" className="hover:text-zinc-300">
          {meta.museeLabel}
        </Link>
        <span>·</span>
        <Link to="/agents" className="hover:text-zinc-300">
          Packs
        </Link>
      </div>
    </div>
  )
}
