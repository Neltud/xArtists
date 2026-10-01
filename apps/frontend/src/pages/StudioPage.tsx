/**
 * Creator Studio — mint entry + list owned NFTs → Marketplace.
 * Phase 8: core economy loop (prepare → list).
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useUserAccount } from '../hooks/useUserAccount'
import { requestOpenConnect } from '../lib/walletEvents'
import { canListBuyNft, canBuyAgent } from '../config/scStatus'
import PackCheckout from '../components/PackCheckout'

export default function StudioPage() {
  const { connected, address } = useWallet()
  const account = useUserAccount(connected ? address : null)
  const nfts = account.nfts || []
  const listLive = canListBuyNft()
  const agentMint = canBuyAgent()
  const [picked, setPicked] = useState<string | null>(null)

  const owned = useMemo(
    () =>
      nfts
        .filter(n => n?.identifier)
        .slice(0, 24)
        .map(n => ({
          id: n.identifier as string,
          name: n.name || n.identifier,
          collection: n.collection || '',
          thumb:
            n.url ||
            n.media?.[0]?.thumbnailUrl ||
            n.media?.[0]?.url ||
            undefined,
        })),
    [nfts],
  )

  return (
    <div className="animate-fade-in space-y-6 max-w-xl mx-auto pb-16">
      <header className="space-y-1">
        <p className="section-label">Création</p>
        <h1 className="section-title display text-2xl">Creator Studio</h1>
        <p className="text-sm text-zinc-400">
          Prépare un NFT, puis liste-le sur le marché. Signature uniquement via ton wallet
          (xPortal).
        </p>
      </header>

      <section className="card space-y-3 text-sm text-zinc-300">
        <h2 className="text-sm font-semibold text-white">Parcours</h2>
        <ol className="list-decimal list-inside space-y-1.5 text-[13px] text-zinc-400">
          <li>Connecte xPortal / Web Wallet</li>
          <li>Mint collection MultiversX (hors dApp) ou pack Agent IA</li>
          <li>Reviens ici → choisis le NFT → Marketplace → List</li>
        </ol>
        {!connected ? (
          <button type="button" className="btn-primary text-sm" onClick={requestOpenConnect}>
            Connecter wallet
          </button>
        ) : (
          <p className="text-[12px] text-emerald-300/80 mono truncate">{address}</p>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <Link to="/marketplace" className="btn-primary text-sm">
            Marketplace {listLive ? '· LIVE' : '· paper'}
          </Link>
          <Link to="/agents" className="btn-secondary text-sm">
            Packs IA
          </Link>
          <Link to="/museum" className="btn-secondary text-sm">
            Musée
          </Link>
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold text-white">Mes NFT ({owned.length})</h2>
        {!connected && (
          <p className="text-[13px] text-zinc-500">Connecte un wallet pour voir tes NFT.</p>
        )}
        {connected && owned.length === 0 && (
          <p className="text-[13px] text-zinc-500">
            Aucun NFT détecté. Mint une collection MultiversX ou un pack, puis rafraîchis.
          </p>
        )}
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {owned.map(n => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => setPicked(n.id)}
                className={`w-full text-left rounded-xl border p-2 transition ${
                  picked === n.id
                    ? 'border-violet-400/50 bg-violet-500/10'
                    : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                }`}
              >
                {n.thumb ? (
                  <img
                    src={n.thumb}
                    alt=""
                    className="w-full aspect-square object-cover rounded-lg mb-1.5 bg-zinc-900"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full aspect-square rounded-lg mb-1.5 bg-zinc-900" />
                )}
                <p className="text-[11px] text-zinc-200 truncate">{n.name}</p>
                <p className="text-[10px] text-zinc-600 truncate">{n.collection}</p>
              </button>
            </li>
          ))}
        </ul>
        {picked && (
          <div className="flex flex-wrap gap-2 items-center pt-1">
            <Link
              to={`/marketplace?list=${encodeURIComponent(picked)}`}
              className="btn-primary text-sm"
            >
              Mettre en vente
            </Link>
            <span className="text-[11px] text-zinc-500 mono truncate max-w-[12rem]">{picked}</span>
          </div>
        )}
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold text-white">
          Packs Agent IA {agentMint ? '' : '· paper'}
        </h2>
        <p className="text-[12px] text-zinc-500">
          Paper débloque Command Center sur cet appareil. Mint SC quand GO_LIVE agents.
        </p>
        <PackCheckout />
      </section>
    </div>
  )
}
