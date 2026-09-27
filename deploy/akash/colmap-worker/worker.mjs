/**
 * API minimale file d’attente jobs photogrammétrie.
 * Branche COLMAP/Meshroom ici (execFile) quand l’image contient les binaires.
 * Aucun PEM — lecture images + écriture mesh/certificat uniquement.
 */
import http from 'node:http'
import { randomUUID } from 'node:crypto'

const PORT = Number(process.env.PORT || 8080)
const jobs = new Map()

function json(res, code, body) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(JSON.stringify(body))
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {})

  if (req.method === 'GET' && req.url === '/health') {
    return json(res, 200, {
      ok: true,
      service: 'xartists-colmap-worker',
      colmapBinary: false,
      note: 'Scaffold — install COLMAP in image for metric-certified',
    })
  }

  if (req.method === 'POST' && req.url === '/jobs') {
    let body = ''
    for await (const chunk of req) body += chunk
    let payload
    try {
      payload = JSON.parse(body || '{}')
    } catch {
      return json(res, 400, { error: 'invalid json' })
    }
    const jobId = randomUUID()
    const job = {
      status: 'queued',
      jobId,
      createdAt: new Date().toISOString(),
      request: {
        title: payload.title,
        artist: payload.artist,
        scaleBarCm: payload.scaleBarCm,
        imageCount: Array.isArray(payload.imageUrls) ? payload.imageUrls.length : 0,
      },
      message:
        'Queued paper — COLMAP binary not in image yet. Deploy GPU image to process.',
    }
    jobs.set(jobId, job)
    // Auto-error until binary present (honest API)
    setTimeout(() => {
      const j = jobs.get(jobId)
      if (j) {
        j.status = 'error'
        j.message =
          'COLMAP not installed in this scaffold image. Build lab image with colmap + openmvs.'
        jobs.set(jobId, j)
      }
    }, 1000)
    return json(res, 202, job)
  }

  const m = req.url && req.url.match(/^\/jobs\/([\w-]+)$/)
  if (req.method === 'GET' && m) {
    const job = jobs.get(m[1])
    if (!job) return json(res, 404, { error: 'not found' })
    return json(res, 200, job)
  }

  return json(res, 404, { error: 'not found' })
})

server.listen(PORT, () => {
  console.log(`colmap-worker scaffold on :${PORT}`)
})
