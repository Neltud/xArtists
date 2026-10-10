/**
 * Studio jumeau numérique — capture labo → job COLMAP → certificat → mint 1/1 paper.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  canMintOneOfOne,
  createBrowserApproxCertificate,
  dispatchMintSculpture1of1,
  type DigitalTwinCertificate,
} from '../lib/digitalTwinCertificate'
import { submitColmapJob, listPaperJobs } from '../lib/colmapJobClient'
import PhysicalNftCertifier from '../components/PhysicalNftCertifier'

export default function DigitalTwinPage() {
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [scaleBarCm, setScaleBarCm] = useState(20)
  const [imageCount, setImageCount] = useState(60)
  const [urlsText, setUrlsText] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [lastCert, setLastCert] = useState<DigitalTwinCertificate | null>(null)
  const jobs = useMemo(() => listPaperJobs(), [msg])

  const imageUrls = urlsText
    .split(/\n+/)
    .map(s => s.trim())
    .filter(Boolean)

  const submitLab = async () => {
    if (!title.trim() || imageUrls.length < 8) {
      setMsg('Titre + au moins 8 URLs images (labo ≥ 40 recommandé).')
      return
    }
    const job = await submitColmapJob({
      title: title.trim(),
      artist: artist.trim() || 'Unknown',
      scaleBarCm,
      imageUrls,
    })
    setMsg(
      job.status === 'queued'
        ? `Job ${job.jobId} en file. Worker COLMAP GPU requis pour metric-certified.`
        : JSON.stringify(job),
    )
  }

  const previewBrowser = () => {
    const cert = createBrowserApproxCertificate({
      title: title.trim() || 'Sculpture',
      artist: artist.trim() || 'Unknown',
      heightCm: 120,
      widthCm: 40,
      depthCm: 35,
      imageCount: imageUrls.length || imageCount,
    })
    setLastCert(cert)
    setMsg('Certificat browser-approx généré — non éligible mint 1/1 labo.')
  }

  const tryMint = () => {
    if (!lastCert) {
      setMsg('Aucun certificat chargé.')
      return
    }
    const gate = dispatchMintSculpture1of1(lastCert)
    setMsg(gate.ok ? `Mint paper 1/1 dispatché · ${gate.reason}` : `Refus mint · ${gate.reason}`)
  }

  const gate = lastCert ? canMintOneOfOne(lastCert) : null

  return (
    <div className="animate-fade-in space-y-6 pb-16 max-w-lg mx-auto">
      <header className="space-y-2">
        <p className="section-label">Labo · jumeau numérique</p>
        <h1 className="section-title display">Sculpture 1/1 certifiée</h1>
        <div className="atelier-title-rule" aria-hidden />
        <p className="section-lead">
          Pipeline COLMAP / Meshroom (hors navigateur) + mire d’échelle → certificat{' '}
          <strong className="text-zinc-300">metric-certified</strong> → mint NFT 1/1 paper.
          L’approximation WebGL reste démo uniquement.
        </p>
      </header>

      <section className="rounded-2xl border border-cyan-500/25 bg-cyan-950/20 p-4 space-y-3 text-[13px] text-zinc-300">
        <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-300/90">Protocole labo</p>
        <ul className="list-disc pl-4 space-y-1 text-zinc-400">
          <li>40–120 photos, chevauchement ≥ 60 %</li>
          <li>Mire d’échelle connue (ex. 20,0 cm) dans le cadre</li>
          <li>Worker GPU Akash / local COLMAP — pas de PEM</li>
          <li>Hash SHA-256 du GLB dans le certificat</li>
          <li>Mint on-chain seulement après GO_LIVE + audit SC</li>
        </ul>
        <p className="text-[11px] text-zinc-500">
          Doc : <code className="text-zinc-400">docs/DIGITAL_TWIN_SCULPTURE.md</code>
        </p>
      </section>

      <div className="card space-y-3">
        <label className="block space-y-1">
          <span className="text-[11px] text-zinc-500">Titre sculpture</span>
          <input
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Kouros · atelier…"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] text-zinc-500">Artiste</span>
          <input
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            value={artist}
            onChange={e => setArtist(e.target.value)}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-[11px] text-zinc-500">Mire échelle (cm)</span>
            <input
              type="number"
              min={1}
              step={0.1}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              value={scaleBarCm}
              onChange={e => setScaleBarCm(Number(e.target.value))}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] text-zinc-500">Nb vues (estim.)</span>
            <input
              type="number"
              min={8}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              value={imageCount}
              onChange={e => setImageCount(Number(e.target.value))}
            />
          </label>
        </div>
        <label className="block space-y-1">
          <span className="text-[11px] text-zinc-500">URLs images (1 par ligne)</span>
          <textarea
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white min-h-[100px] font-mono text-[11px]"
            value={urlsText}
            onChange={e => setUrlsText(e.target.value)}
            placeholder="https://…/view01.jpg"
          />
        </label>

        <div className="flex flex-col gap-2">
          <button type="button" className="btn-primary w-full" onClick={submitLab}>
            Soumettre job COLMAP (labo)
          </button>
          <button
            type="button"
            className="rounded-xl border border-white/15 px-3 py-2 text-[13px] text-zinc-300"
            onClick={previewBrowser}
          >
            Certificat browser-approx (démo)
          </button>
        </div>
        {msg && <p className="text-[12px] text-amber-100/90">{msg}</p>}
      </div>

      {lastCert && (
        <section className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2 text-[12px]">
          <p className="text-[11px] uppercase tracking-[0.15em] text-zinc-500">Certificat</p>
          <p className="text-white font-medium">
            {lastCert.title} · grade <span className="text-cyan-300">{lastCert.grade}</span>
          </p>
          <p className="text-zinc-400">{lastCert.disclaimer}</p>
          {gate && (
            <p className={gate.ok ? 'text-emerald-300' : 'text-rose-300'}>
              Mint 1/1 : {gate.ok ? 'éligible paper' : gate.reason}
            </p>
          )}
          <button type="button" className="btn-primary w-full" onClick={tryMint} disabled={!gate?.ok}>
            Dispatch mint 1/1 paper
          </button>
        </section>
      )}

      {jobs.length > 0 && (
        <section className="space-y-1 text-[11px] text-zinc-500">
          <p className="uppercase tracking-[0.15em]">Jobs paper récents</p>
          {jobs.slice(0, 5).map(j => (
            <p key={'jobId' in j ? j.jobId : Math.random()}>
              {'jobId' in j ? j.jobId : '?'} · {j.status}
              {'message' in j && j.message ? ` — ${j.message.slice(0, 80)}` : ''}
            </p>
          ))}
        </section>
      )}

      <p className="text-[11px] text-zinc-600">
        <Link to="/museum" className="text-zinc-400 underline-offset-2 hover:underline">
          Galerie
        </Link>
        {' · '}
        <Link to="/venues" className="text-zinc-400 underline-offset-2 hover:underline">
          Location mur
        </Link>
      </p>

      <section className="space-y-2 pt-4 border-t border-white/10">
        <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Phygital · œuvre physique</p>
        <PhysicalNftCertifier />
      </section>
    </div>
  )
}
