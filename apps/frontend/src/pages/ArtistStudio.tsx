import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LINKS } from '../config/links'

type MediaKind = 'image' | 'video' | 'audio'
type AssetMode = 'digital' | 'physical'
type StorageChoice = 'ipfs' | 'arweave' | 'url'

const GAS_HINT: Record<string, string> = {
  issue_collection: '~0.05–0.15 EGLD (estim.)',
  mint_nft: '~0.01–0.05 EGLD (estim.)',
  list_nft: '~0.01–0.03 EGLD (estim.)',
}

/** KPI rétention : mint → sell → buy NFT → buy $TRO */
export default function ArtistStudio() {
  const [step, setStep] = useState(1)
  const [collectionName, setCollectionName] = useState('')
  const [albumTitle, setAlbumTitle] = useState('')
  const [ticker, setTicker] = useState('')
  const [media, setMedia] = useState<MediaKind>('image')
  const [mode, setMode] = useState<AssetMode>('digital')
  const [storage, setStorage] = useState<StorageChoice>('ipfs')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [royalty, setRoyalty] = useState(5)
  const [fileName, setFileName] = useState('')
  const [ipfsUri, setIpfsUri] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')

  const ytOk =
    !youtubeUrl.trim() ||
    youtubeUrl.includes('youtube.com/') ||
    youtubeUrl.includes('youtu.be/')

  const checklist = useMemo(
    () => [
      { ok: collectionName.trim().length >= 2, label: 'Nom de collection / album' },
      { ok: ticker.trim().length >= 3 && ticker.trim().length <= 10, label: 'Ticker 3–10' },
      { ok: title.trim().length >= 1, label: 'Titre de l’œuvre' },
      {
        ok:
          mode === 'physical' ||
          !!fileName ||
          ipfsUri.startsWith('ipfs://') ||
          ipfsUri.startsWith('https://'),
        label: 'Média IPFS/URL ou fichier préparé',
      },
      { ok: ytOk, label: 'YouTube optionnel = lien externe valide' },
    ],
    [collectionName, ticker, title, fileName, mode, ipfsUri, ytOk]
  )
  const ready = checklist.every(c => c.ok)

  return (
    <div className="animate-fade-in max-w-3xl mx-auto pb-24 md:pb-8">
      <header className="mb-6">
        <h1 className="text-3xl font-black">🎨 Studio xArtists</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Parcours artiste : <strong className="text-gray-300">mint → list / sell → market</strong>
        </p>
      </header>

      <ol className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] sm:text-xs">
        {[
          { n: '1', t: 'Collection' },
          { n: '2', t: 'IPFS média' },
          { n: '3', t: 'Métadonnées' },
          { n: '4', t: 'Mint & sell' },
        ].map((s, i) => (
          <li
            key={s.n}
            className={`rounded-xl border px-2 py-2 text-center ${
              step === i + 1 ? 'border-purple-500 bg-purple-500/15 text-purple-100' : 'border-[#2a2a3a] text-gray-500'
            }`}
          >
            <span className="font-black">{s.n}</span> {s.t}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-2 mb-6 text-xs font-semibold">
        {[1, 2, 3, 4].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => setStep(n)}
            className={`px-3 py-1.5 rounded-full border min-h-[40px] ${
              step === n ? 'border-purple-500 bg-purple-500/20 text-purple-200' : 'border-[#2a2a3a] text-gray-500'
            }`}
          >
            Étape {n}
          </button>
        ))}
      </div>

      {step === 1 && (
        <div className="card space-y-4">
          <h2 className="font-bold">1 — Collection / album</h2>
          <label className="block text-sm text-gray-400">
            Nom collection
            <input
              className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] px-3 py-2.5 text-white"
              value={collectionName}
              onChange={e => setCollectionName(e.target.value)}
              placeholder="xArtists Genesis"
            />
          </label>
          <label className="block text-sm text-gray-400">
            Album (optionnel)
            <input
              className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] px-3 py-2.5 text-white"
              value={albumTitle}
              onChange={e => setAlbumTitle(e.target.value)}
            />
          </label>
          <label className="block text-sm text-gray-400">
            Ticker
            <input
              className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] px-3 py-2.5 mono"
              value={ticker}
              onChange={e => setTicker(e.target.value.toUpperCase().slice(0, 10))}
              placeholder="XART"
            />
          </label>
          <p className="text-xs text-gray-500">Gaz issue : {GAS_HINT.issue_collection}</p>
          <button type="button" className="btn-primary text-sm w-full sm:w-auto" onClick={() => setStep(2)}>
            Continuer →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card space-y-4">
          <h2 className="font-bold">2 — Média & stockage permanent</h2>
          <div className="flex flex-wrap gap-2">
            {(['image', 'video', 'audio'] as MediaKind[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMedia(m)}
                className={`px-4 py-2.5 rounded-xl border text-sm capitalize min-h-[44px] ${
                  media === m ? 'border-purple-500 bg-purple-500/15' : 'border-[#2a2a3a]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(['digital', 'physical'] as AssetMode[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-4 py-2.5 rounded-xl border text-sm min-h-[44px] ${
                  mode === m ? 'border-teal-500 bg-teal-500/15' : 'border-[#2a2a3a]'
                }`}
              >
                {m === 'digital' ? 'Numérique' : 'Physique / phygital'}
              </button>
            ))}
          </div>

          <p className="text-xs font-semibold text-gray-400 uppercase">Stockage</p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'ipfs' as const, label: 'IPFS (Pinata)' },
                { id: 'arweave' as const, label: 'Arweave' },
                { id: 'url' as const, label: 'HTTPS déjà piné' },
              ] as const
            ).map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStorage(s.id)}
                className={`px-3 py-2 rounded-xl border text-xs min-h-[40px] ${
                  storage === s.id ? 'border-indigo-500 bg-indigo-500/15' : 'border-[#2a2a3a]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <label className="block text-sm text-gray-400">
            URI IPFS / gateway
            <input
              className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] px-3 py-2.5 mono text-xs"
              value={ipfsUri}
              onChange={e => setIpfsUri(e.target.value)}
              placeholder="ipfs://Qm… ou https://gateway.pinata.cloud/ipfs/…"
            />
          </label>

          <label className="block text-sm text-gray-400">
            Fichier (préparation — pin via Vellum / Pinata JWT)
            <input
              type="file"
              accept={media === 'image' ? 'image/*' : media === 'video' ? 'video/*' : 'audio/*'}
              className="mt-1 block w-full text-xs"
              onChange={e => setFileName(e.target.files?.[0]?.name || '')}
            />
          </label>
          {fileName && <p className="text-xs text-green-400">Fichier : {fileName}</p>}

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-100/90 space-y-2">
            <p className="font-semibold">YouTube ≠ stockage NFT</p>
            <p>
              Lien promo uniquement (<code>external_url</code>). Vente = marketplace on-chain + média IPFS/Arweave.
            </p>
            <label className="block text-gray-300">
              YouTube (optionnel)
              <input
                className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] px-3 py-2 text-white"
                value={youtubeUrl}
                onChange={e => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=…"
              />
            </label>
            {!ytOk && <p className="text-red-400">URL YouTube invalide</p>}
          </div>

          {mode === 'physical' && (
            <p className="text-xs text-teal-200/90 border border-teal-500/30 rounded-lg p-3">
              Phygital : NFT = certificat. Livraison physique hors chaîne. Rewards $TRO créateur = règles Vellum (1ère
              vente).
            </p>
          )}

          <div className="flex gap-2">
            <button type="button" className="btn-secondary text-sm" onClick={() => setStep(1)}>
              ←
            </button>
            <button type="button" className="btn-primary text-sm flex-1" onClick={() => setStep(3)}>
              Continuer →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card space-y-4">
          <h2 className="font-bold">3 — Métadonnées</h2>
          <label className="block text-sm text-gray-400">
            Titre
            <input
              className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] px-3 py-2.5"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </label>
          <label className="block text-sm text-gray-400">
            Description
            <textarea
              className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] px-3 py-2 min-h-[80px]"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </label>
          <label className="block text-sm text-gray-400">
            Royalties % (0–10)
            <input
              type="number"
              min={0}
              max={10}
              value={royalty}
              onChange={e => setRoyalty(Number(e.target.value))}
              className="mt-1 w-32 rounded-lg bg-[#111118] border border-[#2a2a3a] px-3 py-2"
            />
          </label>
          <ul className="text-xs text-gray-500 space-y-1">
            {checklist.map(c => (
              <li key={c.label}>
                {c.ok ? '✅' : '⬜'} {c.label}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary text-sm" onClick={() => setStep(2)}>
              ←
            </button>
            <button type="button" className="btn-primary text-sm flex-1" disabled={!ready} onClick={() => setStep(4)}>
              Continuer →
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="card space-y-4">
          <h2 className="font-bold">4 — Mint & sell</h2>
          <div className="rounded-xl bg-[#111118] border border-[#2a2a3a] p-4 text-sm space-y-1">
            <p>
              {collectionName} {albumTitle && `· ${albumTitle}`} · <span className="mono">{ticker}</span>
            </p>
            <p>
              {title} · {media} · {mode} · {storage}
            </p>
            {ipfsUri && <p className="mono text-xs text-purple-300 break-all">{ipfsUri}</p>}
            {youtubeUrl && <p className="text-xs text-gray-400">YouTube : {youtubeUrl}</p>}
            <p>Royalties {royalty}%</p>
          </div>

          <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside border border-[#2a2a3a] rounded-xl p-4">
            <li>
              Pin média + JSON metadata (Vellum <code>lia.media</code> / Pinata JWT secret)
            </li>
            <li>Connect wallet <strong>artiste</strong> (pas le wallet protocole LIA)</li>
            <li>Issue collection + mint NFT avec URI IPFS (mxpy / minter SC)</li>
            <li>
              List sur <Link to="/marketplace" className="text-purple-300 underline">Marketplace</Link> ou XOXNO
            </li>
            <li>
              Option : <Link to="/tro" className="text-purple-300 underline">Buy $TRO</Link> pour la gouvernance
            </li>
          </ol>

          <div className="flex flex-wrap gap-2">
            <a href={LINKS.walletWeb} target="_blank" rel="noreferrer" className="btn-primary text-sm">
              Web Wallet
            </a>
            <a href="https://pinata.cloud" target="_blank" rel="noreferrer" className="btn-secondary text-sm">
              Pinata
            </a>
            <Link to="/marketplace" className="btn-secondary text-sm">
              Sell on Market
            </Link>
            <Link to="/dao" className="btn-secondary text-sm">
              DAO / $TRO
            </Link>
          </div>
          <p className="text-xs text-gray-500">
            Gaz mint {GAS_HINT.mint_nft} · list {GAS_HINT.list_nft} · mint auto SC = Sprint suivant post-deploy
          </p>
          <button type="button" className="btn-secondary text-sm" onClick={() => setStep(3)}>
            ← Métadonnées
          </button>
        </div>
      )}
    </div>
  )
}
