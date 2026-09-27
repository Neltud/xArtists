/**
 * API minimale file d’attente jobs photogrammétrie.
 * Branche COLMAP/Meshroom ici (execFile) quand l’image contient les binaires.
 * Aucun PEM — lecture images + écriture mesh/certificat uniquement.
 */
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import { execSync } from 'node:child_process'

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

function hasColmap() {
  try {
    execSync('colmap -h', { stdio: 'ignore', timeout: 3000 })
    return true
  } catch {
    return false
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {})

  if (req.method === 'GET' && req.url === '/health') {
    const colmapBinary = hasColmap()
    return json(res, 200, {
      ok: true,
      service: 'xartists-colmap-worker',
      colmapBinary,
      note: colmapBinary
        ? 'COLMAP detected — lab jobs can run metric pipeline'
        : 'Scaffold — install COLMAP in image for metric-certified',
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
    const colmapBinary = hasColmap()
    const job = {
      status: colmapBinary ? 'queued' : 'error',
      jobId,
      createdAt: new Date().toISOString(),
      request: {
        title: payload.title,
        artist: payload.artist,
        scaleBarCm: payload.scaleBarCm,
        imageCount: Array.isArray(payload.imageUrls) ? payload.imageUrls.length : 0,
      },
      message: colmapBinary
        ? 'Queued — COLMAP pipeline not fully wired (feature/match/mapper next)'
        : 'COLMAP not installed in this image. Build Dockerfile.gpu with colmap package.',
    }
    jobs.set(jobId, job)
    return json(res, colmapBinary ? 202 : 503, job)
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
  console.log(`colmap-worker on :${PORT} colmap=${hasColmap()}`)
})
