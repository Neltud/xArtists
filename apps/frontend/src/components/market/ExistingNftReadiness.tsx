/**
 * Existing owned MultiversX NFTs: read-only scan for one potential listing per
 * collection. No signed transactions or simulated on-chain sales.
 */
import { useEffect, useMemo, useState } from 'react'
import { useWallet } from '../../context/WalletContext'
import { requestOpenConnect } from '../../lib/walletEvents'

type OwnedNft = {
  identifier?: string
  collection?: string
  name?: string
  balance?: number | string
  uris?: unknown
  type?: string
  media?: unknown
}
const PACK_COLLECTIONS = new Set(['XAIPLS-2cf72b','XAIYLD-987e24','XAISNT-3d8a6b'])
const isRestrictedPack = (collection: string) => PACK_COLLECTIONS.has(collection)
const addressPattern = /^erd1[a-z0-9]{58}$/
const identifierPattern = /^[A-Za-z0-9]{3,12}-[a-f0-9]{6}-[a-f0-9]{2,16}$/
const hasMetadataUri = (n: OwnedNft) =>
  Array.isArray(n.uris) && n.uris.some(x => typeof x === 'string' &&
    (/^ipfs:\/\/(bafy[a-z2-7]{20,}|Qm[1-9A-HJ-NP-Za-km-z]{44})/i.test(x) ||
     /^https:\/\//i.test(x)))

function exportDraft(collection: string, token: string, price: string, mediaUriPresent: boolean) {
  const matched = /^(?:0|[1-9][0-9]{0,4})(?:\.[0-9]{1,18})?$/.exec(price.trim())
  if (!matched) return false
  const [whole, fraction = ''] = price.trim().split('.')
  const wei = BigInt(whole) * 10n ** 18n + BigInt((fraction + '0'.repeat(18)).slice(0, 18))
  if (wei <= 0n) return false
  const body = {
    schemaVersion: 1, kind: 'xartists_listing_draft', status: 'NOT_LISTED',
    collectionId: collection, nftIdentifier: token, currency: 'EGLD',
    priceEgld: price.trim(), priceWei: wei.toString(),
    mediaUriPresent, mediaReadbackVerified: false, ownershipVerifiedAtSigning: false,
    marketplaceContractVerified: false, walletSignatureRequired: true,
    transactionHash: null, settlementVerified: false,
  }
  const url = URL.createObjectURL(new Blob([JSON.stringify(body, null, 2)], { type: 'application/json' }))
  const a = document.createElement('a'); a.href = url
  a.download = 'xartists-listing-draft-' + collection + '.json'; a.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 200)
  return true
}

export default function ExistingNftReadiness() {
  const { address, connected } = useWallet()
  const [nfts, setNfts] = useState<OwnedNft[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [choices, setChoices] = useState<Record<string,string>>({})
  const [prices, setPrices] = useState<Record<string,string>>({})
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    setNfts([]); setChoices({}); setPrices({}); setError(''); setNotice('')
    if (!connected || !address || !addressPattern.test(address)) return
    const controller = new AbortController()
    setLoading(true)
    fetch('https://api.multiversx.com/accounts/' + encodeURIComponent(address) + '/nfts?size=100', {
      cache: 'no-store', signal: controller.signal,
    }).then(async r => {
      if (!r.ok) throw new Error('api_failed')
      const data: unknown = await r.json()
      if (!Array.isArray(data)) throw new Error('invalid_response')
      return data.filter((n): n is OwnedNft =>
        Boolean(n) && typeof n === 'object' &&
        typeof (n as OwnedNft).identifier === 'string' &&
        identifierPattern.test((n as OwnedNft).identifier || '') &&
        Number((n as OwnedNft).balance ?? 1) > 0 &&
        ((n as OwnedNft).type === undefined || String((n as OwnedNft).type).includes('NonFungible')))
    }).then(items => { if (active) setNfts(items) })
      .catch(() => { if (active && !controller.signal.aborted) setError('Lecture MultiversX indisponible : aucune annonce ne sera préparée automatiquement.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false; controller.abort() }
  }, [connected, address])

  const collections = useMemo(() => {
    const groups = new Map<string,OwnedNft[]>()
    for (const item of nfts) {
      const collection = String(item.collection || item.identifier?.split('-').slice(0,2).join('-'))
      if (!collection || !identifierPattern.test(item.identifier || '')) continue
      if (!groups.has(collection)) groups.set(collection, [])
      groups.get(collection)?.push(item)
    }
    return [...groups.entries()].sort(([a],[b]) => a.localeCompare(b))
  }, [nfts])

  return <section className="space-y-3 rounded-2xl border border-[var(--xa-border)] bg-[var(--xa-panel)] p-4 sm:p-6"
    aria-labelledby="existing-nft-listing-title" data-testid="existing-nft-listing-readiness">
    <div className="space-y-1">
      <h3 id="existing-nft-listing-title" className="text-lg font-semibold text-[var(--xa-text)]">
        Préparer un NFT existant par collection · EGLD
      </h3>
      <p className="text-xs leading-relaxed text-[var(--xa-muted)]">
        Lecture de tes NFT détenus dans le wallet connecté : un candidat par collection,
        sans création d'une nouvelle collection. Les prix restent des brouillons : aucun
        transfert, paiement, listing ou mint réel n'est envoyé.
      </p>
    </div>
    {!connected && <button type="button" className="btn-secondary min-h-[44px] text-sm" onClick={requestOpenConnect}>Connecter mon wallet xPortal</button>}
    {connected && loading && <p role="status" className="text-xs text-[var(--xa-muted)]">Recherche de tes NFT existants sur MultiversX…</p>}
    {error && <p role="alert" className="text-xs text-amber-700">{error}</p>}
    {connected && !loading && !error && collections.length === 0 && <p role="status" className="text-xs text-[var(--xa-muted)]">Aucun NFT détecté dans les 100 premiers actifs de ce wallet ; cela ne signifie pas que tes autres wallets sont vides.</p>}
    {collections.length > 0 && <>
      <p className="text-xs text-[var(--xa-muted)]">
        {collections.length} collection(s) repérée(s), parmi les 100 premiers NFT renvoyés par l'API.
        Les droits de vente et la propriété doivent être revérifiés au moment de signer.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {collections.map(([collection, items]) => {
          const token = choices[collection] || items[0]?.identifier || ''
          const selected = items.find(n => n.identifier === token) || items[0]
          const media = hasMetadataUri(selected)
          const restrictedPack = isRestrictedPack(collection)
          const price = prices[collection] || ''
          const valid = /^(?:0|[1-9][0-9]{0,4})(?:\.[0-9]{1,18})?$/.test(price) && Number(price) > 0
          return <div key={collection} className="min-w-0 rounded-xl border border-[var(--xa-border)] p-3 space-y-2">
            <p className="break-all text-sm font-semibold text-[var(--xa-text)]">{collection}</p>
            <label className="block text-xs text-[var(--xa-muted)]">NFT détenu
              <select className="mt-1 w-full rounded-lg border border-[var(--xa-border)] bg-[var(--xa-panel2)] p-2 text-[var(--xa-text)]"
                value={token} onChange={e => setChoices(p => ({...p, [collection]: e.target.value}))}>
                {items.map(n => <option key={n.identifier} value={n.identifier}>{n.name || n.identifier} · {n.identifier}</option>)}
              </select>
            </label>
            <p className="text-xs text-[var(--xa-muted)]">
              {restrictedPack ? 'Pack d’accès sous NO-GO : rôle de réparation, CID et preuve de média manquants. Aucune annonce EGLD.' :
                media ? 'URI média déclarée sur la chaîne — récupération IPFS non vérifiée' :
                'Image/URI manquante : corriger les métadonnées avant publication'}
            </p>
            <label className="block text-xs text-[var(--xa-muted)]">Prix envisagé en EGLD
              <input aria-label={'Prix EGLD ' + collection} type="text" inputMode="decimal" placeholder="Ex. 0.25"
                className="mt-1 w-full rounded-lg border border-[var(--xa-border)] bg-[var(--xa-panel2)] p-2 text-[var(--xa-text)]"
                value={price} onChange={e => setPrices(p => ({...p, [collection]: e.target.value}))} />
            </label>
            <div className="flex flex-wrap gap-2 items-center">
              <a href={'https://explorer.multiversx.com/nfts/' + encodeURIComponent(token)} target="_blank"
                rel="noopener noreferrer" className="text-xs underline underline-offset-4 min-h-[44px] inline-flex items-center">
                Voir le NFT sur Explorer
              </a>
              <button type="button" className="btn-secondary text-xs min-h-[44px]" disabled={!valid || !media || restrictedPack}
                onClick={() => setNotice(exportDraft(collection, token, price, media) ?
                  'Brouillon EGLD exporté. Aucun NFT listé ni argent transféré.' : 'Prix EGLD invalide.')}>
                {restrictedPack ? "Pack bloqué — NO-GO" : !media ? "Média requis avant brouillon" : "Exporter brouillon EGLD"}
              </button>
            </div>
          </div>
        })}
      </div>
    </>}
    {notice && <p role="status" className="text-xs text-[var(--xa-muted)]">{notice}</p>}
    <p className="text-xs text-[var(--xa-muted)]">
      Listing réel : nécessite un contrat marketplace contrôlé, une offre signée, des images disponibles,
      des frais affichés et la confirmation du transfert/escrow. Pas d'enchère et pas de vente automatique.
    </p>
  </section>
}
