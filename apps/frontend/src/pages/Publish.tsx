import type { ChangeEventHandler } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { fetchMirroredJson } from '../config/dataSources'

type Locale = 'fr' | 'en'
type ArtworkType = 'digital' | 'phygital'
type PublishAction = 'prepare' | 'mint' | 'list'

type Draft = {
  title: string
  description: string
  artworkType: ArtworkType
  priceEgld: string
  royalties: string
  imageName: string
  imageType: string
  imageSize: number
  creatorWallet: string | null
  createdAt: string
}

const STORAGE_KEY = 'xartists_publish_drafts'
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp']

const COPY = {
  fr: {
    eyebrow: 'Publier en 3 étapes',
    title: 'Crée ta fiche œuvre avant mint ou mise en vente',
    subtitle:
      'Prépare une œuvre phygitale ou digitale, sauvegarde sa fiche localement et active mint/list dès que les contrats sont prêts.',
    wallet: 'Wallet',
    artwork: 'Œuvre',
    confirm: 'Confirmer',
    connected: 'Wallet connecté',
    disconnected: 'Mode préparation sans wallet',
    walletHintReady: 'Tu peux déjà préparer ta fiche puis partager ou mint plus tard.',
    walletHintOffline: 'Aucun contrat requis pour préparer la fiche de ton œuvre.',
    continue: 'Continuer',
    back: 'Retour',
    prepareMode: 'Mode “Préparer la fiche” — aucun contrat requis',
    contractsReady: 'Contrats détectés — prépare puis passe au mint/list.',
    image: 'Image',
    titleLabel: 'Titre',
    descriptionLabel: 'Description',
    typeLabel: 'Type',
    digital: 'Digital',
    phygital: 'Phygital',
    price: 'Prix (EGLD)',
    royalties: 'Royalties (%)',
    imageHint: 'PNG, JPG ou WEBP · 10 MB max',
    validationImage: 'Ajoute une image valide (PNG, JPG ou WEBP, 10 MB max).',
    validationTitle: 'Ajoute un titre pour continuer.',
    validationDescription: 'Ajoute une description courte pour continuer.',
    validationPrice: 'Le prix EGLD doit être supérieur à 0.',
    validationRoyalties: 'Les royalties doivent rester entre 0 et 25%.',
    saveLocal: 'Préparer la fiche',
    mintAction: 'Mint',
    listAction: 'List',
    successPrepare: 'Fiche sauvegardée localement et prête à partager.',
    successMint: 'Fiche sauvegardée et prête pour le mint côté artiste.',
    successList: 'Fiche sauvegardée et prête pour la mise en vente.',
    explorer: 'Voir le contrat sur Explorer',
    share: 'Partager',
    download: 'Télécharger le JSON',
    preview: 'Aperçu artiste',
    missingContracts: 'Mint/List indisponibles pour le moment — reste en mode préparation.',
    walletStatus: 'Adresse',
    localSave: 'Sauvegarde locale',
    footerHint: 'Les images restent locales sur ton appareil jusqu’au vrai mint.',
    switchLocale: 'EN',
    mintHint: 'Minter SC',
    listHint: 'Marketplace SC',
  },
  en: {
    eyebrow: 'Publish in 3 steps',
    title: 'Create your artwork listing before mint or sale',
    subtitle:
      'Prepare a phygital or digital artwork, save its metadata locally, and unlock mint/list once contracts are available.',
    wallet: 'Wallet',
    artwork: 'Artwork',
    confirm: 'Confirm',
    connected: 'Wallet connected',
    disconnected: 'Draft mode without wallet',
    walletHintReady: 'You can already prepare the listing, then share or mint later.',
    walletHintOffline: 'No contract is required to prepare your artwork listing.',
    continue: 'Continue',
    back: 'Back',
    prepareMode: '“Prepare listing” mode — no contract required',
    contractsReady: 'Contracts detected — prepare first, then mint/list.',
    image: 'Image',
    titleLabel: 'Title',
    descriptionLabel: 'Description',
    typeLabel: 'Type',
    digital: 'Digital',
    phygital: 'Phygital',
    price: 'Price (EGLD)',
    royalties: 'Royalties (%)',
    imageHint: 'PNG, JPG or WEBP · 10 MB max',
    validationImage: 'Add a valid image (PNG, JPG or WEBP, 10 MB max).',
    validationTitle: 'Add a title to continue.',
    validationDescription: 'Add a short description to continue.',
    validationPrice: 'Price must be greater than 0 EGLD.',
    validationRoyalties: 'Royalties must stay between 0 and 25%.',
    saveLocal: 'Prepare listing',
    mintAction: 'Mint',
    listAction: 'List',
    successPrepare: 'Listing saved locally and ready to share.',
    successMint: 'Listing saved and ready for artist minting.',
    successList: 'Listing saved and ready for marketplace listing.',
    explorer: 'Open contract on Explorer',
    share: 'Share',
    download: 'Download JSON',
    preview: 'Artist preview',
    missingContracts: 'Mint/List are unavailable for now — staying in draft mode.',
    walletStatus: 'Address',
    localSave: 'Local save',
    footerHint: 'Images stay local on your device until the actual mint.',
    switchLocale: 'FR',
    mintHint: 'Minter SC',
    listHint: 'Marketplace SC',
  },
} as const

type ContractsFile = {
  contracts?: {
    marketplace?: string | null
    nft_minter?: string | null
  }
}

function isAddress(value?: string | null): value is string {
  return Boolean(value && /^erd1[a-z0-9]{58}$/i.test(value))
}

export default function Publish() {
  const preferredLocale =
    typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en'
  const [locale, setLocale] = useState<Locale>(preferredLocale)
  const [step, setStep] = useState(0)
  const [imageError, setImageError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [marketplaceAddress, setMarketplaceAddress] = useState<string>('')
  const [minterAddress, setMinterAddress] = useState<string>('')
  const { connected, address } = useWallet()
  const [form, setForm] = useState({
    title: '',
    description: '',
    artworkType: 'digital' as ArtworkType,
    priceEgld: '1',
    royalties: '10',
  })

  const t = COPY[locale]

  useEffect(() => {
    let cancelled = false

    fetchMirroredJson<ContractsFile>('contracts.json', { cache: 'no-store' })
      .then((json) => {
        if (cancelled) return
        const contracts = json.contracts || {}
        setMarketplaceAddress(
          (import.meta.env.VITE_MARKETPLACE_ADDRESS as string | undefined) || contracts.marketplace || '',
        )
        setMinterAddress(
          (import.meta.env.VITE_NFT_MINTER_ADDRESS as string | undefined) || contracts.nft_minter || '',
        )
      })
      .catch(() => {
        if (cancelled) return
        setMarketplaceAddress((import.meta.env.VITE_MARKETPLACE_ADDRESS as string | undefined) || '')
        setMinterAddress((import.meta.env.VITE_NFT_MINTER_ADDRESS as string | undefined) || '')
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null)
      return
    }
    const nextUrl = URL.createObjectURL(imageFile)
    setPreviewUrl(nextUrl)
    return () => URL.revokeObjectURL(nextUrl)
  }, [imageFile])

  const marketplaceReady = isAddress(marketplaceAddress)
  const minterReady = isAddress(minterAddress)
  const contractsReady = marketplaceReady || minterReady

  const draft = useMemo<Draft | null>(() => {
    if (!imageFile) return null
    return {
      title: form.title.trim(),
      description: form.description.trim(),
      artworkType: form.artworkType,
      priceEgld: form.priceEgld.trim(),
      royalties: form.royalties.trim(),
      imageName: imageFile.name,
      imageType: imageFile.type,
      imageSize: imageFile.size,
      creatorWallet: connected ? address : null,
      createdAt: new Date().toISOString(),
    }
  }, [address, connected, form, imageFile])

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const validateStepTwo = () => {
    if (!imageFile || imageError) return t.validationImage
    if (!form.title.trim()) return t.validationTitle
    if (!form.description.trim()) return t.validationDescription
    if (!(parseFloat(form.priceEgld) > 0)) return t.validationPrice
    const royalties = parseFloat(form.royalties)
    if (!(royalties >= 0 && royalties <= 25)) return t.validationRoyalties
    return null
  }

  const onSelectImage: ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0] || null
    setSuccess(null)
    if (!file) {
      setImageFile(null)
      setImageError(null)
      return
    }
    if (!ACCEPTED_TYPES.includes(file.type) || file.size > MAX_IMAGE_BYTES) {
      setImageFile(null)
      setImageError(t.validationImage)
      return
    }
    setImageFile(file)
    setImageError(null)
  }

  const nextStep = () => {
    const error = step === 1 ? validateStepTwo() : null
    if (error) {
      setFormError(error)
      return
    }
    setFormError(null)
    setStep((prev) => Math.min(prev + 1, 2))
  }

  const downloadDraft = (payload: Draft) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${payload.title.toLowerCase().replace(/[^a-z0-9]+/gi, '-') || 'xartists-artwork'}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const saveDraft = async (action: PublishAction) => {
    if (!draft) {
      setFormError(t.validationImage)
      return
    }

    const payload = {
      ...draft,
      action,
      contracts: {
        marketplace: marketplaceReady ? marketplaceAddress : null,
        nftMinter: minterReady ? minterAddress : null,
      },
    }

    const existingRaw = localStorage.getItem(STORAGE_KEY)
    const existing = existingRaw ? (JSON.parse(existingRaw) as typeof payload[]) : []
    localStorage.setItem(STORAGE_KEY, JSON.stringify([payload, ...existing].slice(0, 12)))
    setLastSavedAt(payload.createdAt)
    setFormError(null)
    setSuccess(
      action === 'mint' ? t.successMint : action === 'list' ? t.successList : t.successPrepare,
    )
    downloadDraft(payload)
  }

  const shareDraft = async () => {
    if (!draft) return
    const text = `${draft.title} · ${draft.artworkType} · ${draft.priceEgld} EGLD`
    if (navigator.share) {
      await navigator.share({
        title: `xArtists · ${draft.title}`,
        text,
        url: window.location.href,
      })
      return
    }
    await navigator.clipboard.writeText(text)
    setSuccess(`${success || t.successPrepare} · ${locale === 'fr' ? 'Copié' : 'Copied'}`)
  }

  const explorerHref = marketplaceReady
    ? `https://explorer.multiversx.com/accounts/${marketplaceAddress}`
    : minterReady
      ? `https://explorer.multiversx.com/accounts/${minterAddress}`
      : null

  return (
    <div className="animate-fade-in pb-20 md:pb-0">
      <section className="relative overflow-hidden rounded-3xl border border-[#2a2a3a] bg-gradient-to-br from-[#15151f] via-[#111118] to-[#0a0a0f] p-5 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
                {t.eyebrow}
              </span>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">{t.title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400 sm:text-base">{t.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setLocale((prev) => (prev === 'fr' ? 'en' : 'fr'))}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-gray-300"
            >
              {t.switchLocale}
            </button>
          </div>

          <div className="grid gap-3 rounded-2xl border border-white/5 bg-black/20 p-3 sm:grid-cols-3 sm:p-4">
            {[
              { index: 0, label: t.wallet },
              { index: 1, label: t.artwork },
              { index: 2, label: t.confirm },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setStep(item.index)}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  step === item.index
                    ? 'border-purple-500 bg-purple-500/15 text-white'
                    : 'border-white/5 bg-white/5 text-gray-400'
                }`}
              >
                <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">0{item.index + 1}</p>
                <p className="mt-1 text-sm font-semibold">{item.label}</p>
              </button>
            ))}
          </div>

          {step === 0 && (
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl border border-[#2a2a3a] bg-[#101018] p-4 sm:p-5">
                <p className="text-sm font-semibold text-white">
                  {connected ? `✅ ${t.connected}` : `📝 ${t.disconnected}`}
                </p>
                <p className="mt-2 text-sm text-gray-400">
                  {contractsReady ? t.walletHintReady : t.walletHintOffline}
                </p>
                <div className="mt-4 rounded-2xl border border-white/5 bg-white/5 p-4 text-xs text-gray-300">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">{t.walletStatus}</p>
                  <p className="mt-2 break-all font-mono">{connected ? address : '—'}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#2a2a3a] bg-[#101018] p-4 sm:p-5">
                <p className="text-sm font-semibold text-white">
                  {contractsReady ? `🟣 ${t.contractsReady}` : `⚪ ${t.prepareMode}`}
                </p>
                <div className="mt-4 space-y-3 text-xs text-gray-400">
                  <p>{t.footerHint}</p>
                  <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">{t.mintHint}</p>
                    <p className="mt-1 break-all font-mono">{minterReady ? minterAddress : '—'}</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">{t.listHint}</p>
                    <p className="mt-1 break-all font-mono">{marketplaceReady ? marketplaceAddress : '—'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
              <div className="rounded-2xl border border-[#2a2a3a] bg-[#101018] p-4 sm:p-5">
                <div className="grid gap-4">
                  <label className="grid gap-2 text-sm text-gray-300">
                    <span>{t.image}</span>
                    <input
                      type="file"
                      accept={ACCEPTED_TYPES.join(',')}
                      onChange={onSelectImage}
                      className="rounded-2xl border border-dashed border-[#2a2a3a] bg-[#15151f] px-4 py-5 text-sm text-gray-400 file:mr-4 file:rounded-full file:border-0 file:bg-purple-500/15 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-purple-200"
                    />
                    <span className="text-xs text-gray-500">{t.imageHint}</span>
                  </label>

                  <label className="grid gap-2 text-sm text-gray-300">
                    <span>{t.titleLabel}</span>
                    <input
                      value={form.title}
                      onChange={(event) => setField('title', event.target.value)}
                      className="rounded-2xl border border-[#2a2a3a] bg-[#15151f] px-4 py-3 text-white outline-none focus:border-purple-500"
                    />
                  </label>

                  <label className="grid gap-2 text-sm text-gray-300">
                    <span>{t.descriptionLabel}</span>
                    <textarea
                      value={form.description}
                      onChange={(event) => setField('description', event.target.value)}
                      rows={4}
                      className="rounded-2xl border border-[#2a2a3a] bg-[#15151f] px-4 py-3 text-white outline-none focus:border-purple-500"
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="grid gap-2 text-sm text-gray-300">
                      <span>{t.typeLabel}</span>
                      <select
                        value={form.artworkType}
                        onChange={(event) => setField('artworkType', event.target.value as ArtworkType)}
                        className="rounded-2xl border border-[#2a2a3a] bg-[#15151f] px-4 py-3 text-white outline-none focus:border-purple-500"
                      >
                        <option value="digital">{t.digital}</option>
                        <option value="phygital">{t.phygital}</option>
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm text-gray-300">
                      <span>{t.price}</span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={form.priceEgld}
                        onChange={(event) => setField('priceEgld', event.target.value)}
                        className="rounded-2xl border border-[#2a2a3a] bg-[#15151f] px-4 py-3 text-white outline-none focus:border-purple-500"
                      />
                    </label>
                    <label className="grid gap-2 text-sm text-gray-300">
                      <span>{t.royalties}</span>
                      <input
                        type="number"
                        min="0"
                        max="25"
                        step="1"
                        value={form.royalties}
                        onChange={(event) => setField('royalties', event.target.value)}
                        className="rounded-2xl border border-[#2a2a3a] bg-[#15151f] px-4 py-3 text-white outline-none focus:border-purple-500"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#2a2a3a] bg-[#101018] p-4 sm:p-5">
                <p className="text-sm font-semibold text-white">{t.preview}</p>
                <div className="mt-4 overflow-hidden rounded-2xl border border-white/5 bg-black/20">
                  <div className="aspect-square bg-[#15151f]">
                    {previewUrl ? (
                      <img src={previewUrl} alt={form.title || 'Artwork preview'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-5xl text-gray-600">🖼️</div>
                    )}
                  </div>
                  <div className="space-y-2 p-4 text-sm text-gray-300">
                    <p className="font-semibold text-white">{form.title || 'Untitled artwork'}</p>
                    <p className="text-xs text-gray-500">{form.artworkType === 'digital' ? t.digital : t.phygital}</p>
                    <p className="text-sm text-gray-400">{form.description || '—'}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                        <p className="text-gray-500">{t.price}</p>
                        <p className="mt-1 font-semibold text-white">{form.priceEgld || '0'} EGLD</p>
                      </div>
                      <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                        <p className="text-gray-500">{t.royalties}</p>
                        <p className="mt-1 font-semibold text-white">{form.royalties || '0'}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
              <div className="rounded-2xl border border-[#2a2a3a] bg-[#101018] p-4 sm:p-5">
                <div className="space-y-4">
                  <SummaryRow label={t.titleLabel} value={form.title || '—'} />
                  <SummaryRow label={t.typeLabel} value={form.artworkType === 'digital' ? t.digital : t.phygital} />
                  <SummaryRow label={t.price} value={`${form.priceEgld || '0'} EGLD`} />
                  <SummaryRow label={t.royalties} value={`${form.royalties || '0'}%`} />
                  <SummaryRow label={t.localSave} value={lastSavedAt ? new Date(lastSavedAt).toLocaleString(locale) : '—'} />
                </div>

                {!contractsReady && (
                  <div className="mt-4 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4 text-sm text-orange-200">
                    {t.missingContracts}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[#2a2a3a] bg-[#101018] p-4 sm:p-5">
                <div className="grid gap-3">
                  <button type="button" onClick={() => saveDraft('prepare')} className="btn-primary text-sm">
                    {t.saveLocal}
                  </button>
                  <button
                    type="button"
                    onClick={() => saveDraft('mint')}
                    disabled={!minterReady}
                    className="btn-secondary text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    title={!minterReady ? t.missingContracts : ''}
                  >
                    {t.mintAction}
                  </button>
                  <button
                    type="button"
                    onClick={() => saveDraft('list')}
                    disabled={!marketplaceReady}
                    className="btn-secondary text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    title={!marketplaceReady ? t.missingContracts : ''}
                  >
                    {t.listAction}
                  </button>

                  {success && (
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                      <p>{success}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {explorerHref && (
                          <a href={explorerHref} target="_blank" rel="noreferrer" className="btn-secondary text-xs">
                            {t.explorer}
                          </a>
                        )}
                        <button type="button" onClick={shareDraft} className="btn-secondary text-xs">
                          {t.share}
                        </button>
                        {draft && (
                          <button type="button" onClick={() => downloadDraft(draft)} className="btn-secondary text-xs">
                            {t.download}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <Link to="/marketplace" className="text-center text-sm text-purple-300 hover:text-purple-200">
                    {locale === 'fr' ? 'Explorer le marketplace' : 'Explore marketplace'} →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {(imageError || formError) && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {imageError || formError}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
              disabled={step === 0}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              {t.back}
            </button>
            <button type="button" onClick={nextStep} disabled={step === 2} className="btn-primary text-sm disabled:opacity-50">
              {t.continue}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-black/20 px-4 py-3">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-right text-sm font-semibold text-white">{value}</span>
    </div>
  )
}
