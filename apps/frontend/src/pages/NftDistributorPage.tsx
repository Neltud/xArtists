/**
 * NFT Factory v0 — browse-only art metadata and distributor paper drafts.
 * No AI provider is connected, no real image, wallet signature, payment, SC
 * deployment, inventory deposit, NFT transfer or mint happens here.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { ART_TEMPLATES, prepareArtCollection } from '../lib/artCollectionPaper.mjs'
import type { ArtCollectionDraft, ArtPlanInput, CreatorType } from '../lib/artCollectionPaper.mjs'
import { preparePaperDistributor, simulatePaperDraw } from '../lib/distributorPaper.mjs'
import type { DistributorDraft, DistributorMode, SimulatedDraw } from '../lib/distributorPaper.mjs'

const splitRows = (text: string) => text.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean)
const starterLayers = JSON.stringify([
  { name: 'Background', variants: [{ value: 'Indigo', weight: 5 }, { value: 'Coral', weight: 2 }] },
  { name: 'Texture', variants: [{ value: 'Canvas', weight: 4 }, { value: 'Glass', weight: 1 }] },
  { name: 'Shape', variants: [{ value: 'Orbit', weight: 3 }, { value: 'Bloom', weight: 1 }] },
], null, 2)

function exportJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })
  const uri = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = uri
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(uri), 100)
}

function DistributorStatus({ draft }: { draft: DistributorDraft }) {
  return <div className="space-y-2 text-sm">
    <p><strong>Collection : </strong><span className="font-mono break-all">{draft.collectionId}</span></p>
    <p><strong>Prix fixe : </strong>{draft.fixedPriceEgld} EGLD / NFT</p>
    <p><strong>Stock planifié : </strong>{draft.supplyCap} NFT</p>
    <p><strong>Type : </strong>{draft.mode === 'escrow_inventory' ? 'Dépôt de NFT existants' : 'Mint à la demande'}</p>
    <p className="text-amber-200"><strong>État : </strong>préparation seulement — aucun contrat déployé</p>
    <p className="text-zinc-400">Vérifications indispensables : propriété collection, rôle NFTCreate ou garde des NFT, tirage aléatoire auditable, contrat testé, remboursement, transaction wallet signée.</p>
  </div>
}

export default function NftDistributorPage() {
  const { address, connected } = useWallet()
  const [creatorType, setCreatorType] = useState<CreatorType>('human_artist')
  const [agentId, setAgentId] = useState('')
  const [collectionTitle, setCollectionTitle] = useState('Éditions originales')
  const [description, setDescription] = useState('Collection originale de compositions graphiques et textures.')
  const [quantity, setQuantity] = useState(12)
  const [seed, setSeed] = useState('xartists-original-collection-2026')
  const [designMode, setDesignMode] = useState<'template' | 'layers'>('template')
  const [template, setTemplate] = useState<'chromatic' | 'botanical' | 'monochrome'>('chromatic')
  const [layersJson, setLayersJson] = useState(starterLayers)
  const [rightsConfirmed, setRightsConfirmed] = useState(false)
  const [art, setArt] = useState<ArtCollectionDraft | null>(null)
  const [artError, setArtError] = useState('')
  const [edition, setEdition] = useState(1)
  const [overrides, setOverrides] = useState<NonNullable<ArtPlanInput['overrides']>>({})
  const [brief, setBrief] = useState('Œuvres abstraites originales, peintures, palette iris et cuivre, composition éditoriale')
  const [copyStatus, setCopyStatus] = useState('')

  const [distributorTitle, setDistributorTitle] = useState('Distributeur Collection')
  const [collectionId, setCollectionId] = useState('')
  const [distributorMode, setDistributorMode] = useState<DistributorMode>('escrow_inventory')
  const [inventory, setInventory] = useState('')
  const [metadataUris, setMetadataUris] = useState('')
  const [fixedPrice, setFixedPrice] = useState('0.25')
  const [perWalletLimit, setPerWalletLimit] = useState(1)
  const [drawSeed, setDrawSeed] = useState('paper-preview-seed-001')
  const [soldIds, setSoldIds] = useState<string[]>([])
  const [draw, setDraw] = useState<SimulatedDraw | null>(null)
  const [drawError, setDrawError] = useState('')

  useEffect(() => {
    let active = true
    const run = async () => {
      try {
        const parsed = designMode === 'layers' ? JSON.parse(layersJson) : []
        const plan = await prepareArtCollection({
          title: collectionTitle, description, quantity, seed,
          mode: designMode, template, layers: parsed, creatorType,
          agentId: creatorType === 'ai_agent' ? agentId : '',
          artistAddress: connected ? address || '' : '', rightsConfirmed, overrides,
        })
        if (active) { setArt(plan); setArtError('') }
      } catch (error) {
        if (active) { setArt(null); setArtError(error instanceof Error ? error.message : 'Plan invalide') }
      }
    }
    void run()
    return () => { active = false }
  }, [collectionTitle, description, quantity, seed, designMode, template, layersJson,
      creatorType, agentId, connected, address, rightsConfirmed, overrides])

  const picked = art?.editions[edition - 1]
  const distributorResult = useMemo<{ draft: DistributorDraft | null; error: string }>(() => {
    try {
      return {
        draft: preparePaperDistributor({
          title: distributorTitle,
          collectionId: collectionId.trim(), mode: distributorMode,
          fixedPriceEgld: fixedPrice.trim(),
          inventory: distributorMode === 'escrow_inventory' ? splitRows(inventory) : [],
          plannedSupply: quantity,
          metadataUris: distributorMode === 'lazy_mint' ? splitRows(metadataUris) : [],
          artistAddress: connected ? address || '' : '',
          rightsConfirmed,
          perWalletLimit,
        }),
        error: '',
      }
    } catch (error) {
      return { draft: null, error: error instanceof Error ? error.message : 'Distributeur invalide' }
    }
  }, [distributorTitle, collectionId, distributorMode, fixedPrice, inventory,
    quantity, metadataUris, connected, address, rightsConfirmed, perWalletLimit])

  useEffect(() => {
    setSoldIds([])
    setDraw(null)
    setDrawError('')
  }, [distributorMode, collectionId, inventory, fixedPrice])

  const handleDraw = async () => {
    const draft = distributorResult.draft
    if (!draft || draft.mode !== 'escrow_inventory') return
    setDrawError('')
    try {
      const result = await simulatePaperDraw({
        collectionId: draft.collectionId,
        inventory: [...draft.nftInventory],
        soldIds, seed: drawSeed, drawNumber: soldIds.length,
      })
      setDraw(result)
      setSoldIds(ids => [...ids, result.selectedNftId])
    } catch (error) {
      setDrawError(error instanceof Error ? error.message : 'Tirage indisponible')
    }
  }
  const visualLayers = useMemo(() => {
    try {
      const parsed: unknown = JSON.parse(layersJson)
      if (!Array.isArray(parsed) || parsed.length > 8 ||
          parsed.some(item => !item || typeof item !== 'object' ||
            !Array.isArray(item.variants) || item.variants.length > 12)) return []
      return parsed as { name: string; variants: { value: string; weight: number }[] }[]
    } catch { return [] }
  }, [layersJson])
  const editLayers = (apply: (items: typeof visualLayers) => void) => {
    const next = visualLayers.map(layer => ({
      name: layer.name, variants: layer.variants.map(v => ({ value: v.value, weight: v.weight })),
    }))
    apply(next)
    setLayersJson(JSON.stringify(next, null, 2))
  }
  const updateExtraAttributes = (value: string) => {
    const parts = value.split(/[;\\n]+/).map(x => x.trim()).filter(Boolean)
    const attrs = parts.map(line => {
      const pos = line.indexOf('=')
      return { trait_type: pos < 0 ? line : line.slice(0, pos).trim(),
        value: pos < 0 ? '' : line.slice(pos + 1).trim() }
    })
    setOverrides(prev => {
      const patch = { ...(prev[String(edition)] || {}) }
      if (attrs.length) patch.extraAttributes = attrs
      else delete patch.extraAttributes
      const result = { ...prev }
      if (Object.keys(patch).length) result[String(edition)] = patch
      else delete result[String(edition)]
      return result
    })
  }

  const updateEdition = (field: 'name' | 'description', value: string) => {
    setOverrides(prev => {
      const entry = { ...(prev[String(edition)] || {}) }
      if (value.trim()) entry[field] = value
      else delete entry[field]
      const next = { ...prev }
      if (Object.keys(entry).length) next[String(edition)] = entry
      else delete next[String(edition)]
      return next
    })
  }
  const copyBrief = async () => {
    const prompt = 'xArtists Art Generator · original creator artwork\n' + brief +
      '\nCollection: ' + collectionTitle + '\nÉditions: ' + quantity +
      '\nMétadonnées de traits : ' + (art?.layers.map(x => x.name).join(', ') || 'en préparation') +
      '\nGénérer uniquement via un modèle autorisé ; valider les droits et le coût AVANT exécution.'
    try {
      await navigator.clipboard.writeText(prompt)
      setCopyStatus('Brief copié. À soumettre au plugin de génération d’art.')
    } catch { setCopyStatus('Presse-papiers non disponible. Tu peux sélectionner et copier le brief.') }
  }

  return <div className="mx-auto max-w-7xl space-y-8 px-4 py-7 sm:px-8" data-testid="nft-factory-paper">
    <header className="space-y-3">
      <p className="text-xs uppercase tracking-[.2em] text-lime-300">xArtists / Studio / NFT Factory</p>
      <h1 className="text-3xl font-semibold sm:text-5xl">Art Generator & distributeurs NFT</h1>
      <p className="max-w-3xl text-sm leading-6 text-zinc-400">Humain, artiste ou agent IA : conçois une collection avec modèles ou calques, prépare les métadonnées NFT individuellement, puis configure son distributeur à prix fixe.</p>
      <div className="rounded-xl border border-amber-500/35 bg-amber-400/10 p-4 text-sm text-amber-100" role="status">
        <b>PRÉPARATION / PAPER ONLY.</b> Aucun fournisseur IA, débit de crédits réels, dépôt IPFS, paiement, transaction wallet ou smart contract déployé n’est connecté à ce parcours. Ne transfère aucun NFT à une adresse non vérifiée.
      </div>
    </header>

    <div className="grid gap-5 lg:grid-cols-2">
      <section className="card space-y-4" aria-labelledby="generator-heading">
        <h2 id="generator-heading" className="text-xl font-semibold">1. Génération de collection</h2>
        <label className="block space-y-1 text-sm">Type de créateur
          <select className="w-full rounded-lg border border-white/15 bg-black/50 p-2" value={creatorType} onChange={e => setCreatorType(e.target.value as CreatorType)}>
            <option value="human_artist">Humain / artiste</option>
            <option value="ai_agent">Agent IA créateur (mandat requis pour payer/minter)</option>
          </select>
        </label>
        {creatorType === 'ai_agent' && <label className="block space-y-1 text-sm">Identifiant de l’agent
          <input className="w-full rounded-lg border border-white/15 bg-black/50 p-2" placeholder="agent:studio-bot" value={agentId} maxLength={100} onChange={e => setAgentId(e.target.value)}/>
        </label>}
        <label className="block space-y-1 text-sm">Nom de collection
          <input className="w-full rounded-lg border border-white/15 bg-black/50 p-2" value={collectionTitle} maxLength={80} onChange={e => setCollectionTitle(e.target.value)}/>
        </label>
        <label className="block space-y-1 text-sm">Description
          <textarea className="w-full rounded-lg border border-white/15 bg-black/50 p-2" rows={2} value={description} maxLength={600} onChange={e => setDescription(e.target.value)}/>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1 text-sm">Nombre de NFT (1–100)
            <input type="number" min={1} max={100} className="w-full rounded-lg border border-white/15 bg-black/50 p-2" value={quantity} onChange={e => setQuantity(Number(e.target.value))}/>
          </label>
          <label className="block space-y-1 text-sm">Mode de design
            <select className="w-full rounded-lg border border-white/15 bg-black/50 p-2" value={designMode} onChange={e => setDesignMode(e.target.value as 'template' | 'layers')}>
              <option value="template">Modèle préconfiguré</option>
              <option value="layers">Calques personnalisés</option>
            </select>
          </label>
        </div>
        {designMode === 'template'
          ? <label className="block space-y-1 text-sm">Modèle
              <select className="w-full rounded-lg border border-white/15 bg-black/50 p-2" value={template} onChange={e => setTemplate(e.target.value as 'chromatic' | 'botanical' | 'monochrome')}>
                {Object.entries(ART_TEMPLATES).map(([id, data]) => <option key={id} value={id}>{data.label}</option>)}
              </select>
            </label>
          : <div className="space-y-3 rounded-lg border border-white/15 p-3">
              <p className="text-sm font-semibold">Choix de calques & raretés</p>
              {visualLayers.map((layer, li) => <div key={li} className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="flex items-center gap-2">
                  <label className="flex-1 text-xs">Nom du calque
                    <input className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 p-2" value={layer.name}
                      onChange={e => editLayers(items => { items[li].name = e.target.value })}/>
                  </label>
                  <button type="button" className="btn-secondary text-xs" disabled={visualLayers.length<=1}
                    onClick={() => editLayers(items => { items.splice(li, 1) })}>Supprimer</button>
                </div>
                {layer.variants.map((v,vi) => <div key={vi} className="flex items-end gap-2">
                  <label className="flex-1 text-xs">Design / variante
                    <input className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 p-2" value={v.value}
                      onChange={e=>editLayers(items=>{items[li].variants[vi].value=e.target.value})}/>
                  </label>
                  <label className="w-20 text-xs">Poids
                    <input type="number" min={1} max={1000}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 p-2" value={v.weight}
                      onChange={e=>editLayers(items=>{items[li].variants[vi].weight=Number(e.target.value)})}/>
                  </label>
                  <button type="button" className="btn-secondary text-xs" disabled={layer.variants.length<=1}
                    onClick={()=>editLayers(items=>{items[li].variants.splice(vi,1)})}>×</button>
                </div>)}
                <button type="button" className="btn-secondary text-xs" disabled={layer.variants.length>=12}
                  onClick={()=>editLayers(items=>{items[li].variants.push({value:'Nouvelle variante',weight:1})})}>+ Variante</button>
              </div>)}
              <button type="button" className="btn-secondary text-xs" disabled={visualLayers.length>=8}
                onClick={()=>editLayers(items=>{items.push({name:'Nouveau calque',variants:[{value:'Première variante',weight:1}]})})}>+ Calque</button>
              <p className="text-xs text-zinc-500">Chaque poids fixe une fréquence relative estimée, sans garantir un nombre exact. Les métadonnées restent des brouillons.</p>
              <details className="text-xs"><summary className="cursor-pointer text-zinc-300">Éditeur JSON avancé</summary>
                <textarea className="mt-2 w-full rounded-lg border border-white/15 bg-black/50 p-3 font-mono" rows={8}
                  value={layersJson} onChange={e=>setLayersJson(e.target.value)}/>
              </details>
            </div>}
        <label className="block space-y-1 text-sm">Seed de variation
          <input className="w-full rounded-lg border border-white/15 bg-black/50 p-2 font-mono text-xs" value={seed} maxLength={128} onChange={e => setSeed(e.target.value)}/>
        </label>
        <label className="flex items-start gap-2 text-xs text-zinc-300">
          <input type="checkbox" className="mt-1" checked={rightsConfirmed} onChange={e => setRightsConfirmed(e.target.checked)} />
          Je confirme disposer des droits nécessaires sur les instructions, images, calques et références que je fournirai. Cette déclaration ne remplace pas une vérification Art-ID.
        </label>
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="text-xs uppercase tracking-wide text-zinc-400">Devis de génération</p>
          <p className="mt-1 font-semibold">{art ? art.paperCreditsTotal + ' crédits PAPER (simulation)' : '—'}</p>
          <p className="mt-1 text-xs text-zinc-500">Tarif simulé de référence : 3 crédits papier / image, version paper-1. <strong>Aucun prix EUR, réservation de crédit réel ou fournisseur IA n’est encore configuré.</strong></p>
          <button type="button" disabled className="btn-primary mt-3 text-xs">Payer et générer (désactivé jusqu’à vérification)</button>
        </div>
      </section>

      <section className="card space-y-4" aria-labelledby="metadata-heading">
        <h2 id="metadata-heading" className="text-xl font-semibold">2. Variations et métadonnées par NFT</h2>
        {artError && <div role="alert" className="rounded-lg border border-rose-500/30 p-3 text-xs text-rose-200">{artError}</div>}
        {art && <>
          <div className="grid grid-cols-3 gap-2">
            {art.editions.slice(0, 6).map((item, i) => <button key={item.edition}
              type="button" className={'min-h-28 rounded-xl border p-2 text-left transition ' +
                (edition === item.edition ? 'border-lime-300/80' : 'border-white/10')}
              style={{background: i%3===0 ? 'linear-gradient(140deg,#151a36,#6b4f85,#a98e6c)' :
                i%3===1 ? 'linear-gradient(130deg,#29354e,#427b88,#d09b72)' : 'linear-gradient(145deg,#282c22,#9e665a,#debd8e)'}}
              onClick={() => setEdition(item.edition)} aria-label={'Sélectionner les métadonnées NFT '+item.edition}>
              <span className="block rounded bg-black/50 px-2 py-1 text-xs font-semibold">#{item.edition}</span>
              <span className="mt-4 block text-[10px] text-white/80">Aperçu de palette illustratif · pas une image IA</span>
            </button>)}
          </div>
          <label className="block space-y-1 text-sm">Édition à personnaliser
            <select className="w-full rounded-lg border border-white/15 bg-black/50 p-2" value={edition}
              onChange={e => setEdition(Number(e.target.value))}>
              {art.editions.map(item => <option key={item.edition} value={item.edition}>NFT #{item.edition}</option>)}
            </select>
          </label>
          {picked && <>
            <label className="block space-y-1 text-sm">Nom de ce NFT
              <input className="w-full rounded-lg border border-white/15 bg-black/50 p-2"
                value={overrides[String(edition)]?.name ?? picked.name} maxLength={80}
                onChange={e => updateEdition('name', e.target.value)}/>
            </label>
            <label className="block space-y-1 text-sm">Description de ce NFT
              <textarea className="w-full rounded-lg border border-white/15 bg-black/50 p-2" rows={3}
                value={overrides[String(edition)]?.description ?? picked.description} maxLength={600}
                onChange={e => updateEdition('description', e.target.value)}/>
            </label>
            <label className="block space-y-1 text-sm">Attributs personnalisés de ce NFT
              <input className="w-full rounded-lg border border-white/15 bg-black/50 p-2 text-xs"
                placeholder="Signature=Artiste; Ambiance=Éthérée"
                value={(overrides[String(edition)]?.extraAttributes || []).map(x=>x.trait_type+'='+x.value).join('; ')}
                onChange={e=>updateExtraAttributes(e.target.value)}/>
              <span className="text-xs text-zinc-500">Ajoute 0–8 traits supplémentaires sous la forme Attribut=Valeur, séparés par « ; ». Ne remplace pas les traits calculés depuis les calques.</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {picked.attributes.map((trait,i) => <span key={trait.trait_type+i} className="rounded-full border border-white/15 px-2 py-1 text-[11px]">{trait.trait_type}: {trait.value}</span>)}
            </div>
            <pre className="max-h-64 overflow-auto rounded-lg bg-black/40 p-3 text-[10px] leading-5 text-zinc-300">{JSON.stringify(picked, null, 2)}</pre>
          </>}
          <button type="button" className="btn-secondary text-sm" onClick={() => exportJson('xartists-collection-metadata-DRAFT.json', art)}>
            Exporter {art.quantity} fiches NFT (brouillon JSON)
          </button>
          <p className="text-xs text-zinc-500">Les traits sont reproductibles à partir du seed et du plan. Sans image générée, les champs média restent nuls et ces fiches ne doivent pas être mintées.</p>
        </>}
      </section>
    </div>

    <section className="card space-y-3" aria-labelledby="ai-provider-heading">
      <h2 id="ai-provider-heading" className="text-xl font-semibold">3. Génération d’images avec IA — préproduction</h2>
      <p className="text-sm text-zinc-400">Le brief et le plan de traits prépareront les appels à un fournisseur IA choisi (OpenAI, GPU AMD/NVIDIA ou autre). Aucune génération réelle n’est simulée comme terminée.</p>
      <label className="block space-y-1 text-sm">Instructions de style et de création
        <textarea className="w-full rounded-lg border border-white/15 bg-black/50 p-3" rows={3} maxLength={1200} value={brief} onChange={e=>setBrief(e.target.value)}/>
      </label>
      <button type="button" className="btn-secondary text-sm" disabled={brief.trim().length < 10} onClick={copyBrief}>Copier le brief pour le plugin xArtists</button>
      {copyStatus && <p role="status" className="text-xs text-zinc-300">{copyStatus}</p>}
      <p className="text-xs text-zinc-500">À prévoir : contrôle des droits Art-ID/Physical Steward, quote fournisseur signé, budget et autorisation du créateur, réservation idempotente, rendu par calques/modèle, revue humaine, IPFS puis signature wallet.</p>
    </section>

    <div className="grid gap-5 lg:grid-cols-2">
      <section className="card space-y-4" aria-labelledby="distributor-heading">
        <h2 id="distributor-heading" className="text-xl font-semibold">4. Ton distributeur de collection NFT</h2>
        <label className="block space-y-1 text-sm">Nom du distributeur
          <input className="w-full rounded-lg border border-white/15 bg-black/50 p-2" value={distributorTitle} maxLength={80} onChange={e=>setDistributorTitle(e.target.value)}/>
        </label>
        <label className="block space-y-1 text-sm">Identifiant de collection MultiversX
          <input className="w-full rounded-lg border border-white/15 bg-black/50 p-2 font-mono" placeholder="XART-abcdef" value={collectionId} onChange={e=>setCollectionId(e.target.value)}/>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1 text-sm">Mode de distribution
            <select className="w-full rounded-lg border border-white/15 bg-black/50 p-2" value={distributorMode} onChange={e=>setDistributorMode(e.target.value as DistributorMode)}>
              <option value="escrow_inventory">NFT déjà mintés (dépôt sous séquestre)</option>
              <option value="lazy_mint">Mint à la demande (rôle NFTCreate SC)</option>
            </select>
          </label>
          <label className="block space-y-1 text-sm">Prix fixe (EGLD / NFT)
            <input className="w-full rounded-lg border border-white/15 bg-black/50 p-2" value={fixedPrice} onChange={e=>setFixedPrice(e.target.value)}/>
          </label>
        </div>
        {distributorMode === 'escrow_inventory'
          ? <label className="block space-y-1 text-sm">NFT existants dans cette collection (un identifiant par ligne)
              <textarea className="w-full rounded-lg border border-white/15 bg-black/50 p-3 font-mono text-xs" rows={5} value={inventory} placeholder={'XART-abcdef-01\nXART-abcdef-02'} onChange={e=>setInventory(e.target.value)}/>
              <span className="text-xs text-zinc-500">Le formulaire ne transfère rien. Les dépôts nécessiteront un contrat audité et la signature du propriétaire.</span>
            </label>
          : <label className="block space-y-1 text-sm">URI IPFS des métadonnées préparées et épinglées (une par ligne)
              <textarea className="w-full rounded-lg border border-white/15 bg-black/50 p-3 font-mono text-xs" rows={5} value={metadataUris} placeholder={'ipfs://bafy.../1.json'} onChange={e=>setMetadataUris(e.target.value)}/>
              <span className="text-xs text-zinc-500">Supply du projet : {quantity} NFT. Le contrat doit recevoir un rôle NFTCreate vérifié ; un fichier JSON non publié ne suffit pas.</span>
            </label>}
        <label className="block space-y-1 text-sm">Maximum par wallet (1–100)
          <input type="number" min={1} max={100} className="w-full rounded-lg border border-white/15 bg-black/50 p-2" value={perWalletLimit} onChange={e=>setPerWalletLimit(Number(e.target.value))}/>
        </label>
        {distributorResult.error && <p role="alert" className="text-xs text-amber-200">Configuration à compléter : {distributorResult.error}</p>}
        {distributorResult.draft && <>
          <DistributorStatus draft={distributorResult.draft}/>
          <button type="button" className="btn-secondary text-sm" onClick={()=>exportJson('xartists-distributeur-PAPER.json',distributorResult.draft)}>Exporter le contrat de préparation (JSON)</button>
        </>}
        <button type="button" disabled className="btn-primary text-sm">Déployer mon SC & déposer les NFT (sécurité non validée)</button>
      </section>

      <section className="card space-y-4" aria-labelledby="draw-heading">
        <h2 id="draw-heading" className="text-xl font-semibold">5. Tirage aléatoire — simulation gratuite</h2>
        <p className="text-sm text-zinc-400">Teste la sélection sans remise sur un inventaire connu. Le seed appartient à l’utilisateur : cela ne prouve pas l’équité d’un tirage payant.</p>
        <label className="block space-y-1 text-sm">Seed de démonstration
          <input className="w-full rounded-lg border border-white/15 bg-black/50 p-2 font-mono text-xs" value={drawSeed} onChange={e=>setDrawSeed(e.target.value)}/>
        </label>
        <button type="button" className="btn-secondary text-sm" onClick={()=>void handleDraw()}
          disabled={!distributorResult.draft || distributorResult.draft.mode!=='escrow_inventory' || soldIds.length>=distributorResult.draft.supplyCap}>
          Sélectionner un NFT — PAPER, sans paiement
        </button>
        {drawError && <p role="alert" className="text-rose-300 text-xs">{drawError}</p>}
        {draw && <div className="rounded-xl border border-lime-300/25 bg-lime-300/5 p-3 text-sm">
          <p>Résultat simulé : <b className="font-mono">{draw.selectedNftId}</b></p>
          <p>Restants dans cette session : {draw.itemsRemainingAfter}</p>
          <p className="mt-2 break-all font-mono text-[10px] text-zinc-400">SHA-256 : {draw.drawDigest}</p>
          <p className="mt-2 text-xs text-amber-200">Aucun reçu blockchain ni transfert NFT ; ce tirage reste manipulable par son seed.</p>
        </div>}
        <button type="button" className="btn-secondary text-xs" onClick={()=>{setSoldIds([]);setDraw(null);setDrawError('')}}>Réinitialiser la simulation</button>
        <p className="text-xs text-zinc-500">Avant toute vente réelle : tirage non anticipable et auditable (commit/reveal ou oracle vérifié), anti-réentrance, inventaire atomique, remboursement sûr, audit contractuel, limites d’achat et restrictions légales éventuelles.</p>
      </section>
    </div>
    <footer className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
      <Link className="underline hover:text-white" to="/create/studio">Studio NFT / wallet artiste</Link>
      <Link className="underline hover:text-white" to="/marketplace">Marketplace</Link>
      <Link className="underline hover:text-white" to="/go-live">État des fonctionnalités live</Link>
    </footer>
  </div>
}
