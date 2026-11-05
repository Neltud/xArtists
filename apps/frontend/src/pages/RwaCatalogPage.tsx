import { renderChild as xaRender } from '../i18n/phraseRuntime'
import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { asText } from '../lib/safeRender'
import PublicDisclosure from '../components/PublicDisclosure'

const PhysicalNftCertifier = lazy(() => import('../components/PhysicalNftCertifier'))
const PhysicalWorkFlowPanel = lazy(() => import('../components/PhysicalWorkFlowPanel'))

type Item = {
  id?: string; title?: string; artist?: string; style?: string; shipment_status?: string
  valuation?: { score?: number; price_proxy_usd?: number; momentum?: number }
  certificate_hash?: string
}

async function loadCatalog(signal: AbortSignal): Promise<Item[] | null> {
  const bases = [`${import.meta.env.BASE_URL || '/'}data/`, 'https://neltud.github.io/xArtists/data/']
  for (const base of bases) {
    try {
      const response = await fetch(base + 'rwa_catalog.json', { cache: 'no-store', signal })
      if (!response.ok) continue
      const data = await response.json()
      if (data.paper === true && Array.isArray(data.items)) return data.items
    } catch { if (signal.aborted) return null }
  }
  return null
}

export default function RwaCatalogPage() {
  const [items, setItems] = useState<Item[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'offline'>('loading')
  useEffect(() => {
    let cancelled = false
    const abort = new AbortController()
    const timer = window.setTimeout(() => abort.abort(), 10_000)
    loadCatalog(abort.signal).then(list => {
      if (cancelled) return
      setItems(list || [])
      setState(list === null ? 'offline' : 'ready')
    }).finally(() => window.clearTimeout(timer))
    return () => { cancelled = true; abort.abort(); window.clearTimeout(timer) }
  }, [])

  return <main className="rwa-public" id="rwa-catalog">
    <header className="rwa-public__lead">
      <p className="section-label">{xaRender("RWA")}</p>
      <h1>{xaRender("Physical · Digital")}</h1>
      <p>Explorer les œuvres physiques, leur documentation et leur lien avec le numérique.</p>
    </header>
    <p role="status" className="rwa-public__notice">Catalogue de démonstration publié le 5 octobre 2026.
      Données et valeurs simulées. Aucun lot proposé à la vente, aucune expertise,
      certification de propriété ou garde physique attestée.</p>
    <nav className="rwa-public__actions" aria-label="Explorer l’art">
      <Link to="/marketplace">Explorer la Marketplace <span aria-hidden="true"> ↗</span></Link>
      <Link to="/studio">Découvrir le Studio <span aria-hidden="true"> ↗</span></Link>
    </nav>
    {state === 'loading' && <p role="status" className="rwa-public__footnote">Chargement du catalogue…</p>}
    {state === 'offline' && <p role="status" className="rwa-public__notice">
      Catalogue indisponible. Aucun listing ou certificat de propriété n’est présumé.</p>}
    <div className="rwa-public__grid" aria-busy={state === 'loading'}>
      {items.map((item, index) => {
        const score = Number(item.valuation?.score ?? 0)
        return <article key={asText(item.id, String(index))} className="rwa-public__card">
          <header>
            <div className="rwa-public__mark" aria-hidden="true">◇</div>
            <div><h2>{xaRender(asText(item.title))}</h2>
              <p className="rwa-public__artist">{xaRender(asText(item.artist))}</p></div>
          </header>
          <p className="rwa-public__label">Exemple éditorial · pas de mise en vente certifiée</p>
          <p className="rwa-public__custody">Garde physique : non vérifiée</p>
          <PublicDisclosure id={'rwa-study-' + index} level={3}
            title="Voir les données simulées" subtitle={xaRender(asText(item.style, 'artwork'))}>
            <p>{xaRender("Score IA simulé")} : {Number.isFinite(score) ? Math.min(100, Math.max(0, score)).toFixed(0) : '—'} / 100</p>
            <p>{xaRender("Valeur fictive indicative $")}{xaRender(asText(item.valuation?.price_proxy_usd))}
              {xaRender(" · indicateur de démonstration")}</p>
            <p>Déclaration source : {xaRender(asText(item.shipment_status, 'indisponible'))}.
              Cette déclaration ne prouve pas la garde de l’œuvre.</p>
            {item.certificate_hash && <p className="break-all">
              Identifiant de démonstration : {asText(item.certificate_hash)}</p>}
          </PublicDisclosure>
        </article>
      })}
      {state === 'ready' && !items.length && <p className="rwa-public__footnote">
        {xaRender("Aucune œuvre de démonstration disponible. Aucun listing ou certificat de propriété n’est présumé.")}</p>}
    </div>
    <div className="rwa-public__tools">
      <PublicDisclosure id="rwa-preparation" title="Préparer la documentation d’une œuvre"
        subtitle="Outil de démonstration — aucun certificat vérifié ni mint automatique.">
        <p>Les documents produits sont des brouillons non vérifiés. Ils ne constituent
          ni une expertise d’authenticité, ni un titre de propriété.</p>
        <Suspense fallback={<p role="status">Chargement de l’outil…</p>}><PhysicalNftCertifier /></Suspense>
      </PublicDisclosure>
      <PublicDisclosure id="rwa-custody" title="Comprendre la garde et la livraison"
        subtitle="Préparation du suivi physique ; les justificatifs restent indispensables.">
        <Suspense fallback={<p role="status">Chargement du suivi…</p>}><PhysicalWorkFlowPanel /></Suspense>
      </PublicDisclosure>
    </div>
    <p className="rwa-public__footnote">
      {xaRender("Fiches illustratives uniquement. Les décisions de propriété, de conservation, de livraison et de publication NFT exigent des documents et des signatures indépendants.")}</p>
    <Link to="/lia" className="btn-secondary text-sm">{xaRender("← LIA hub ")}</Link>
  </main>
}
