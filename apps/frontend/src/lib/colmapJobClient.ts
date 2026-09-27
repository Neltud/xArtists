/**
 * Client job photogrammétrie labo (worker COLMAP / Meshroom).
 * Paper : file d’attente locale + POST optionnel VITE_COLMAP_WORKER_URL.
 */

export type ColmapJobRequest = {
  title: string
  artist: string
  scaleBarCm: number
  /** URLs ou data-URLs des photos (lab : préférer upload ZIP côté worker) */
  imageUrls: string[]
  physicalObjectId?: string
  material?: string
}

export type ColmapJobStatus =
  | { status: 'queued'; jobId: string; paper: true }
  | { status: 'running'; jobId: string; progress?: number }
  | {
      status: 'done'
      jobId: string
      glbUrl?: string
      certificate: import('./digitalTwinCertificate').DigitalTwinCertificate
    }
  | { status: 'error'; jobId: string; message: string }

const QUEUE_KEY = 'xartists_colmap_jobs_v1'

function workerBase(): string {
  return (import.meta.env.VITE_COLMAP_WORKER_URL as string | undefined)?.replace(/\/$/, '') || ''
}

export function listPaperJobs(): ColmapJobStatus[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
  } catch {
    return []
  }
}

function savePaperJobs(jobs: ColmapJobStatus[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(jobs.slice(0, 20)))
}

/**
 * Soumet un job. Si pas de worker URL → file paper locale (simulation QC).
 * Un vrai deploy Akash COLMAP répondra sur /jobs.
 */
export async function submitColmapJob(req: ColmapJobRequest): Promise<ColmapJobStatus> {
  const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const base = workerBase()

  if (base) {
    try {
      const r = await fetch(`${base}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      })
      if (r.ok) {
        const j = await r.json()
        return { status: 'queued', jobId: j.jobId || jobId, paper: true }
      }
    } catch {
      /* fall through paper */
    }
  }

  // Paper queue — en attendant worker GPU
  const queued: ColmapJobStatus = { status: 'queued', jobId, paper: true }
  const jobs = listPaperJobs()
  jobs.unshift(queued)
  savePaperJobs(jobs)

  // Simule un certificat relative (pas metric) tant que COLMAP réel absent
  window.setTimeout(() => {
    import('./digitalTwinCertificate').then(({ createMetricCertificate }) => {
      // Paper: on marque relative tant que pas de vrai mesh hash labo
      const cert = createMetricCertificate({
        title: req.title,
        artist: req.artist,
        scaleBarCm: req.scaleBarCm,
        imageCount: req.imageUrls.length,
        heightCm: 0,
        widthCm: 0,
        depthCm: 0,
        sha256: 'paper-pending-lab-mesh',
        holeRatio: 1,
        watertight: false,
        physical: { objectId: req.physicalObjectId, material: req.material },
      })
      // Force grade relative in paper simulation without real mesh
      ;(cert as { grade: string }).grade = 'relative'
      cert.metric.scaleApplied = false
      cert.disclaimer =
        'Paper job only — COLMAP worker not connected. No metric-certified mint until lab result.'
      const done: ColmapJobStatus = {
        status: 'error',
        jobId,
        message:
          'Worker COLMAP non connecté (VITE_COLMAP_WORKER_URL). Job paper enregistré — brancher Akash GPU pour grade metric-certified.',
      }
      const all = listPaperJobs().map(j => ('jobId' in j && j.jobId === jobId ? done : j))
      savePaperJobs(all)
      void cert
    })
  }, 500)

  return queued
}

export async function pollColmapJob(jobId: string): Promise<ColmapJobStatus | null> {
  const base = workerBase()
  if (base) {
    try {
      const r = await fetch(`${base}/jobs/${jobId}`)
      if (r.ok) return (await r.json()) as ColmapJobStatus
    } catch {
      /* */
    }
  }
  return listPaperJobs().find(j => 'jobId' in j && j.jobId === jobId) || null
}
