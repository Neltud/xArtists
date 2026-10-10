/**
 * PhysicalNftCertifier — CoA / CoP phygital (paper).
 * Upload photo + métadonnées → Certificat d'Authenticité + Propriété.
 * Réévaluation future via intent LIA (paper-only jusqu'à GO_LIVE).
 */
import { useCallback, useMemo, useState } from 'react'
import {
  createBrowserApproxCertificate,
  type DigitalTwinCertificate,
  dispatchMintSculpture1of1,
} from '../lib/digitalTwinCertificate'

type CertKind = 'CoA' | 'CoP'

type FormState = {
  title: string
  artist: string
  medium: string
  year: string
  dimensions: string
  location: string
  ownerName: string
  notes: string
}

const EMPTY: FormState = {
  title: '',
  artist: '',
  medium: '',
  year: '',
  dimensions: '',
  location: '',
  ownerName: '',
  notes: '',
}

function sha256Preview(file: File): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const buf = reader.result as ArrayBuffer
        const hash = await crypto.subtle.digest('SHA-256', buf)
        const hex = Array.from(new Uint8Array(hash))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
        resolve(hex)
      } catch {
        resolve(`pending-${file.name}-${file.size}`)
      }
    }
    reader.onerror = () => resolve(`pending-${file.name}`)
    reader.readAsArrayBuffer(file.slice(0, Math.min(file.size, 2_000_000)))
  })
}

function parseDimsCm(raw: string): { h: number; w: number; d: number } {
  const nums = (raw.match(/[\d.]+/g) || []).map(Number).filter(n => Number.isFinite(n) && n > 0)
  return {
    h: nums[0] || 30,
    w: nums[1] || 20,
    d: nums[2] || 5,
  }
}

export type PhysicalCertificate = {
  kind: CertKind
  id: string
  issuedAt: string
  form: FormState
  photoName?: string
  photoSha256?: string
  photoPreviewUrl?: string
  twin: DigitalTwinCertificate
  liaReevalNote: string
}

function buildCoA(p: PhysicalCertificate): string {
  return [
    '═══════════════════════════════════════',
    '  CERTIFICAT D’AUTHENTICITÉ (CoA)',
    '  xArtists · Phygital · Paper',
    '═══════════════════════════════════════',
    `ID        : ${p.id}`,
    `Émis      : ${p.issuedAt}`,
    `Titre     : ${p.form.title}`,
    `Artiste   : ${p.form.artist}`,
    `Médium    : ${p.form.medium || '—'}`,
    `Année     : ${p.form.year || '—'}`,
    `Dims      : ${p.form.dimensions || '—'}`,
    `Lieu      : ${p.form.location || '—'}`,
    `Photo SHA : ${p.photoSha256?.slice(0, 16) || '—'}…`,
    `Grade     : ${p.twin.grade}`,
    '',
    'Ce document atteste de l’enregistrement',
    'des métadonnées de l’œuvre physique.',
    'Non on-chain tant que GO_LIVE / mint SC.',
    '═══════════════════════════════════════',
  ].join('\n')
}

function buildCoP(p: PhysicalCertificate): string {
  return [
    '═══════════════════════════════════════',
    '  CERTIFICAT DE PROPRIÉTÉ (CoP)',
    '  xArtists · Phygital · Paper',
    '═══════════════════════════════════════',
    `ID        : ${p.id}`,
    `Émis      : ${p.issuedAt}`,
    `Œuvre     : ${p.form.title}`,
    `Artiste   : ${p.form.artist}`,
    `Titulaire : ${p.form.ownerName || '—'}`,
    `Notes     : ${p.form.notes || '—'}`,
    `Twin hash : ${p.twin.mesh.sha256.slice(0, 16)}…`,
    '',
    'Attestation de propriété déclarative.',
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

  const onFile = useCallback((f: File | null) => {
    setFile(f)
    setCert(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(f ? URL.createObjectURL(f) : null)
  }, [preview])

  const canSubmit = useMemo(
    () => form.title.trim().length >= 2 && form.artist.trim().length >= 2,
    [form.title, form.artist],
  )

  const generate = async () => {
    if (!canSubmit) return
    setBusy(true)
    try {
      const dims = parseDimsCm(form.dimensions)
      const photoSha = file ? await sha256Preview(file) : 'no-photo'
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
            CoA (authenticité) & CoP (propriété) — métadonnées + photo. Mint on-chain après GO_LIVE.
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          {(['CoA', 'CoP'] as CertKind[]).map(k => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`text-[11px] px-2.5 py-1 rounded-lg border ${
                kind === k
                  ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-100'
                  : 'border-white/10 text-zinc-400'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(
          [
            ['title', 'Titre de l’œuvre *'],
            ['artist', 'Artiste *'],
            ['medium', 'Médium / matériau'],
            ['year', 'Année'],
            ['dimensions', 'Dimensions (H×L×P cm)'],
            ['location', 'Lieu / atelier'],
            ['ownerName', 'Titulaire (CoP)'],
          ] as [keyof FormState, string][]
        ).map(([key, label]) => (
          <label key={key} className="block space-y-1">
            <span className="text-[11px] text-zinc-500">{label}</span>
            <input
              className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-zinc-100"
              value={form[key]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              placeholder={label}
            />
          </label>
        ))}
        <label className="block space-y-1 sm:col-span-2">
          <span className="text-[11px] text-zinc-500">Notes</span>
          <textarea
            className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-zinc-100 min-h-[72px]"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Provenance, état, numéro d’inventaire…"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 text-[12px] text-zinc-300 cursor-pointer">
          <span className="rounded-lg border border-dashed border-white/20 px-3 py-2 hover:border-cyan-400/40">
            {file ? file.name : 'Upload photo œuvre'}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => onFile(e.target.files?.[0] || null)}
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
          disabled={!canSubmit || busy}
          onClick={() => void generate()}
          className="btn-primary text-xs ml-auto disabled:opacity-40"
        >
          {busy ? 'Génération…' : `Générer ${kind}`}
        </button>
      </div>

      {cert && (
        <div className="rounded-xl border border-violet-400/25 bg-violet-500/5 p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12px] font-semibold text-violet-100">
              {cert.kind} · {cert.id}
            </p>
            <span className="text-[10px] text-zinc-500 mono">{cert.issuedAt.slice(0, 19)}Z</span>
          </div>
          <pre className="text-[10px] leading-relaxed text-zinc-300 mono whitespace-pre-wrap bg-black/40 rounded-lg p-3 max-h-48 overflow-y-auto">
            {textDoc}
          </pre>
          <p className="text-[11px] text-zinc-500">{cert.liaReevalNote}</p>
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
          </div>
        </div>
      )}

      <p className="text-[10px] text-zinc-600 leading-relaxed">
        Paper only — aucun mint SC automatique. Grade browser-approx tant que pipeline labo COLMAP non
        branché. SHA-256 photo = empreinte locale (2 Mo max lus).
      </p>
    </div>
  )
}
