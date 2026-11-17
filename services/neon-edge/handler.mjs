/**
 * Neon Edge v0 — health + assisted-swap disabled-only.
 * Option A host path for #613. No keys, no MCP, no mint, no checkout.
 *
 * Compatible with Neon Functions Node (Request/Response Web API style).
 * Also runnable under `node --experimental-vm-modules` tests via export handlers.
 */

const DEFAULT_ORIGINS = [
  'https://xartists.art',
  'https://www.xartists.art',
]

const POLICY = Object.freeze({
  allowed_tokens: ['EGLD', 'WEGLD', 'ONE', 'USDC', 'USDT', 'WETH'],
  max_amount_in: {
    EGLD: 2.0,
    WEGLD: 2.0,
    ONE: 50_000,
    USDC: 500,
    USDT: 500,
    WETH: 0.5,
  },
  max_slippage_bps: 300,
  match_mode: 'exact',
  note: 'neon-edge-v0: POST execution disabled; policy mirror only',
})

function env(name, fallback = '') {
  const v = typeof process !== 'undefined' ? process.env?.[name] : undefined
  return v == null || v === '' ? fallback : String(v)
}

function gitSha() {
  return env('GIT_SHA', env('COMMIT_SHA', 'unknown')).slice(0, 40)
}

function assistedEnabled() {
  return env('XORUS_ASSISTED_SWAP_ENABLED') === '1'
}

function allowedOrigins() {
  const raw = env('CORS_ORIGINS', DEFAULT_ORIGINS.join(','))
  return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

function corsHeaders(req) {
  const origin = req.headers.get('origin') || ''
  const allow = allowedOrigins()
  const headers = {
    Vary: 'Origin',
    'X-Content-Type-Options': 'nosniff',
    'X-xArtists-Edge': 'neon-edge-v0',
    'X-xArtists-Git-Sha': gitSha(),
  }
  if (origin && allow.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    headers['Access-Control-Allow-Headers'] = 'content-type, authorization'
    headers['Access-Control-Max-Age'] = '600'
  }
  return headers
}

function json(req, status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...corsHeaders(req),
    },
  })
}

function pathnameOf(req) {
  try {
    return new URL(req.url).pathname.replace(/\/+$/, '') || '/'
  } catch {
    return '/'
  }
}

/**
 * Neon / Fetch entrypoint.
 * @param {Request} req
 * @returns {Promise<Response>}
 */
export default async function handler(req) {
  const method = req.method || 'GET'
  const path = pathnameOf(req)

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(req) })
  }

  if (path === '/health' || path === '/v1/health') {
    return json(req, 200, {
      ok: true,
      service: 'xartists-neon-edge',
      role: 'partial-host-option-a',
      sha: gitSha(),
      assisted_swap_enabled: assistedEnabled(),
      mint: 'off',
      checkout: 'off',
      live_trading: false,
      ts: new Date().toISOString(),
    })
  }

  if (path === '/v1/ops/build-info') {
    return json(req, 200, {
      service: 'xartists-neon-edge',
      sha: gitSha(),
      edge: 'neon-edge-v0',
      replaces_full_access_api: false,
      flags: {
        XORUS_ASSISTED_SWAP_ENABLED: assistedEnabled(),
        XORUS_LIVE_TRADING: false,
        mint: false,
        checkout: false,
      },
      routes: [
        'GET /health',
        'GET /v1/ops/build-info',
        'GET /v1/xorus/assisted-swap',
        'POST /v1/xorus/assisted-swap (503 while disabled)',
      ],
    })
  }

  if (path === '/v1/xorus/assisted-swap') {
    const enabled = assistedEnabled()

    if (method === 'GET') {
      return json(req, 200, {
        enabled,
        mode: 'assisted_human_sign_only',
        policy: POLICY,
        message: enabled
          ? 'Flag on — full proxy not implemented on neon-edge-v0; use access-api host when available.'
          : 'Assisted swap disabled on neon-edge-v0 (expected). POST returns 503.',
      })
    }

    if (method === 'POST') {
      if (!enabled) {
        return json(req, 503, {
          ok: false,
          stage: 'disabled',
          message: 'XORUS_ASSISTED_SWAP_ENABLED is not 1. No quote, no MCP, no signingLink.',
          policy: POLICY,
        })
      }
      // Even if flag is on, v0 does not execute MCP — fail closed.
      return json(req, 501, {
        ok: false,
        stage: 'not_implemented_on_edge',
        message:
          'neon-edge-v0 refuses swap execution. Deploy full access-api proxy or extend edge under review.',
        policy: POLICY,
      })
    }

    return json(req, 405, { ok: false, message: 'Method not allowed' })
  }

  return json(req, 404, {
    ok: false,
    message: 'Not found on neon-edge-v0 (partial host). Full access-api not implied.',
    path,
  })
}

// Optional Node local smoke: node --input-type=module -e "import h from './handler.mjs'; ..."
export { POLICY, assistedEnabled, gitSha }
