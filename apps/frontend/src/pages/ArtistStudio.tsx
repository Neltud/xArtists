import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdSlot from '../components/AdSlot'
import PageGuide from '../components/PageGuide'
import StudioCreatorHub from '../components/StudioCreatorHub'
import StudioPaperMintCard from '../components/StudioPaperMintCard'
import StudioOnChainMintCard from '../components/StudioOnChainMintCard'
import TxCapabilityBanner from '../components/TxCapabilityBanner'
import ScStatusBanner from '../components/ScStatusBanner'
import LiaVsUserBanner from '../components/LiaVsUserBanner'
import { canListBuyNft } from '../config/scStatus'
import { useWallet } from '../context/WalletContext'
import { requestOpenConnect } from '../lib/walletEvents'

type MediaKind = 'image' | 'video' | 'audio'
type AssetMode = 'digital' | 'physical'
type StorageChoice = 'ipfs' | 'arweave' | 'url'

const GAS_HINT: Record<string, string> = {
  issue_collection: '~0.05 EGLD issue + gas',
  mint_nft: '~0.01–0.05 EGLD gas',
  list_nft: '~0.01–0.03 EGLD gas',
}

export default function ArtistStudio() {
  const { connected, address, method } = useWallet()
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
  const [copied, setCopied] = useState(false)

  const marketLive = canListBuyNft()
  const canSign = connected && method !== 'paste_readonly'

  const ytOk =
    !youtubeUrl.trim() ||
    youtubeUrl.includes('youtube.com/') ||
    youtubeUrl.includes('youtu.be/')

  const checklist = useMemo(
    () => [
      { ok: collectionName.trim().length >= 2, label: 'Nom de collection / album' },
      { ok: ticker.trim().length >= 3 && ticker.trim().length <= 10, label: 'Ticker 3–10' },
      { ok: title.trim().length >= 1, label: "Titre de l'œuvre" },
      {
        ok:
          mode === 'physical' ||
          !!fileName ||
          ipfsUri.startsWith('ipfs://') ||
          ipfsUri.startsWith('https://'),
        label: 'Média IPFS/URL ou fichier préparé',
      },
      { ok: ytOk, label: 'YouTube optionnel = lien valide' },
    ],
    [collectionName, ticker, title, fileName, mode, ipfsUri, ytOk],
  )
  const ready = checklist.every(c => c.ok)

  const metadataJson = useMemo(() => {
    const meta: Record<string, unknown> = {
      name: title || collectionName || 'Untitled',
      description: description || '',
      image: ipfsUri || undefined,
      external_url: youtubeUrl.trim() || undefined,
      attributes: [
        { trait_type: 'collection', value: collectionName },
        { trait_type: 'album', value: albumTitle || undefined },
        { trait_type: 'ticker', value: ticker },
        { trait_type: 'media', value: media },
        { trait_type: 'mode', value: mode },
        { trait_type: 'storage', value: storage },
        { trait_type: 'royalties_pct', value: royalty },
        ...(mode === 'physical'
          ? [
              { trait_type: 'rwa_physical', value: true },
              { trait_type: 'tro_reward_cap', value: 1 },
            ]
          : []),
      ].filter(a => a.value !== undefined && a.value !== ''),
      xartists: {
        studio: true,
        model: 'phygital_optional',
        list_blocked_until_marketplace_live: !marketLive,
      },
    }
    return JSON.stringify(meta, null, 2)
  }, [
    title,
    collectionName,
    description,
    ipfsUri,
    youtubeUrl,
    albumTitle,
    ticker,
    media,
    mode,
    storage,
    royalty,
    marketLive,
  ])

  const downloadMeta = () => {
    const blob = new Blob([metadataJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(ticker || 'xart').toLowerCase()}-metadata.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyMeta = async () => {
    try {
      await navigator.clipboard.writeText(metadataJson)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="animate-fade-in max-w-3xl mx-auto pb-24 md:pb-8">
      <PageGuide page="studio" />
      <StudioCreatorHub />
      <LiaVsUserBanner tone="user" />

      <header className="mb-4 space-y-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-violet-400/80 font-semibold">
          Création · MultiversX mainnet
        </p>
        <h1 className="text-3xl font-black">
          Studio <span className="gradient-text">xArtists</span>
        </h1>
        <p className="text-gray-500 text-sm">
          <strong className="text-gray-300">préparer → pin → mint (paper ou on-chain) → list</strong>
          {' · '}wallet artiste (pas LIA ops)
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link to="/museum" className="btn-secondary text-xs">
            Galerie
          </Link>
          <Link to="/marketplace" className="btn-secondary text-xs">
            Marketplace
          </Link>
          <Link to="/my-packs" className="btn-secondary text-xs">
            My Packs
          </Link>
        </div>
      </header>

      <ScStatusBanner />
      <TxCapabilityBanner />

      {!connected ? (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-100 flex flex-wrap items-center justify-between gap-2">
          <span>Connecte ton wallet artiste pour mint / list.</span>
          <button type="button" className="btn-primary text-xs" onClick={requestOpenConnect}>
            Connect
          </button>
        </div>
      ) : (
        <p className="mb-4 text-[11px] text-zinc-500 mono break-all">
          Session {method} · {address}
          {!canSign && ' · lecture seule'}
        </p>
      )}

      <div className="mb-6">
        <AdSlot id="studio_banner" />
      </div>

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
              step === i + 1
                ? 'border-purple-500 bg-purple-500/15 text-purple-100'
                : 'border-[#2a2a3a] text-gray-500'
            }`}
          >
            <span className="font-black">{s.n}</span> {s.t}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-2 mb-4 text-xs font-semibold">
        {[1, 2, 3, 4].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => setStep(n)}
            className={`px-3 py-1.5 rounded-full border min-h-[40px] ${
              step === n
                ? 'border-purple-500 bg-purple-500/20 text-purple-200'
                : 'border-[#2a2a3a] text-gray-500'
            }`}
          >
            Étape {n}
          </button>
        ))}
      </div>

      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-4" aria-hidden>
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all duration-300"
          style={{ width: `${(step / 4) * 100}%` }}
        />
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
            Ticker (3–10)
            <input
              className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] px-3 py-2.5 mono"
              value={ticker}
              onChange={e => setTicker(e.target.value.toUpperCase().slice(0, 10))}
              placeholder="XART"
            />
          </label>
          <p className="text-xs text-gray-500">Gaz issue : {GAS_HINT.issue_collection}</p>
          <button type="button" className="btn-primary text-sm" onClick={() => setStep(2)}>
            Continuer →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card space-y-4">
          <h2 className="font-bold">2 — Média & stockage</h2>
          <div className="flex flex-wrap gap-2">
            {(['image', 'video', 'audio'] as MediaKind[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMedia(m)}
                className={`px-4 py-2.5 rounded-xl border text-sm capitalize ${
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
                className={`px-4 py-2.5 rounded-xl border text-sm ${
                  mode === m ? 'border-teal-500 bg-teal-500/15' : 'border-[#2a2a3a]'
                }`}
              >
                {m === 'digital' ? 'Numérique' : 'Physique / phygital'}
              </button>
            ))}
          </div>
          <label className="block text-sm text-gray-400">
            URI IPFS / gateway
            <input
              className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] px-3 py-2.5 mono text-xs"
              value={ipfsUri}
              onChange={e => setIpfsUri(e.target.value)}
              placeholder="ipfs://Qm… ou https://…"
            />
          </label>
          <label className="block text-sm text-gray-400">
            Fichier local (pin hors front)
            <input
              type="file"
              className="mt-1 block w-full text-xs"
              onChange={e => setFileName(e.target.files?.[0]?.name || '')}
            />
          </label>
          {fileName && <p className="text-xs text-green-400">Fichier : {fileName}</p>}
          <label className="block text-sm text-gray-400">
            YouTube (optionnel)
            <input
              className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] px-3 py-2"
              value={youtubeUrl}
              onChange={e => setYoutubeUrl(e.target.value)}
            />
          </label>
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
              onChange={e => setRoyalty(Math.min(10, Math.max(0, Number(e.target.value))))}
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
          <div className="rounded-xl border border-[#2a2a3a] bg-[#0a0a0f] p-3">
            <div className="flex justify-between mb-2">
              <p className="text-xs font-semibold text-zinc-400">Metadata JSON</p>
              <div className="flex gap-2">
                <button type="button" className="btn-secondary text-[10px] py-1" onClick={copyMeta}>
                  {copied ? 'Copié' : 'Copier'}
                </button>
                <button type="button" className="btn-secondary text-[10px] py-1" onClick={downloadMeta}>
                  Télécharger
                </button>
              </div>
            </div>
            <pre className="text-[10px] mono text-zinc-500 overflow-x-auto max-h-40">{metadataJson}</pre>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary text-sm" onClick={() => setStep(2)}>
              ←
            </button>
            <button
              type="button"
              className="btn-primary text-sm flex-1"
              disabled={!ready}
              onClick={() => setStep(4)}
            >
              Continuer →
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <>
          <StudioOnChainMintCard
            ready={ready}
            collectionName={collectionName}
            ticker={ticker}
            title={title}
            description={description}
            royalty={royalty}
            ipfsUri={ipfsUri}
            youtubeUrl={youtubeUrl}
            metadataJson={metadataJson}
          />
          <StudioPaperMintCard
            ready={ready}
            collectionName={collectionName}
            ticker={ticker}
            title={title}
            description={description}
            media={media}
            mode={mode}
            storage={storage}
            ipfsUri={ipfsUri}
            youtubeUrl={youtubeUrl}
            royalty={royalty}
            metadataJson={metadataJson}
            artistAddress={address || undefined}
          />
          <div className="card space-y-3">
            <h2 className="font-bold">Ensuite · list & sell</h2>
            <p className="text-xs text-zinc-500">
              Gaz mint : {GAS_HINT.mint_nft} · list : {GAS_HINT.list_nft}
              {!marketLive && ' · Marketplace SC gated CODEHASH jusqu activation.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-secondary text-sm" onClick={() => setStep(3)}>
                ←
              </button>
              <Link to="/marketplace" className="btn-primary text-sm">
                Marketplace
              </Link>
              <Link to="/museum" className="btn-secondary text-sm">
                Galerie
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
