import {localizeChild as xaLocalize, renderChild as xaRender, usePhraseLocale as xaUsePhraseLocale} from '../i18n/phraseRuntime'
/** Creator Studio — collections + mint + list + certification phygital. */
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useUserAccount } from '../hooks/useUserAccount'
import { useStudioMintTx } from '../hooks/useStudioMintTx'
import { requestOpenConnect } from '../lib/walletEvents'
import { canListBuyNft, canBuyAgent } from '../config/scStatus'
import PhysicalNftCertifier from '../components/PhysicalNftCertifier'
import CreatorMediaUpload from '../components/CreatorMediaUpload'
import ArtworkTurntableLab from '../components/ArtworkTurntableLab'
import MainnetJourney from '../components/MainnetJourney'
import { useToast } from '../components/ui/Toast'
import { asText } from '../lib/safeRender'
import { saveStudioCollection } from '../lib/studioOnChainMint'

export default function StudioPage() {
  xaUsePhraseLocale()

  const [params] = useSearchParams()
  const sculptureMode = params.get('mode') === 'sculpture'
  const { connected, address, canAttemptSign } = useWallet()
  const account = useUserAccount(connected ? address : null)
  const nfts = account.nfts || []
  const listLive = canListBuyNft()
  const agentMint = canBuyAgent()
  const [picked, setPicked] = useState<string | null>(null)
  const [name, setName] = useState('Atelier')
  const [ticker, setTicker] = useState('ATELIER')
  const [nftName, setNftName] = useState('Oeuvre 1')
  const [nftMediaUri, setNftMediaUri] = useState('')
  const [pinnedMedia, setPinnedMedia] = useState<{mediaUri:string;metadataUri:string;attributes:string;title:string}|null>(null)
  const [tokenIdInput, setTokenIdInput] = useState('')
  const mint = useStudioMintTx()
  const { push } = useToast()

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
    (tokenIdInput.trim().match(/^[A-Z0-9]+-[a-f0-9]{6}$/i) ? tokenIdInput.trim() : '') ||
    mint.collection?.tokenIdentifier || ''

  const selectExisting = (id: string) => {
    setTokenIdInput(id)
    const tickerOnly = id.split('-')[0] || id
    const rec = {
      ticker: tickerOnly,
      name: tickerOnly,
      tokenIdentifier: id,
      roleSet: false,
      walletAddress: address,
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
      r.ok ? (r.confirmed ? 'Collection émise — copie son identifiant depuis Explorer' : 'Collection demandée — en attente de confirmation') : asText(r.error, 'Échec'),
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
    push(r.ok ? (r.alreadySet ? 'Rôle NFTCreate déjà confirmé on-chain' : 'Rôle demandé — vérifie Explorer avant mint') : asText(r.error, 'Échec'), r.ok ? 'ok' : 'err')
  }

  const runMint = async () => {
    const id = activeCollectionId
    if (!id) {
      push('Sélectionne une collection existante ou issue-en une', 'err')
      return
    }
    if (pinnedMedia && pinnedMedia.title !== nftName.trim()) {
      push('Le titre a changé depuis le pin IPFS. Recrée les métadonnées avant de signer.', 'err')
      return
    }
    const r = await mint.createNft({
      tokenIdentifier: id,
      name: nftName,
      royaltiesPct: 5,
      attributes: pinnedMedia && pinnedMedia.mediaUri===nftMediaUri.trim() ? pinnedMedia.attributes : 'studio:xartists',
      uris: [nftMediaUri.trim()],
    })
    push(r.ok ? (r.confirmed ? 'Mint confirmé sur MultiversX' : 'Mint soumis, confirmation blockchain en attente') : asText(r.error, 'Échec'), r.ok ? 'ok' : 'err')
  }

  return (
    <div className="xa-creator-studio animate-fade-in mx-auto max-w-3xl space-y-8 px-4 pb-28 pt-6 sm:px-7">
      <header className="space-y-1">
        <p className="section-label">{xaRender("Création")}</p>
        <h1 className="section-title display text-2xl">{xaRender(sculptureMode ? "Créer le NFT de ma sculpture" : "Creator Studio")}</h1>
        <p className="text-sm leading-7 text-[color:var(--xa-text-secondary)]">
          {xaRender("Prépare ton œuvre, publie-la sur IPFS, puis crée ton NFT avec la signature de ton propre wallet. Aucun mint automatique. ")}</p>
      </header>

      <MainnetJourney current="studio" />
      <section aria-label="Parcours création sculpture" className="card space-y-2 border border-cyan-500/25">
        <h2 className="font-semibold text-[color:var(--xa-text)]">Ma sculpture → NFT sur MultiversX</h2>
        <p className="text-sm text-[color:var(--xa-text-secondary)]">
          Photographie ou modèle GLB de ton œuvre physique, collection artiste, média publié sur IPFS, puis signature du mint dans ton wallet. La rotation de photos n'est pas une reconstruction 3D certifiée.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link to="/lab?view=3d" className="btn-secondary text-sm">1 · Prévisualiser la sculpture</Link>
          <Link to="/create/digital-twin" className="btn-secondary text-sm">2 · Préparer le jumeau 3D</Link>
          <a href="#xa-studio-mint" className="btn-primary text-sm">3 · Publier puis signer le NFT</a>
          <Link to="/marketplace#xa-market-sell" className="btn-secondary text-sm">4 · Mettre en vente</Link>
        </div>
        <p className="text-xs text-amber-900 dark:text-amber-100">Le mint exige la preuve du rôle NFTCreate, un média distant valide et une signature humaine. La récompense proposée de 1 TRO par NFT physique vérifié n'est pas versée automatiquement.</p>
      </section>

      <ol className="xa-studio-steps" aria-label="Étapes pour créer un NFT artiste">
        <li><strong>1 · Wallet</strong><span>Connecte ton compte artiste.</span></li>
        <li><strong>2 · Collection</strong><span>Choisis une collection et vérifie ton rôle.</span></li>
        <li><strong>3 · IPFS</strong><span>Prépare et publie les médias avec leurs droits.</span></li>
        <li><strong>4 · Signature</strong><span>Contrôle les frais et confirme dans ton wallet.</span></li>
      </ol>

      <section className="card xa-studio-workflow space-y-4">
        <h2 className="text-sm font-semibold text-[color:var(--xa-text)]">
          {xaRender("Mes collections (")}{xaRender(ownedCollections.length)})
        </h2>
        {xaRender(!connected ? (
          <button type="button" className="btn-primary text-sm" onClick={requestOpenConnect}>
            {xaRender("Connecter wallet ")}</button>
        ) : ownedCollections.length === 0 ? (
          <p className="text-sm text-[color:var(--xa-text-secondary)]">
            {xaRender("Aucune collection NFT détectée sur ce wallet — crée-en une ci-dessous. ")}</p>
        ) : (
          <div className="max-h-40 overflow-y-auto space-y-1.5 rounded-xl border border-[color:var(--xa-border)] p-2">
            {xaRender(ownedCollections.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => selectExisting(c.id)}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm border transition ${
                  activeCollectionId === c.id
                    ? 'border-emerald-400/50 bg-emerald-500/10 text-[color:var(--xa-text)]'
                    : 'border-transparent hover:bg-[color:var(--xa-surface-hover)] text-zinc-300'
                }`}
              >
                <span className="mono font-medium">{xaRender(c.id)}</span>
                <span className="text-[color:var(--xa-text-secondary)]"> · {xaRender(c.count)} {xaRender(" NFT")}</span>
              </button>
            )))}
          </div>
        ))}
        <label className="block text-sm text-[color:var(--xa-text-secondary)]">
          {xaRender("Ou coller un token id (TICKER-xxxxxx) ")}<input
            value={tokenIdInput}
            onChange={e => setTokenIdInput(e.target.value.trim())}
            placeholder={xaLocalize("XART-abc123")}
            className="mt-1 w-full rounded-lg border border-[color:var(--xa-border)] bg-[color:var(--xa-bg-elevated)] px-2 py-1.5 text-sm text-[color:var(--xa-text)] mono"
          />
        </label>
        {xaRender(activeCollectionId && (
          <p className="text-sm text-emerald-900 dark:text-emerald-200 mono">{xaRender("Active : ")}{xaRender(activeCollectionId)}</p>
        ))}
      </section>

      <section className="card xa-studio-workflow space-y-3">
        <h2 className="text-sm font-semibold text-[color:var(--xa-text)]">{xaRender("Nouvelle collection (optionnel)")}</h2>
        {xaRender(connected && (
          <p className="text-sm text-[color:var(--xa-text-secondary)] mono truncate">{xaRender(asText(address))}</p>
        ))}
        <label className="block text-sm text-[color:var(--xa-text-secondary)]">
          {xaRender("Nom ")}<input
            value={name}
            onChange={e => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[color:var(--xa-border)] bg-[color:var(--xa-bg-elevated)] px-2 py-1.5 text-sm text-[color:var(--xa-text)]"
          />
        </label>
        <label className="block text-sm text-[color:var(--xa-text-secondary)]">
          {xaRender("Ticker (A-Z 3–10) ")}<input
            value={ticker}
            onChange={e => setTicker(e.target.value.toUpperCase())}
            className="mt-1 w-full rounded-lg border border-[color:var(--xa-border)] bg-[color:var(--xa-bg-elevated)] px-2 py-1.5 text-sm text-[color:var(--xa-text)]"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary text-sm"
            disabled={mint.pending || !canAttemptSign}
            onClick={() => void runIssue()}
          >
            {xaRender(mint.pending ? 'Signature…' : 'Créer une collection')}
          </button>
          <button
            type="button"
            className="btn-secondary text-sm"
            disabled={mint.pending || !activeCollectionId}
            onClick={() => void runRole()}
          >
            {xaRender("Autoriser la création NFT ")}</button>
        </div>
        <p className="text-xs text-[color:var(--xa-text-secondary)]">
          {xaRender("Après issue : récupère le token id sur l’explorer (TICKER-xxxxxx), colle-le ci-dessus, puis rôle + mint. ")}</p>
      </section>

      <div id="xa-studio-turntable"><ArtworkTurntableLab /></div>

      <section id="xa-studio-mint" className="card xa-studio-workflow space-y-3">
        <h2 className="text-sm font-semibold text-[color:var(--xa-text)]">{xaRender("Préparer et créer mon NFT")}</h2>
        <label className="block text-sm font-medium" htmlFor="xa-studio-nft-name">
          Nom de l’œuvre à publier
        </label>
        <input
          id="xa-studio-nft-name"
          value={nftName}
          onChange={e => setNftName(e.target.value)}
          className="w-full rounded-lg border border-[color:var(--xa-border)] bg-[color:var(--xa-bg-elevated)] px-2 py-1.5 text-sm text-[color:var(--xa-text)]"
          placeholder={xaLocalize("Nom de l’œuvre")}
          maxLength={50}
        />
        <CreatorMediaUpload title={nftName} onReady={pin => {
          setPinnedMedia(pin)
          setNftMediaUri(pin?.mediaUri || '')
        }} />
        <label className="block text-sm text-[color:var(--xa-text-secondary)]">
          2. URI média IPFS/HTTPS (automatique après upload, ou saisie manuelle)
          <input
            value={nftMediaUri}
            onChange={e => {setNftMediaUri(e.target.value);setPinnedMedia(null)}}
            className="mt-1 w-full rounded-lg border border-[color:var(--xa-border)] bg-[color:var(--xa-bg-elevated)] px-3 py-2 text-xs text-[color:var(--xa-text)]"
            placeholder="ipfs://bafy.../artwork.png"
          />
        </label>
        <p className="text-xs text-amber-900 dark:text-amber-100">Un fichier sélectionné seul ne suffit pas : le mint exige un upload IPFS confirmé ou une URL déjà hébergée. Vérifie la collection, le rôle NFTCreate et les détails dans xPortal avant la signature.</p>
        <button
          type="button"
          className="btn-secondary text-sm"
          disabled={mint.pending || !activeCollectionId || !nftMediaUri.trim() || !mint.canSign}
          onClick={() => void runMint()}
        >
          {xaRender(mint.pending ? 'Signature…' : 'Signer la création NFT')}
        </button>
        {mint.lastTx && <p className="break-all text-xs text-cyan-900 dark:text-cyan-100">Session / Tx : {mint.lastTx}
          {/^[a-f0-9]{64}$/i.test(mint.lastTx) && <a
            href={'https://explorer.multiversx.com/transactions/' + mint.lastTx}
            target="_blank" rel="noopener noreferrer" className="ml-2 underline">Voir Explorer</a>}
        </p>}
        {xaRender(mint.error && <p className="text-sm text-amber-900 dark:text-amber-100">{xaRender(asText(mint.error))}</p>)}
      </section>

      <section className="card xa-studio-workflow space-y-3">
        <h2 className="text-sm font-semibold text-[color:var(--xa-text)]">{xaRender("Mes NFT (")}{xaRender(owned.length)})</h2>
        {xaRender(connected && owned.length === 0 && (
          <p className="text-sm text-[color:var(--xa-text-secondary)]">{xaRender("Aucun NFT — mint ou importe une collection.")}</p>
        ))}
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto">
          {xaRender(owned.map(n => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => setPicked(n.id)}
                className={`w-full text-left rounded-xl border p-2 ${
                  picked === n.id ? 'border-violet-400/50 bg-violet-500/10' : 'border-[color:var(--xa-border)]'
                }`}
              >
                {xaRender(n.thumb ? (
                  <img
                    src={n.thumb}
                    alt=""
                    className="w-full aspect-square object-cover rounded-lg mb-1.5 bg-[color:var(--xa-surface-hover)]"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full aspect-square rounded-lg mb-1.5 bg-[color:var(--xa-surface-hover)]" />
                ))}
                <p className="text-xs text-[color:var(--xa-text)] truncate">{xaRender(asText(n.name))}</p>
                <p className="text-xs text-[color:var(--xa-text-secondary)] mono truncate">{xaRender(n.collection)}</p>
              </button>
            </li>
          )))}
        </ul>
        {xaRender(picked && (
          <Link
            to={`/marketplace?list=${encodeURIComponent(picked)}`}
            className="btn-primary text-sm inline-block"
          >
            {xaRender("Mettre en vente ")}</Link>
        ))}
        <div className="flex flex-wrap gap-2">
          <Link to="/marketplace" className="btn-secondary text-sm inline-block">
            {xaRender("Marketplace")}{xaRender(listLive ? ' · live' : '')}
          </Link>
          <Link to="/my-packs" className="btn-secondary text-sm inline-block">
            {xaRender("Mes salles ")}</Link>
        </div>
      </section>

      <section className="card xa-studio-surface space-y-4 border border-[color:var(--xa-border)] bg-[color:var(--xa-surface)]">
        <h2 className="text-sm font-semibold text-[color:var(--xa-text)]">{xaRender("Certification Phygital")}</h2>
        <p className="text-sm text-[color:var(--xa-text-secondary)] leading-relaxed">
          {xaRender("Photo HD → hash SHA-256 local → certificats CoA / CoP. Réévaluation future via intention xOrus ")}<code className="text-xs text-[color:var(--xa-text-secondary)]"> PHYGITAL_REEVAL</code>.
        </p>
        <PhysicalNftCertifier />
      </section>

      <section className="card xa-studio-surface space-y-4">
        <h2 className="text-sm font-semibold text-[color:var(--xa-text)]">
          {xaRender("Packs Agent IA")}{xaRender(agentMint ? '' : ' · bientôt on-chain')}
        </h2>
        <p role="status" className="mt-3 text-xs leading-6 text-[color:var(--xa-text-secondary)]">
          Découverte uniquement : les packs Genesis ne sont pas en vente. Les objectifs 33 / 22 / 11 EGLD ne sont pas des devis, et les abonnements Stripe sans wallet ne contiennent aucun NFT.
        </p>
        <Link to="/offres" className="mt-3 inline-flex min-h-[44px] items-center rounded-xl border border-[color:var(--xa-border)] px-4 py-2 text-xs text-[color:var(--xa-text)]">
          Comparer les offres et leur disponibilité
        </Link>
      </section>
    </div>
  )
}
