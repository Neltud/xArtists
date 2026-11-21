/**
 * Neon Edge v0 — health + assisted-swap disabled-only.
 * Option A host path for #613. No keys, no MCP, no mint, no checkout.
 *
 * Neon Functions entry: export async function fetch(request)
 * (Web-standard Request → Response). Local smoke imports the same.
 */

const DEFAULT_ORIGINS = [
  'https://xartists.art',
  'https://www.xartists.art',
]

/** v0 never executes swaps, even if the env flag is set. */
const ASSISTED_SWAP_CAPABLE = false

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
  note: 'neon-edge-v0: execution not implemented; policy mirror only',
})

function env(name, fallback = '') {
  const v = typeof process !== 'undefined' ? process.env?.[name] : undefined
  return v == null || v === '' ? fallback : String(v)
}

function gitSha() {
  return env('GIT_SHA', env('COMMIT_SHA', 'unknown')).slice(0, 40)
}

/** Env flag only — does NOT mean this edge can run a swap. */
function assistedFlagConfigured() {
  return env('XORUS_ASSISTED_SWAP_ENABLED') === '1'
}

function allowedOrigins() {
  const raw = env('CORS_ORIGINS', DEFAULT_ORIGINS.join(','))
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
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
    headers['Access-Control-Allow-Methods'] = 'GET, HEAD, POST, OPTIONS'
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

function empty(req, status) {
  return new Response(null, { status, headers: corsHeaders(req) })
}

function pathnameOf(req) {
  try {
    return new URL(req.url).pathname.replace(/\/+$/, '') || '/'
  } catch {
    return '/'
  }
}

function methodNotAllowed(req, allowed) {
  return new Response(JSON.stringify({ ok: false, message: 'Method not allowed', allowed }), {
    status: 405,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      Allow: allowed.join(', '),
      ...corsHeaders(req),
    },
  })
}

/**
 * Neon Functions / Fetch entrypoint (required name: `fetch`).
 * @param {Request} request
 * @returns {Promise<Response>}
 */
export async function fetch(request) {
  const req = request
  const method = (req.method || 'GET').toUpperCase()
  const path = pathnameOf(req)

  if (method === 'OPTIONS') {
    return empty(req, 204)
  }

  // --- /health ---
  if (path === '/health' || path === '/v1/health') {
    if (method !== 'GET' && method !== 'HEAD') {
      return methodNotAllowed(req, ['GET', 'HEAD', 'OPTIONS'])
    }
    if (method === 'HEAD') return empty(req, 200)
    return json(req, 200, {
      ok: true,
      service: 'xartists-neon-edge',
      role: 'partial-host-option-a',
      sha: gitSha(),
      // Distinguish env misconfiguration from real capability
      assisted_swap_flag_configured: assistedFlagConfigured(),
      assisted_swap_capable: ASSISTED_SWAP_CAPABLE,
      assisted_swap_enabled: false,
      mint: 'off',
      checkout: 'off',
      live_trading: false,
      ts: new Date().toISOString(),
    })
  }

  // --- /v1/ops/build-info ---
  if (path === '/v1/ops/build-info') {
    if (method !== 'GET' && method !== 'HEAD') {
      return methodNotAllowed(req, ['GET', 'HEAD', 'OPTIONS'])
    }
    if (method === 'HEAD') return empty(req, 200)
    return json(req, 200, {
      service: 'xartists-neon-edge',
      sha: gitSha(),
      edge: 'neon-edge-v0',
      replaces_full_access_api: false,
      flags: {
        XORUS_ASSISTED_SWAP_ENABLED_env: assistedFlagConfigured(),
        XORUS_ASSISTED_SWAP_CAPABLE: ASSISTED_SWAP_CAPABLE,
        XORUS_LIVE_TRADING: false,
        mint: false,
        checkout: false,
      },
      routes: [
        'GET|HEAD /health',
        'GET|HEAD /v1/ops/build-info',
        'GET /v1/xorus/assisted-swap',
        'POST /v1/xorus/assisted-swap → 503 (disabled) or 501 (not implemented on edge)',
      ],
    })
  }

  // --- /v1/xorus/assisted-swap ---
  if (path === '/v1/xorus/assisted-swap') {
    const flagOn = assistedFlagConfigured()

    if (method === 'GET' || method === 'HEAD') {
      if (method === 'HEAD') return empty(req, 200)
      return json(req, 200, {
        // Public "enabled" means: flag on AND this host can execute. v0 → always false.
        enabled: false,
        flag_configured: flagOn,
        capable: ASSISTED_SWAP_CAPABLE,
        mode: 'assisted_human_sign_only',
        policy: POLICY,
        message: flagOn
          ? 'Env flag is set but neon-edge-v0 is not capable of swap execution (POST → 501).'
          : 'Assisted swap disabled on neon-edge-v0 (expected). POST returns 503.',
      })
    }

    if (method === 'POST') {
      if (!flagOn) {
        return json(req, 503, {
          ok: false,
          stage: 'disabled',
          message: 'XORUS_ASSISTED_SWAP_ENABLED is not 1. No quote, no MCP, no signingLink.',
          policy: POLICY,
        })
      }
      return json(req, 501, {
        ok: false,
        stage: 'not_implemented_on_edge',
        message:
          'neon-edge-v0 refuses swap execution even when the env flag is set. Use full access-api under review.',
        policy: POLICY,
      })
    }

    return methodNotAllowed(req, ['GET', 'HEAD', 'POST', 'OPTIONS'])
  }

  return json(req, 404, {
    ok: false,
    message: 'Not found on neon-edge-v0 (partial host). Full access-api not implied.',
    path,
  })
}

/** Alias for local smoke scripts that import default. */
export default fetch

export { POLICY, assistedFlagConfigured, gitSha, ASSISTED_SWAP_CAPABLE }
