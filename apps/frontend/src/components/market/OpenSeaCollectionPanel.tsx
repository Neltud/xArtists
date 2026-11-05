/**
 * External multichain discovery only. No wallet connect, signing, fulfilment,
 * Solana mint or Polygon contract deployment is performed in xArtists.
 */
import { useRef, useState, type FormEvent } from 'react'

type Chain = 'solana' | 'polygon'
type OpenSeaItem = {
  identifier: string
  contract: string
  name: string
  image_url: string | null
  opensea_url: string
  collection: string
  price: null
  listing_verified: false
}
type Preview = {
  ok: true
  chain: Chain
  collection: string
  collection_name: string
  collection_url: string
  source: 'opensea_api_v2'
  mode: 'read_only'
  on_site_order_enabled: false
  fetched_at: string
  items: OpenSeaItem[]
}

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ||
  'https://xartists-access-api.onrender.com'
const collectionPattern = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/

function messageForStatus(status: number, error?: string) {
  if (error === 'opensea_api_not_configured')
    return 'OpenSea API non configurée sur le serveur xArtists. Consulter OpenSea directement.'
  if (error === 'collection_chain_not_verified')
    return 'Cette collection OpenSea ne correspond pas au réseau choisi.'
  if (status === 404) return 'Collection non trouvée sur OpenSea.'
  if (status === 429) return 'Trop de demandes simultanées. Réessayer plus tard.'
  return 'Catalogue OpenSea temporairement indisponible. Aucun achat possible depuis xArtists.'
}

export default function OpenSeaCollectionPanel() {
  const [chain, setChain] = useState<Chain>('solana')
  const [slug, setSlug] = useState('')
  const [result, setResult] = useState<Preview | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const pending = useRef<AbortController | null>(null)

  const clear = () => {
    pending.current?.abort()
    setResult(null)
    setError('')
    setLoading(false)
  }
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    pending.current?.abort()
    setResult(null)
    setError('')
    const cleanSlug = slug.trim().toLowerCase()
    if (!collectionPattern.test(cleanSlug)) {
      setError('Saisir le slug OpenSea exact de la collection, sans URL ni caractères spéciaux.')
      setLoading(false)
      return
    }
    const controller = new AbortController()
    pending.current = controller
    setLoading(true)
    try {
      const u = new URL('/v1/marketplace/opensea/collection', API_BASE + '/')
      u.searchParams.set('chain', chain)
      u.searchParams.set('slug', cleanSlug)
      const timeout = setTimeout(() => controller.abort(), 10_000)
      let response: Response
      try {
        response = await fetch(u.toString(), { method: 'GET', cache: 'no-store', signal: controller.signal })
      } finally { clearTimeout(timeout) }
      const payload = await response.json() as Partial<Preview> & { error?: string }
      if (!response.ok || payload.ok !== true || payload.mode !== 'read_only' ||
          payload.chain !== chain || payload.collection !== cleanSlug ||
          !Array.isArray(payload.items) || payload.on_site_order_enabled !== false)
        throw new Error(messageForStatus(response.status, payload.error))
      setResult(payload as Preview)
    } catch (e) {
      if (!controller.signal.aborted) {
        setError(e instanceof Error ? e.message : messageForStatus(503))
      }
    } finally {
      if (pending.current === controller) { pending.current = null; setLoading(false) }
    }
  }

  return <section className="space-y-5" aria-label="Découvrir les NFT Solana et Polygon via OpenSea">
    <div>
      <h2 className="text-xl font-semibold text-white">OpenSea · Polygon & Solana</h2>
      <p className="mt-2 max-w-3xl text-sm text-zinc-300">
        Explorer une collection déjà répertoriée sur OpenSea, sans connecter de wallet.
        Le catalogue est une lecture de métadonnées : il ne garantit ni disponibilité,
        ni prix, ni authenticité, ni propriété du NFT.
      </p>
    </div>
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)_auto] sm:items-end">
      <label className="text-xs text-zinc-300">
        Blockchain
        <select value={chain} onChange={e => { clear(); setChain(e.target.value as Chain) }}
          className="mt-1 block min-h-[44px] w-full rounded-xl border border-white/20 bg-zinc-950 px-3 text-white">
          <option value="solana">Solana</option>
          <option value="polygon">Polygon</option>
        </select>
      </label>
      <label className="text-xs text-zinc-300">
        Slug de collection OpenSea
        <input type="text" value={slug} maxLength={64} autoCapitalize="none" autoComplete="off"
          onChange={e => { clear(); setSlug(e.target.value) }}
          placeholder="ex. ma-collection" className="mt-1 block min-h-[44px] w-full rounded-xl border border-white/20 bg-zinc-950 px-3 text-white" />
      </label>
      <button type="submit" disabled={loading}
        className="btn-primary min-h-[44px] rounded-xl px-4 text-sm disabled:opacity-60">
        {loading ? 'Recherche…' : 'Explorer la collection'}
      </button>
    </form>
    <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.05] p-4 text-xs leading-relaxed text-zinc-300">
      {chain === 'solana'
        ? 'Solana : OpenSea ne référence pas encore toutes les collections. OpenSea Studio ne permet pas le mint Solana. Création via un outil Solana compatible, puis découverte/vente sur une collection prise en charge.'
        : 'Polygon : création ERC-721/1155 possible via un outil EVM compatible ou OpenSea Studio ; aucune collection ou vente n’est créée par ce formulaire.'}
      {' '}Pour vendre ou acheter, finalisez exclusivement sur OpenSea avec votre propre wallet après vérification des frais et permissions.
    </div>
    {loading && <p role="status" className="text-sm text-zinc-400">Lecture sécurisée du catalogue OpenSea…</p>}
    {error && <p role="alert" className="rounded-xl border border-amber-500/30 p-4 text-sm text-amber-200">{error}</p>}
    {!result && <a href="https://opensea.io/" target="_blank" rel="noopener noreferrer"
      className="inline-flex min-h-[44px] items-center text-sm text-cyan-300 underline">
      Explorer OpenSea directement
    </a>}
    {result && <>
      <header className="flex flex-wrap justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{result.collection_name}</h3>
          <p className="text-xs text-zinc-400">Source OpenSea API v2 · {result.chain} · lecture seule · {result.items.length} NFT chargés</p>
        </div>
        <a href={result.collection_url} target="_blank" rel="noopener noreferrer"
          className="btn-secondary inline-flex min-h-[44px] items-center px-4 text-sm">
          Voir la collection sur OpenSea
        </a>
      </header>
      {result.items.length === 0 && <p className="text-sm text-zinc-400">Aucun NFT visible pour cette collection dans la réponse OpenSea.</p>}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {result.items.map(item => <li key={item.contract + ':' + item.identifier}
          className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/50">
          <div className="flex aspect-[4/3] items-center justify-center bg-white/[0.03]">
            {item.image_url
              ? <img src={item.image_url} alt={item.name} loading="lazy" referrerPolicy="no-referrer"
                  className="h-full w-full object-cover" />
              : <span className="text-xs text-zinc-500">Aperçu indisponible</span>}
          </div>
          <div className="space-y-2 p-4">
            <p className="line-clamp-2 text-sm font-semibold text-white">{item.name}</p>
            <p className="truncate text-xs text-zinc-500">NFT {item.identifier}</p>
            <p className="text-xs text-zinc-400">Prix et listing non vérifiés par xArtists</p>
            <a href={item.opensea_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center text-sm text-cyan-200 underline">
              Vérifier sur OpenSea
            </a>
          </div>
        </li>)}
      </ul>
    </>}
  </section>
}
