/** Creator Studio — existing collections menu + issue + mint + list. */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useUserAccount } from '../hooks/useUserAccount'
import { useStudioMintTx } from '../hooks/useStudioMintTx'
import { requestOpenConnect } from '../lib/walletEvents'
import { canListBuyNft, canBuyAgent } from '../config/scStatus'
import PackCheckout from '../components/PackCheckout'
import { useToast } from '../components/ui/Toast'
import { asText } from '../lib/safeRender'
import { saveStudioCollection } from '../lib/studioOnChainMint'

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
  const [tokenIdInput, setTokenIdInput] = useState('')
  const mint = useStudioMintTx()
  const { push } = useToast()

  /** Unique collections already owned by the wallet */
  const ownedCollections = useMemo(() => {
    const map = new Map<string, { id: string; count: number; sampleName: string }>()
    for (const n of nfts) {
      const c = String(n?.collection || '').trim()
      if (!c || !c.includes('-')) continue
      const prev = map.get(c)
      if (prev) prev.count += 1
      else map.set(c, { id: c, count: 1, sampleName: asText(n.name || c) })
    }
    return Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id))
  }, [nfts])

  const owned = useMemo(
    () =>
      nfts
        .filter(n => n?.identifier)
        .slice(0, 48)
        .map(n => ({
          id: String(n.identifier),
          name: asText(n.name || n.identifier),
          collection: asText(n.collection || ''),
          thumb: n.url || n.media?.[0]?.url || undefined,
        })),
    [nfts],
  )

  const activeCollectionId =
    mint.collection?.tokenIdentifier ||
    (tokenIdInput.trim().match(/^[A-Z0-9]+-[a-f0-9]{6}$/i) ? tokenIdInput.trim() : '')

  const selectExisting = (id: string) => {
    setTokenIdInput(id)
    const tickerOnly = id.split('-')[0] || id
    const rec = {
      ticker: tickerOnly,
      name: tickerOnly,
      tokenIdentifier: id,
      roleSet: true,
      at: Date.now(),
    }
    saveStudioCollection(rec)
    mint.setCollection(rec)
    push(`Collection active : ${id}`, 'ok')
  }

  const runIssue = async () => {
    if (!connected) return requestOpenConnect()
    const r = await mint.issueCollection(name, ticker)
    push(
      r.ok ? 'Collection envoyée — signe dans xPortal' : asText(r.error, 'Échec'),
      r.ok ? 'ok' : 'err',
    )
  }

  const runRole = async () => {
    const id = activeCollectionId
    if (!id) {
      push('Choisis ou saisis un token id (TICKER-xxxxxx)', 'err')
      return
    }
    const r = await mint.setCreateRole(id)
    push(r.ok ? 'Rôle NFTCreate envoyé' : asText(r.error, 'Échec'), r.ok ? 'ok' : 'err')
  }

  const runMint = async () => {
    const id = activeCollectionId
    if (!id) {
      push('Sélectionne une collection existante ou issue-en une', 'err')
      return
    }
    const r = await mint.createNft({
      tokenIdentifier: id,
      name: nftName,
      royaltiesPct: 5,
      attributes: 'studio:xartists',
      uris: [],
    })
    push(r.ok ? 'Mint envoyé — signe xPortal' : asText(r.error, 'Échec'), r.ok ? 'ok' : 'err')
  }

  return (
    <div className="animate-fade-in space-y-6 max-w-xl mx-auto pb-16">
      <header className="space-y-1">
        <p className="section-label">Création</p>
        <h1 className="section-title display text-2xl">Creator Studio</h1>
        <p className="text-sm text-zinc-400">
          Collection existante ou nouvelle → mint → list Marketplace. Signature xPortal uniquement.
        </p>
      </header>

      {/* Existing collections — scrolling menu */}
      <section className="card space-y-3">
        <h2 className="text-sm font-semibold text-white">
          Mes collections ({ownedCollections.length})
        </h2>
        {!connected ? (
          <button type="button" className="btn-primary text-sm" onClick={requestOpenConnect}>
            Connecter wallet
          </button>
        ) : ownedCollections.length === 0 ? (
          <p className="text-[13px] text-zinc-500">
            Aucune collection NFT détectée sur ce wallet — crée-en une ci-dessous.
          </p>
        ) : (
          <div className="max-h-40 overflow-y-auto space-y-1.5 rounded-xl border border-white/10 p-2">
            {ownedCollections.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => selectExisting(c.id)}
                className={`w-full text-left rounded-lg px-3 py-2 text-[12px] border transition ${
                  activeCollectionId === c.id
                    ? 'border-emerald-400/50 bg-emerald-500/10 text-white'
                    : 'border-transparent hover:bg-white/5 text-zinc-300'
                }`}
              >
                <span className="mono font-medium">{c.id}</span>
                <span className="text-zinc-500"> · {c.count} NFT</span>
              </button>
            ))}
          </div>
        )}
        <label className="block text-[12px] text-zinc-500">
          Ou coller un token id (TICKER-xxxxxx)
          <input
            value={tokenIdInput}
            onChange={e => setTokenIdInput(e.target.value.trim())}
            placeholder="XART-abc123"
            className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm text-white mono"
          />
        </label>
        {activeCollectionId && (
          <p className="text-[12px] text-emerald-300/90 mono">Active : {activeCollectionId}</p>
        )}
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold text-white">Nouvelle collection (optionnel)</h2>
        {connected && (
          <p className="text-[12px] text-zinc-500 mono truncate">{asText(address)}</p>
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
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary text-sm"
            disabled={mint.pending || !canAttemptSign}
            onClick={() => void runIssue()}
          >
            {mint.pending ? 'Signature…' : 'Issue collection'}
          </button>
          <button
            type="button"
            className="btn-secondary text-sm"
            disabled={mint.pending || !activeCollectionId}
            onClick={() => void runRole()}
          >
            Set NFTCreate role
          </button>
        </div>
        <p className="text-[11px] text-zinc-600">
          Après issue : récupère le token id sur l’explorer (TICKER-xxxxxx), colle-le ci-dessus, puis rôle + mint.
        </p>
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold text-white">Mint NFT</h2>
        <input
          value={nftName}
          onChange={e => setNftName(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm text-white"
          placeholder="Nom de l’œuvre"
        />
        <button
          type="button"
          className="btn-secondary text-sm"
          disabled={mint.pending || !activeCollectionId}
          onClick={() => void runMint()}
        >
          {mint.pending ? 'Signature…' : 'Créer NFT'}
        </button>
        {mint.error && <p className="text-[12px] text-amber-200/90">{asText(mint.error)}</p>}
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold text-white">Mes NFT ({owned.length})</h2>
        {connected && owned.length === 0 && (
          <p className="text-[13px] text-zinc-500">Aucun NFT — mint ou importe une collection.</p>
        )}
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto">
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
                  <img
                    src={n.thumb}
                    alt=""
                    className="w-full aspect-square object-cover rounded-lg mb-1.5 bg-zinc-900"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full aspect-square rounded-lg mb-1.5 bg-zinc-900" />
                )}
                <p className="text-[11px] text-zinc-200 truncate">{asText(n.name)}</p>
                <p className="text-[9px] text-zinc-600 mono truncate">{n.collection}</p>
              </button>
            </li>
          ))}
        </ul>
        {picked && (
          <Link
            to={`/marketplace?list=${encodeURIComponent(picked)}`}
            className="btn-primary text-sm inline-block"
          >
            Mettre en vente
          </Link>
        )}
        <div className="flex flex-wrap gap-2">
          <Link to="/marketplace" className="btn-secondary text-sm inline-block">
            Marketplace{listLive ? ' · live' : ''}
          </Link>
          <Link to="/my-packs" className="btn-secondary text-sm inline-block">
            Mes salles
          </Link>
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold text-white">
          Packs Agent IA{agentMint ? '' : ' · bientôt on-chain'}
        </h2>
        <PackCheckout />
      </section>
    </div>
  )
}
