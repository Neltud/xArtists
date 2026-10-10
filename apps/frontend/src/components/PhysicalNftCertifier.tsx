/**
 * Phygital certifier — upload HD + métadonnées → CoA / CoP + intent LIA.
 * Qualité photo: ≥2 Mo, ≥8 MP, contraste σ≥18 ; capture native environment.
 */
import { useCallback, useMemo, useState } from 'react'
import { createBrowserApproxCertificate } from '../lib/digitalTwin/browserApprox'
import { dispatchMintSculpture1of1 } from '../lib/digitalTwin/mintIntent'

type CertKind = 'CoA' | 'CoP'

type FormState = {
  title: string
  artist: string
  medium: string
  year: string
  dimensions: string
  location: string
  notes: string
}

const EMPTY: FormState = {
  title: '',
  artist: '',
  medium: '',
  year: '',
  dimensions: '',
  location: '',
  notes: '',
}

function parseDimsCm(raw: string): { h: number; w: number; d: number } {
  const nums = raw.match(/[\d.,]+/g)?.map(s => Number(s.replace(',', '.'))) || []
  return { h: nums[0] || 30, w: nums[1] || 20, d: nums[2] || 5 }
}

/** Compress image (max edge 1024, JPEG 0.72) before SHA — avoids UI freeze on large photos. */
async function compressImageForHash(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    return file.slice(0, Math.min(file.size, 512_000))
  }
  try {
    const bitmap = await createImageBitmap(file)
    const max = 1024
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      return file.slice(0, Math.min(file.size, 512_000))
    }
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close()
    const blob: Blob | null = await new Promise(res => canvas.toBlob(b => res(b), 'image/jpeg', 0.72))
    return blob || file.slice(0, Math.min(file.size, 512_000))
  } catch {
    return file.slice(0, Math.min(file.size, 512_000))
  }
}

/** Seuils qualité HD pour phygital (anti-compression messagerie / flou). */
const MIN_FILE_BYTES = 2 * 1024 * 1024 // 2 Mo
const MIN_MEGAPIXELS = 8 // 8 MP
const MIN_CONTRAST_STD = 18 // écart-type luminance (0–255)

export type PhotoQualityResult =
  | { ok: true; width: number; height: number; mp: number; contrastStd: number }
  | { ok: false; reason: string }

/** Charge image + calcule variance de contraste (sous-échantillon canvas). */
async function validateHighQualityPhoto(file: File): Promise<PhotoQualityResult> {
  if (!file.type.startsWith('image/')) {
    return { ok: false, reason: 'Fichier non image' }
  }
  if (file.size < MIN_FILE_BYTES) {
    return {
      ok: false,
      reason: `Fichier trop compressé (${(file.size / 1e6).toFixed(1)} Mo < 2 Mo) — photographie native recommandée`,
    }
  }
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return { ok: false, reason: 'Impossible de lire l\'image' }
  }
  const width = bitmap.width
  const height = bitmap.height
  const mp = (width * height) / 1_000_000
  if (mp < MIN_MEGAPIXELS) {
    bitmap.close()
    return {
      ok: false,
      reason: `Résolution insuffisante ${width}×${height} (${mp.toFixed(1)} MP < 8 MP)`,
    }
  }
  const scale = Math.min(1, 256 / Math.max(width, height))
  const sw = Math.max(1, Math.floor(width * scale))
  const sh = Math.max(1, Math.floor(height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = sw
  canvas.height = sh
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    bitmap.close()
    return { ok: false, reason: 'Canvas indisponible' }
  }
  ctx.drawImage(bitmap, 0, 0, sw, sh)
  bitmap.close()
  let data: ImageData
  try {
    data = ctx.getImageData(0, 0, sw, sh)
  } catch {
    return { ok: false, reason: 'Lecture pixels refusée' }
  }
  const px = data.data
  const luminances: number[] = []
  for (let i = 0; i < px.length; i += 16) {
    const r = px[i]
    const g = px[i + 1]
    const b = px[i + 2]
    luminances.push(0.299 * r + 0.587 * g + 0.114 * b)
  }
  const n = luminances.length || 1
  const mean = luminances.reduce((a, b) => a + b, 0) / n
  const variance = luminances.reduce((a, b) => a + (b - mean) ** 2, 0) / n
  const contrastStd = Math.sqrt(variance)
  if (contrastStd < MIN_CONTRAST_STD) {
    return {
      ok: false,
      reason: `Image trop floue / contraste trop faible (σ=${contrastStd.toFixed(1)} < ${MIN_CONTRAST_STD})`,
    }
  }
  return { ok: true, width, height, mp, contrastStd }
}

async function sha256Preview(file: File): Promise<string> {
  try {
    const compressed = await compressImageForHash(file)
    const buf = await compressed.arrayBuffer()
    const hash = await crypto.subtle.digest('SHA-256', buf)
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  } catch {
    return `pending-${file.name}-${file.size}`
  }
}

type PhysicalCertificate = {
  kind: CertKind
  id: string
  issuedAt: string
  form: FormState
  photoName?: string
  photoSha256?: string
  photoPreviewUrl?: string
  twin: ReturnType<typeof createBrowserApproxCertificate>
  liaReevalNote: string
}

function buildCoA(p: PhysicalCertificate): string {
  return [
    '═══════════════════════════════════════',
    '  CERTIFICAT D\'AUTHENTICITÉ (CoA)',
    '  xArtists · Phygital Paper',
    '═══════════════════════════════════════',
    `ID : ${p.id}`,
    `Émis : ${p.issuedAt}`,
    `Titre : ${p.form.title}`,
    `Artiste : ${p.form.artist}`,
    `Médium : ${p.form.medium || '—'}`,
    `Année : ${p.form.year || '—'}`,
    `Dimensions : ${p.form.dimensions || '—'}`,
    `Lieu : ${p.form.location || '—'}`,
    `Photo SHA : ${p.photoSha256?.slice(0, 16) || '—'}…`,
    `Notes : ${p.form.notes || '—'}`,
    '───────────────────────────────────────',
    'Paper only — pas de mint SC automatique.',
    '═══════════════════════════════════════',
  ].join('\n')
}

function buildCoP(p: PhysicalCertificate): string {
  return [
    '═══════════════════════════════════════',
    '  CERTIFICAT DE PROPRIÉTÉ (CoP)',
    '  xArtists · Phygital Paper',
    '═══════════════════════════════════════',
    `ID : ${p.id}`,
    `Émis : ${p.issuedAt}`,
    `Œuvre : ${p.form.title}`,
    `Artiste : ${p.form.artist}`,
    `Twin hash : ${p.twin.mesh.sha256.slice(0, 16)}…`,
    `Photo SHA : ${p.photoSha256?.slice(0, 16) || '—'}…`,
    '───────────────────────────────────────',
    'Réévaluation LIA possible (paper).',
    '═══════════════════════════════════════',
  ].join('\n')
}

export default function PhysicalNftCertifier() {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [cert, setCert] = useState<PhysicalCertificate | null>(null)
  const [kind, setKind] = useState<CertKind>('CoA')
  const [copied, setCopied] = useState(false)
  const [lockedPhotoSha, setLockedPhotoSha] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [photoOkMeta, setPhotoOkMeta] = useState<{ mp: number; contrastStd: number } | null>(null)

  const onFile = useCallback(async (f: File | null) => {
    setCert(null)
    setLockedPhotoSha(null)
    setPhotoError(null)
    setPhotoOkMeta(null)
    if (preview) URL.revokeObjectURL(preview)
    if (!f) {
      setFile(null)
      setPreview(null)
      return
    }
    setPreview(URL.createObjectURL(f))
    setFile(f)
    const q = await validateHighQualityPhoto(f)
    if (!q.ok) {
      setPhotoError(q.reason)
      setFile(null)
      return
    }
    setPhotoOkMeta({ mp: q.mp, contrastStd: q.contrastStd })
  }, [preview])

  const canSubmit = useMemo(
    () => form.title.trim().length >= 2 && form.artist.trim().length >= 2,
    [form.title, form.artist],
  )

  const generate = async () => {
    if (!canSubmit) return
    if (photoError) return
    if (file && !photoOkMeta) return
    setBusy(true)
    try {
      const dims = parseDimsCm(form.dimensions)
      const photoSha =
        lockedPhotoSha ||
        (file ? await sha256Preview(file) : 'no-photo')
      if (!lockedPhotoSha && photoSha && photoSha !== 'no-photo') {
        setLockedPhotoSha(photoSha)
      }
      const twin = createBrowserApproxCertificate({
        title: form.title.trim(),
        artist: form.artist.trim(),
        heightCm: dims.h,
        widthCm: dims.w,
        depthCm: dims.d,
        imageCount: file ? 1 : 0,
        sha256Placeholder: photoSha,
      })
      twin.physical = {
        material: form.medium || undefined,
        inventoryNote: [form.year, form.location, form.notes].filter(Boolean).join(' · ') || undefined,
      }

      const id = `XA-PHY-${Date.now().toString(36).toUpperCase()}`
      const issuedAt = new Date().toISOString()
      const payload: PhysicalCertificate = {
        kind,
        id,
        issuedAt,
        form: { ...form },
        photoName: file?.name,
        photoSha256: photoSha,
        photoPreviewUrl: preview || undefined,
        twin,
        liaReevalNote:
          'LIA peut proposer une réévaluation (comparables, marché, état) via intent paper — pas de conseil financier.',
      }
      setCert(payload)
      setCopied(false)
    } finally {
      setBusy(false)
    }
  }

  const textDoc = cert ? (cert.kind === 'CoA' ? buildCoA(cert) : buildCoP(cert)) : ''

  const copyDoc = async () => {
    if (!textDoc) return
    try {
      await navigator.clipboard.writeText(textDoc)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  const requestLiaReeval = () => {
    if (!cert) return
    if (photoError) return
    if (cert.photoName && !cert.photoSha256) return
    window.dispatchEvent(
      new CustomEvent('lia-intent', {
        detail: {
          lip: {
            type: 'PHYGITAL_REEVAL',
            paper: true,
            raw: `reeval physical ${cert.form.title}`,
            certificateId: cert.id,
            twin: cert.twin,
            form: cert.form,
            ts: new Date().toISOString(),
          },
        },
      }),
    )
  }

  const requestPaperMint = () => {
    if (!cert) return
    dispatchMintSculpture1of1(cert.twin, { physicalCertId: cert.id, kind: cert.kind })
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-4 max-w-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400/80 font-tech">
            Phygital · Paper
          </p>
          <h2 className="text-lg font-semibold text-white">Certification NFT physique</h2>
          <p className="text-[12px] text-zinc-400 mt-1 leading-relaxed">
            CoA (authenticité) & CoP (propriété) — photo HD native (≥2 Mo · 8 MP). Mint on-chain après GO_LIVE.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {(['CoA', 'CoP'] as CertKind[]).map(k => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`px-3 py-1 rounded-lg text-[12px] border ${
              kind === k
                ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-100'
                : 'border-white/10 text-zinc-400'
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {(
          [
            ['title', 'Titre'],
            ['artist', 'Artiste'],
            ['medium', 'Médium'],
            ['year', 'Année'],
            ['dimensions', 'Dimensions (H×L×P cm)'],
            ['location', 'Lieu'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block text-[11px] text-zinc-500 space-y-1">
            {label}
            <input
              className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
              value={form[key]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            />
          </label>
        ))}
        <label className="block text-[11px] text-zinc-500 space-y-1 sm:col-span-2">
          Notes
          <textarea
            className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white min-h-[64px]"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="cursor-pointer">
          <span className="rounded-lg border border-dashed border-white/20 px-3 py-2 hover:border-cyan-400/40 text-[12px] text-zinc-300">
            {file ? file.name : '📷 Photo HD (capteur principal)'}
          </span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => void onFile(e.target.files?.[0] || null)}
          />
        </label>
        {preview && (
          <img
            src={preview}
            alt="Aperçu"
            className="h-14 w-14 rounded-lg object-cover border border-white/10"
          />
        )}
        <button
          type="button"
          disabled={!canSubmit || busy || !!photoError || (!!file && !photoOkMeta)}
          onClick={() => void generate()}
          className="btn-primary text-xs ml-auto disabled:opacity-40"
        >
          {busy ? 'Génération…' : `Générer ${kind}`}
        </button>
      </div>
      {photoError && (
        <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-100" role="alert">
          ⚠ Qualité photo refusée — {photoError}
          <p className="text-[10px] text-amber-200/70 mt-1">
            Utilise le capteur principal (pas une capture messagerie). Min. 2 Mo · 8 MP · net.
          </p>
        </div>
      )}
      {photoOkMeta && !photoError && (
        <p className="text-[10px] text-emerald-300/90">
          ✓ Photo HD validée · {photoOkMeta.mp.toFixed(1)} MP · contraste σ={photoOkMeta.contrastStd.toFixed(0)}
        </p>
      )}

      {cert && (
        <div className="rounded-xl border border-violet-400/25 bg-violet-500/5 p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12px] font-semibold text-violet-100">
              {cert.kind} · {cert.id}
            </p>
            <span className="text-[10px] text-zinc-500 mono">{cert.issuedAt.slice(0, 19)}Z</span>
          </div>
          <pre className="text-[10px] text-zinc-400 mono whitespace-pre-wrap max-h-40 overflow-y-auto">
            {textDoc}
          </pre>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary text-xs" onClick={() => void copyDoc()}>
              {copied ? '✓ Copié !' : 'Copier certificat'}
            </button>
            <button type="button" className="btn-secondary text-xs" onClick={requestLiaReeval}>
              Demander réévaluation LIA
            </button>
            <button type="button" className="btn-secondary text-xs" onClick={requestPaperMint}>
              Intent mint paper 1/1
            </button>
            <a href="https://xportal.com" target="_blank" rel="noreferrer" className="btn-primary text-xs inline-flex items-center">
              Ouvrir xPortal ↗
            </a>
          </div>
          {lockedPhotoSha && (
            <p className="text-[10px] mono text-zinc-500">
              SHA-256 figé · {lockedPhotoSha.slice(0, 16)}…{lockedPhotoSha.slice(-8)}
            </p>
          )}
        </div>
      )}

      <p className="text-[10px] text-zinc-600 leading-relaxed">
        Paper only — aucun mint SC automatique. Photo HD obligatoire pour LIA PHYGITAL_REEVAL si une image est jointe.
        SHA-256 = empreinte JPEG compressé (max 1024px) — immuable après génération.
      </p>
    </div>
  )
}
