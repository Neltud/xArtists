/** Creator Studio — issue collection + mint NFT + list marketplace. */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useUserAccount } from '../hooks/useUserAccount'
import { useStudioMintTx } from '../hooks/useStudioMintTx'
import { requestOpenConnect } from '../lib/walletEvents'
import { canListBuyNft, canBuyAgent } from '../config/scStatus'
import PackCheckout from '../components/PackCheckout'
import { useToast } from '../components/ui/Toast'

export default function StudioPage() {
  const { connected, address, canAttemptSign } = useWallet()
  const account = useUserAccount(connected ? address : null)
  const nfts = account.nfts || []
  const listLive = canListBuyNft()
  const agentMint = canBuyAgent()
  const [picked, setPicked] = useState<string | null>(null)
  const [name, setName] = useState('Atelier')
  const [ticker, setTicker] = useState('ATELIER')
  const [nftName, setNftName] = useState('Oeuvre 1')
  const mint = useStudioMintTx()
  const { push } = useToast()

  const owned = useMemo(
    () =>
      nfts
        .filter(n => n?.identifier)
        .slice(0, 24)
        .map(n => ({
          id: n.identifier as string,
          name: n.name || n.identifier,
          collection: n.collection || '',
          thumb: n.url || n.media?.[0]?.url || undefined,
        })),
    [nfts],
  )

  const runIssue = async () => {
    if (!connected) return requestOpenConnect()
    const r = await mint.issueCollection(name, ticker)
    push(r.ok ? 'Collection envoyée — signe dans xPortal' : r.error || 'Échec', r.ok ? 'ok' : 'err')
  }

  const runMint = async () => {
    const id = mint.collection?.tokenIdentifier
    if (!id) {
      push('Issue la collection d’abord', 'err')
      return
    }
    const r = await mint.createNft({
      tokenIdentifier: id,
      name: nftName,
      royaltiesPct: 5,
      attributes: 'studio:xartists',
      uris: [],
    })
    push(r.ok ? 'Mint envoyé' : r.error || 'Échec', r.ok ? 'ok' : 'err')
  }

  return (
    <div className="animate-fade-in space-y-6 max-w-xl mx-auto pb-16">
      <header className="space-y-1">
        <p className="section-label">Création</p>
        <h1 className="section-title display text-2xl">Creator Studio</h1>
        <p className="text-sm text-zinc-400">
          Issue → mint → list. Signature uniquement via ton wallet.
        </p>
      </header>

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold text-white">1. Collection</h2>
        {!connected ? (
          <button type="button" className="btn-primary text-sm" onClick={requestOpenConnect}>
            Connecter wallet
          </button>
        ) : (
          <p className="text-[12px] text-zinc-500 mono truncate">{address}</p>
        )}
        <label className="block text-[12px] text-zinc-500">
          Nom
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm text-white"
          />
        </label>
        <label className="block text-[12px] text-zinc-500">
          Ticker (A-Z 3–10)
          <input
            value={ticker}
            onChange={e => setTicker(e.target.value.toUpperCase())}
            className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm text-white"
          />
        </label>
        <button type="button" className="btn-primary text-sm" disabled={mint.pending || !canAttemptSign} onClick={() => void runIssue()}>
          {mint.pending ? 'Signature…' : 'Issue collection'}
        </button>
        {mint.collection?.tokenIdentifier && (
          <p className="text-[12px] text-emerald-300/80 mono">{mint.collection.tokenIdentifier}</p>
        )}
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold text-white">2. Mint NFT</h2>
        <input
          value={nftName}
          onChange={e => setNftName(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm text-white"
          placeholder="Nom de l’œuvre"
        />
        <button type="button" className="btn-secondary text-sm" disabled={mint.pending} onClick={() => void runMint()}>
          {mint.pending ? 'Signature…' : 'Créer NFT'}
        </button>
        {mint.error && <p className="text-[12px] text-amber-200/90">{mint.error}</p>}
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold text-white">3. Mes NFT ({owned.length})</h2>
        {connected && owned.length === 0 && (
          <p className="text-[13px] text-zinc-500">Aucun NFT détecté — mint ou importe une collection.</p>
        )}
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {owned.map(n => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => setPicked(n.id)}
                className={`w-full text-left rounded-xl border p-2 ${
                  picked === n.id ? 'border-violet-400/50 bg-violet-500/10' : 'border-white/10'
                }`}
              >
                {n.thumb ? (
                  <img src={n.thumb} alt="" className="w-full aspect-square object-cover rounded-lg mb-1.5 bg-zinc-900" loading="lazy" />
                ) : (
                  <div className="w-full aspect-square rounded-lg mb-1.5 bg-zinc-900" />
                )}
                <p className="text-[11px] text-zinc-200 truncate">{n.name}</p>
              </button>
            </li>
          ))}
        </ul>
        {picked && (
          <Link to={`/marketplace?list=${encodeURIComponent(picked)}`} className="btn-primary text-sm inline-block">
            Mettre en vente
          </Link>
        )}
        <Link to="/marketplace" className="btn-secondary text-sm inline-block">
          Marketplace {listLive ? '' : ''}
        </Link>
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold text-white">Packs Agent IA {agentMint ? '' : '· paper'}</h2>
        <PackCheckout />
      </section>
    </div>
  )
}
