/**
 * Creator Factory -> verifiable local source digest -> review-only handoff.
 * Explicit user action reads file bytes locally. No network, upload or wallet calls.
 */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ArtCollectionDraft } from '../lib/artCollectionPaper.mjs'
import { prepareLocalCreatorEvidence } from '../lib/creatorEvidencePaper.mjs'
import type { LocalCreatorEvidence } from '../lib/creatorEvidencePaper.mjs'

type Props = {
  art: ArtCollectionDraft | null
  edition: number
  brief: string
  rightsDeclared: boolean
}

function exportJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function CreatorEvidenceHandoff({ art, edition, brief, rightsDeclared }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [promotionPermission, setPromotionPermission] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ source: File; fingerprint: string; record: LocalCreatorEvidence } | null>(null)
  const revision = useRef(0)
  const fingerprint = JSON.stringify({
    planDigest: art?.planDigest || null,
    edition,
    metadata: art?.editions[edition - 1] || null,
    brief,
    rightsDeclared,
    promotionPermission,
  })

  // A new edition/metadata/rights/brief version invalidates all prior exports.
  useEffect(() => {
    revision.current += 1
    setResult(null)
    setError('')
    setBusy(false)
  }, [fingerprint])

  const pick = (next: File | null) => {
    revision.current += 1
    setFile(next)
    setResult(null)
    setError('')
    setBusy(false)
  }

  const prepare = async () => {
    if (busy || !file || !art) return
    const ticket = ++revision.current
    setBusy(true)
    setResult(null)
    setError('')
    try {
      const record = await prepareLocalCreatorEvidence({
        file, art, edition, creativeBrief: brief,
        rightsDeclared, promotionPermissionDeclared: promotionPermission,
      })
      if (revision.current === ticket) setResult({ source: file, fingerprint, record })
    } catch (cause) {
      if (revision.current === ticket)
        setError(cause instanceof Error ? cause.message : 'Vérification impossible')
    } finally {
      if (revision.current === ticket) setBusy(false)
    }
  }
  const verified = result?.source === file && result.fingerprint === fingerprint ? result.record : null

  return <section className="card space-y-4" aria-labelledby="creator-evidence-heading" data-testid="creator-local-handoff">
    <div className="space-y-2">
      <h2 id="creator-evidence-heading" className="text-xl font-semibold">3 bis. Preuve du média et transmission aux modules</h2>
      <p className="text-sm leading-relaxed text-[color:var(--xa-text-secondary)]">
        Choisis le fichier réel de l’édition, puis calcule sa signature SHA-256 <strong>sur cet appareil</strong>.
        Deux dossiers distincts sont préparés pour la création NFT et la bande-annonce.
        Le calcul n’envoie pas le fichier et ne prouve ni les droits d’auteur ni sa publication sur IPFS.
      </p>
    </div>
    <p className="text-sm text-[color:var(--xa-text)]">
      Édition : <strong>{art?.editions[edition - 1]?.name || 'Plan de collection à compléter'}</strong>
    </p>
    <label className="block space-y-1 text-sm">
      Fichier original à examiner (JPG, PNG, WebP ≤16 Mio · MP4 ≤48 Mio · GLB ≤32 Mio)
      <input type="file"
        accept=".jpg,.jpeg,.png,.webp,.mp4,.glb,image/jpeg,image/png,image/webp,video/mp4,model/gltf-binary"
        className="block w-full min-h-[44px] rounded-xl border border-[color:var(--xa-border)] p-3 text-sm"
        onChange={e => pick(e.target.files?.[0] || null)}
      />
    </label>
    {file && <p className="text-xs break-words text-[color:var(--xa-text-secondary)]">
      Sélection locale : {file.name} · {(file.size / 1048576).toFixed(2)} Mio
    </p>}
    <label className="flex items-start gap-3 text-sm leading-relaxed">
      <input type="checkbox" checked={promotionPermission}
        className="mt-1 h-4 w-4"
        onChange={e => setPromotionPermission(e.target.checked)}
      />
      Je déclare disposer d’une permission de promotion pour cette version du média.
      Cette déclaration n’est pas une licence vérifiée ni une autorisation de publier une vidéo.
    </label>
    <button type="button" className="btn-secondary min-h-[44px] text-sm"
      onClick={() => { void prepare() }} disabled={!file || !art || busy}>
      {busy ? 'Calcul SHA-256 local…' : 'Vérifier les octets et préparer les dossiers'}
    </button>
    {error && <p role="alert" className="rounded-lg border border-amber-500/40 p-3 text-sm text-amber-700 dark:text-amber-200">
      Impossible de préparer la preuve locale : {error}. Aucun fichier transmis.
    </p>}
    {verified && <div className="space-y-3 rounded-xl border border-[color:var(--xa-border)] p-3" role="status">
      <p className="text-sm font-semibold">SHA-256 du fichier calculé — vérification locale uniquement</p>
      <p className="font-mono break-all text-xs">{verified.fileSha256}</p>
      <p className="text-xs text-[color:var(--xa-text-secondary)]">Engagement du dossier : <span className="font-mono break-all">{verified.dossierDigest}</span></p>
      <p className="text-sm">Création : <strong>à revoir</strong> · Trailer : <strong>à revoir</strong> · IPFS : <strong>non publié</strong> · NFT : <strong>non minté</strong></p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary min-h-[44px] text-sm"
          onClick={() => exportJson('xartists-preuve-locale-PAPER.json', verified)}>
          Exporter la preuve locale
        </button>
        <button type="button" className="btn-secondary min-h-[44px] text-sm"
          onClick={() => exportJson('xartists-creation-handoff-BLOCKED.json', verified.creatorHandoff)}>
          Dossier Création (non vérifié)
        </button>
        <button type="button" className="btn-secondary min-h-[44px] text-sm"
          onClick={() => exportJson('xartists-trailer-handoff-BLOCKED.json', verified.trailerHandoff)}>
          Dossier Trailer (non vérifié)
        </button>
      </div>
    </div>}
    <p className="text-sm text-[color:var(--xa-text-secondary)]">
      Après contrôle indépendant des droits, poursuis dans <Link to="/create/studio" className="underline font-semibold">Creator Studio</Link> :
      upload IPFS sécurisé si le serveur l’autorise, vérification des CID, rôle NFTCreate et signature par le wallet propriétaire.
      La Factory ne lance aucune transaction. Un distributeur reste un <strong>brouillon non déployé</strong>.
    </p>
  </section>
