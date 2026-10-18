/** Creator Studio — collections + mint + list + certification phygital. Protocol UI. */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useUserAccount } from '../hooks/useUserAccount'
import { useStudioMintTx } from '../hooks/useStudioMintTx'
import { requestOpenConnect } from '../lib/walletEvents'
import { canListBuyNft, canBuyAgent } from '../config/scStatus'
import PackCheckout from '../components/PackCheckout'
import PhysicalNftCertifier from '../components/PhysicalNftCertifier'
import { useToast } from '../components/ui/Toast'
import { asText } from '../lib/safeRender'
import { saveStudioCollection } from '../lib/studioOnChainMint'
import { useI18n } from '../i18n/I18nContext'

export default function StudioPage() {
  const { t, lang } = useI18n()
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
  const isFr = lang === 'fr'

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
    push(isFr ? `Collection active : ${id}` : `Active collection: ${id}`, 'ok')
  }

  const runIssue = async () => {
    if (!connected) return requestOpenConnect()
    const r = await mint.issueCollection(name, ticker)
    push(
      r.ok
        ? isFr
          ? 'Collection envoyée — signe dans xPortal'
          : 'Collection sent — sign in xPortal'
        : asText(r.error, isFr ? 'Échec' : 'Failed'),
      r.ok ? 'ok' : 'err',
    )
  }

  const runRole = async () => {
    const id = activeCollectionId
    if (!id) {
      push(isFr ? 'Choisis ou saisis un token id' : 'Select or paste a token id', 'err')
      return
    }
    const r = await mint.setCreateRole(id)
    push(
      r.ok
        ? isFr
          ? 'Rôle NFTCreate envoyé'
          : 'NFTCreate role sent'
        : asText(r.error, isFr ? 'Échec' : 'Failed'),
      r.ok ? 'ok' : 'err',
    )
  }

  const runMint = async () => {
    const id = activeCollectionId
    if (!id) {
      push(isFr ? 'Sélectionne une collection' : 'Select a collection', 'err')
      return
    }
    const r = await mint.createNft({
      tokenIdentifier: id,
      name: nftName,
      royaltiesPct: 5,
      attributes: 'studio:xartists',
      uris: [],
    })
    push(
      r.ok
        ? isFr
          ? 'Mint envoyé — signe xPortal'
          : 'Mint sent — sign xPortal'
        : asText(r.error, isFr ? 'Échec' : 'Failed'),
      r.ok ? 'ok' : 'err',
    )
  }

  const inputClass =
    'mt-1 w-full rounded-xl border border-[var(--xa-border)] bg-black/40 px-3 py-2 text-sm text-[var(--xa-text)]'

  return (
    <div className="xa-page animate-fade-in space-y-6 max-w-xl mx-auto pb-16">
      <header className="xa-hero" style={{ paddingTop: '1.25rem', maxWidth: '100%' }}>
        <p className="xa-hero__kicker">{t('nav.studio')}</p>
        <h1 className="xa-hero__title">Creator Studio</h1>
        <p className="xa-hero__lead">
          {isFr
            ? 'Collection existante ou nouvelle → mint → list Marketplace. Signature xPortal uniquement.'
            : 'Existing or new collection → mint → Marketplace list. xPortal signature only.'}
        </p>
      </header>

      <section className="xa-card space-y-3">
        <h2 className="text-sm font-semibold text-[var(--xa-text)]">
          {isFr ? 'Mes collections' : 'My collections'} ({ownedCollections.length})
        </h2>
        {!connected ? (
          <button type="button" className="xa-btn-primary text-sm" onClick={requestOpenConnect}>
            {t('common.connect')}
          </button>
        ) : ownedCollections.length === 0 ? (
          <p className="text-sm text-[var(--xa-text-muted)]">
            {isFr
              ? 'Aucune collection NFT — crée-en une ci-dessous.'
              : 'No NFT collection — create one below.'}
          </p>
        ) : (
          <div className="max-h-40 overflow-y-auto space-y-1.5 rounded-xl border border-[var(--xa-border)] p-2">
            {ownedCollections.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => selectExisting(c.id)}
                className={`w-full text-left rounded-lg px-3 py-2 text-xs border transition ${
                  activeCollectionId === c.id
                    ? 'border-[var(--xa-border-strong)] bg-white/5 text-[var(--xa-text)]'
                    : 'border-transparent hover:bg-white/5 text-[var(--xa-text-secondary)]'
                }`}
              >
                <span className="mono font-medium">{c.id}</span>
                <span className="text-[var(--xa-text-muted)]"> · {c.count} NFT</span>
              </button>
            ))}
          </div>
        )}
        <label className="block text-xs text-[var(--xa-text-muted)]">
          {isFr ? 'Ou coller un token id' : 'Or paste token id'}
          <input
            value={tokenIdInput}
            onChange={e => setTokenIdInput(e.target.value.trim())}
            placeholder="XART-abc123"
            className={`${inputClass} mono`}
          />
        </label>
        {activeCollectionId && (
          <p className="text-xs text-[var(--xa-accent)] mono">Active · {activeCollectionId}</p>
        )}
      </section>

      <section className="xa-card space-y-3">
        <h2 className="text-sm font-semibold text-[var(--xa-text)]">
          {isFr ? 'Nouvelle collection' : 'New collection'}
        </h2>
        {connected && (
          <p className="text-xs text-[var(--xa-text-muted)] mono truncate">{asText(address)}</p>
        )}
        <label className="block text-xs text-[var(--xa-text-muted)]">
          {isFr ? 'Nom' : 'Name'}
          <input value={name} onChange={e => setName(e.target.value)} className={inputClass} />
        </label>
        <label className="block text-xs text-[var(--xa-text-muted)]">
          Ticker (A-Z 3–10)
          <input
            value={ticker}
            onChange={e => setTicker(e.target.value.toUpperCase())}
            className={inputClass}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="xa-btn-primary text-sm"
            disabled={mint.pending || !canAttemptSign}
            onClick={() => void runIssue()}
          >
            {mint.pending ? '…' : isFr ? 'Issue collection' : 'Issue collection'}
          </button>
          <button
            type="button"
            className="xa-btn-secondary text-sm"
            disabled={mint.pending || !activeCollectionId}
            onClick={() => void runRole()}
          >
            Set NFTCreate role
          </button>
        </div>
        <p className="xa-disclaimer">
          {isFr
            ? 'Après issue : récupère le token id explorer, colle-le, puis rôle + mint.'
            : 'After issue: get token id from explorer, paste, then role + mint.'}
        </p>
      </section>

      <section className="xa-card space-y-3">
        <h2 className="text-sm font-semibold text-[var(--xa-text)]">Mint NFT</h2>
        <input
          value={nftName}
          onChange={e => setNftName(e.target.value)}
          className={inputClass}
          placeholder={isFr ? 'Nom de l’œuvre' : 'Artwork name'}
        />
        <button
          type="button"
          className="xa-btn-secondary text-sm"
          disabled={mint.pending || !activeCollectionId}
          onClick={() => void runMint()}
        >
          {mint.pending ? '…' : isFr ? 'Créer NFT' : 'Create NFT'}
        </button>
        {mint.error && <p className="text-xs text-[var(--xa-accent)]">{asText(mint.error)}</p>}
      </section>

      <section className="xa-card space-y-3">
        <h2 className="text-sm font-semibold text-[var(--xa-text)]">
          {isFr ? 'Mes NFT' : 'My NFTs'} ({owned.length})
        </h2>
        {connected && owned.length === 0 && (
          <p className="text-sm text-[var(--xa-text-muted)]">
            {isFr ? 'Aucun NFT — mint ou importe.' : 'No NFTs — mint or import.'}
          </p>
        )}
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto">
          {owned.map(n => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => setPicked(n.id)}
                className={`w-full text-left rounded-xl border p-2 ${
                  picked === n.id
                    ? 'border-[var(--xa-border-strong)] bg-white/5'
                    : 'border-[var(--xa-border)]'
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
                <p className="text-[11px] text-[var(--xa-text-secondary)] truncate">{asText(n.name)}</p>
              </button>
            </li>
          ))}
        </ul>
        {picked && (
          <Link
            to={`/market?list=${encodeURIComponent(picked)}`}
            className="xa-btn-primary text-sm inline-flex"
          >
            {isFr ? 'Mettre en vente' : 'List for sale'}
          </Link>
        )}
        <div className="flex flex-wrap gap-2">
          <Link to="/market" className="xa-btn-secondary text-sm inline-flex">
            {t('nav.market')}{listLive ? ' · live' : ''}
          </Link>
          <Link to="/my-packs" className="xa-btn-secondary text-sm inline-flex">
            {isFr ? 'Mes salles' : 'My rooms'}
          </Link>
        </div>
      </section>

      <section className="xa-card space-y-3">
        <h2 className="text-sm font-semibold text-[var(--xa-text)]">
          {isFr ? 'Certification Phygital' : 'Phygital certification'}
        </h2>
        <p className="xa-disclaimer">
          {isFr
            ? 'Photo HD → hash SHA-256 local → certificats CoA / CoP.'
            : 'HD photo → local SHA-256 hash → CoA / CoP certificates.'}
        </p>
        <PhysicalNftCertifier />
      </section>

      <section className="xa-card space-y-3">
        <h2 className="text-sm font-semibold text-[var(--xa-text)]">
          {t('nav.packs')}{agentMint ? '' : isFr ? ' · bientôt on-chain' : ' · on-chain soon'}
        </h2>
        <PackCheckout />
      </section>
    </div>
  )
}
