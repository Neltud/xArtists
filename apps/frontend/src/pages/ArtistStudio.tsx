import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LINKS } from '../config/links'

type MediaKind = 'image' | 'video' | 'audio'
type AssetMode = 'digital' | 'physical'

/** Gas order-of-magnitude EGLD (UI hints — exact via network) */
const GAS_HINT: Record<string, string> = {
  issue_collection: '~0.05–0.15 EGLD (estim.)',
  mint_nft: '~0.01–0.05 EGLD (estim.)',
  list_nft: '~0.01–0.03 EGLD (estim.)',
}

export default function ArtistStudio() {
  const [step, setStep] = useState(1)
  const [collectionName, setCollectionName] = useState('')
  const [albumTitle, setAlbumTitle] = useState('')
  const [ticker, setTicker] = useState('')
  const [media, setMedia] = useState<MediaKind>('image')
  const [mode, setMode] = useState<AssetMode>('digital')
  const [title, setTitle] = useState('')
  const [royalty, setRoyalty] = useState(5)
  const [fileName, setFileName] = useState('')

  const checklist = useMemo(
    () => [
      { ok: collectionName.trim().length >= 2, label: 'Nom de collection / album' },
      { ok: ticker.trim().length >= 3 && ticker.trim().length <= 10, label: 'Ticker 3–10 caractères' },
      { ok: title.trim().length >= 1, label: 'Titre de l’œuvre' },
      { ok: !!fileName || mode === 'physical', label: 'Fichier média (ou phygital sans fichier)' },
    ],
    [collectionName, ticker, title, fileName, mode]
  )
  const ready = checklist.every(c => c.ok)

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-black">🎨 Artist Studio</h1>
        <p className="text-gray-500 mt-1">
          Créer une collection / album et préparer un NFT (image, vidéo, musique) — parcours artiste mainnet
        </p>
      </header>

      {/* Steps */}
      <div className="flex gap-2 mb-6 text-xs font-semibold">
        {[1, 2, 3, 4].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => setStep(n)}
            className={`px-3 py-1.5 rounded-full border ${
              step === n ? 'border-purple-500 bg-purple-500/20 text-purple-200' : 'border-[#2a2a3a] text-gray-500'
            }`}
          >
            {n}. {['Collection', 'Média', 'Métadonnées', 'Publier'][n - 1]}
          </button>
        ))}
      </div>

      {step === 1 && (
        <div className="card space-y-4">
          <h2 className="font-bold">1 — Nouvelle collection / album</h2>
          <label className="block text-sm text-gray-400">
            Nom collection
            <input
              className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] px-3 py-2 text-white"
              value={collectionName}
              onChange={e => setCollectionName(e.target.value)}
              placeholder="xArtists Genesis"
            />
          </label>
          <label className="block text-sm text-gray-400">
            Titre album (optionnel)
            <input
              className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] px-3 py-2 text-white"
              value={albumTitle}
              onChange={e => setAlbumTitle(e.target.value)}
              placeholder="Album 01"
            />
          </label>
          <label className="block text-sm text-gray-400">
            Ticker on-chain
            <input
              className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] px-3 py-2 text-white mono"
              value={ticker}
              onChange={e => setTicker(e.target.value.toUpperCase().slice(0, 10))}
              placeholder="XART"
            />
          </label>
          <p className="text-xs text-gray-500">Gaz estimé issue collection : {GAS_HINT.issue_collection}</p>
          <button type="button" className="btn-primary text-sm" onClick={() => setStep(2)}>
            Continuer →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card space-y-4">
          <h2 className="font-bold">2 — Type de média</h2>
          <div className="flex flex-wrap gap-2">
            {(['image', 'video', 'audio'] as MediaKind[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMedia(m)}
                className={`px-4 py-2 rounded-xl border text-sm capitalize ${
                  media === m ? 'border-purple-500 bg-purple-500/15' : 'border-[#2a2a3a]'
                }`}
              >
                {m === 'image' ? '🖼️' : m === 'video' ? '🎬' : '🎵'} {m}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {(['digital', 'physical'] as AssetMode[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-4 py-2 rounded-xl border text-sm capitalize ${
                  mode === m ? 'border-teal-500 bg-teal-500/15' : 'border-[#2a2a3a]'
                }`}
              >
                {m === 'digital' ? 'Numérique' : 'Physique / phygital'}
              </button>
            ))}
          </div>
          {mode === 'physical' && (
            <p className="text-xs text-amber-300/90 border border-amber-500/30 rounded-lg p-3">
              Phygital : le NFT certifie l’authenticité. La livraison de l’objet physique reste hors chaîne
              (contrat artiste / acheteur).
            </p>
          )}
          <label className="block text-sm text-gray-400">
            Fichier (préparation — upload IPFS hors navigateur pour gros médias)
            <input
              type="file"
              accept={
                media === 'image' ? 'image/*' : media === 'video' ? 'video/*' : 'audio/*'
              }
              className="mt-1 block w-full text-xs text-gray-400"
              onChange={e => setFileName(e.target.files?.[0]?.name || '')}
            />
          </label>
          {fileName && <p className="text-xs text-green-400">Sélectionné : {fileName}</p>}
          <button type="button" className="btn-primary text-sm" onClick={() => setStep(3)}>
            Continuer →
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="card space-y-4">
          <h2 className="font-bold">3 — Métadonnées</h2>
          <label className="block text-sm text-gray-400">
            Titre de l’œuvre
            <input
              className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] px-3 py-2"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </label>
          <label className="block text-sm text-gray-400">
            Royalties % (max 10 % recommandé)
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
          <p className="text-xs text-gray-500">Gaz mint : {GAS_HINT.mint_nft}</p>
          <button type="button" className="btn-primary text-sm" onClick={() => setStep(4)} disabled={!ready}>
            Continuer →
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="card space-y-4">
          <h2 className="font-bold">4 — Publier (mainnet)</h2>
          <div className="rounded-xl bg-[#111118] border border-[#2a2a3a] p-4 text-sm space-y-1">
            <p>
              <span className="text-gray-500">Collection</span> {collectionName}{' '}
              {albumTitle && `· ${albumTitle}`}
            </p>
            <p>
              <span className="text-gray-500">Ticker</span> <span className="mono">{ticker}</span>
            </p>
            <p>
              <span className="text-gray-500">Œuvre</span> {title} · {media} · {mode}
            </p>
            <p>
              <span className="text-gray-500">Royalties</span> {royalty}%
            </p>
          </div>
          <p className="text-sm text-amber-200/90 border border-amber-500/30 rounded-lg p-3">
            Les transactions <strong>issue + mint</strong> se signent avec <strong>votre</strong> wallet MultiversX.
            Cette UI prépare le parcours ; le mint on-chain complet nécessite le minter SC / mxpy (Sprint
            artiste) — pas de PEM dans le navigateur.
          </p>
          <div className="flex flex-wrap gap-2">
            <a href={LINKS.walletWeb} target="_blank" rel="noreferrer" className="btn-primary text-sm">
              Ouvrir Web Wallet
            </a>
            <Link to="/marketplace" className="btn-secondary text-sm">
              Aller au Marketplace
            </Link>
            <Link to="/gallery" className="btn-secondary text-sm">
              Galerie
            </Link>
          </div>
          <p className="text-xs text-gray-500">Après mint : Sell / List sur marketplace · gaz list {GAS_HINT.list_nft}</p>
        </div>
      )}

      <div className="mt-8 card text-sm text-gray-400">
        <p className="font-semibold text-white mb-2">Parcours résumé</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Connecter wallet artiste</li>
          <li>Créer collection / album + ticker</li>
          <li>Préparer média (IPFS pour vidéo/audio lourds)</li>
          <li>Metadata + royalties</li>
          <li>Estimer gaz → signer issue/mint</li>
          <li>Lister à la vente ou garder en galerie</li>
        </ol>
      </div>
    </div>
  )
}
