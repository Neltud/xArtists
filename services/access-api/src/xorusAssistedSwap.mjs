/**
 * xOrus Assisted Swap proxy — policy first, then OneDex MCP.
 * Never signs. Never holds keys. signingLink only when simulation is strictly OK.
 * Mirrors xorus/execution/policy.py (exact allowlist + amount hygiene).
 */
const MCP = 'https://aggregator.onedex.app/ai/mcp'

const ALLOWED_TOKENS = new Set(['EGLD', 'WEGLD', 'ONE', 'USDC', 'USDT', 'WETH'])
const MAX_AMOUNT_IN = Object.freeze({
  EGLD: 2.0,
  WEGLD: 2.0,
  ONE: 50_000,
  USDC: 500,
  USDT: 500,
  WETH: 0.5,
})
const MAX_SLIPPAGE_BPS = 300
const ADDR = /^erd1[023456789acdefghjklmnpqrstuvwxyz]{58}$/i

function normalizeToken(t) {
  return String(t || '').trim().toUpperCase()
}

function parseAmount(raw) {
  if (raw == null || typeof raw === 'boolean') return null
  const s = String(raw).trim().replace(/,/g, '')
  if (!s || /^(nan|inf|\+inf|-inf)$/i.test(s)) return null
  const n = Number(s)
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

function checkPolicy({ tokenIn, tokenOut, amountIn, sender, maxSlippageBps }) {
  const tin = normalizeToken(tokenIn)
  const tout = normalizeToken(tokenOut)
  if (!ALLOWED_TOKENS.has(tin)) {
    return { allowed: false, reason: `token_in '${tokenIn}' not in ALLOWED_TOKENS (exact match required)` }
  }
  if (!ALLOWED_TOKENS.has(tout)) {
    return { allowed: false, reason: `token_out '${tokenOut}' not in ALLOWED_TOKENS (exact match required)` }
  }
  if (maxSlippageBps != null && Number(maxSlippageBps) > MAX_SLIPPAGE_BPS) {
    return { allowed: false, reason: `max_slippage_bps exceeds hard limit ${MAX_SLIPPAGE_BPS}` }
  }
  const amount = parseAmount(amountIn)
  if (amount == null) {
    return { allowed: false, reason: `invalid amount_in: ${JSON.stringify(amountIn)} (finite number > 0 required)` }
  }
  const base = tin.split('-')[0]
  const maxAmt = MAX_AMOUNT_IN[tin] ?? MAX_AMOUNT_IN[base]
  if (maxAmt != null && amount > maxAmt) {
    return { allowed: false, reason: `amount_in ${amount} exceeds MAX_AMOUNT_IN for ${base} (${maxAmt})` }
  }
  const s = String(sender || '').trim()
  if (!ADDR.test(s) && !(s.startsWith('erd1') && s.length >= 62)) {
    return { allowed: false, reason: 'sender must be a valid public erd1… address' }
  }
  return {
    allowed: true,
    reason: 'ok',
    limits_applied: {
      max_slippage_bps: MAX_SLIPPAGE_BPS,
      max_amount: maxAmt,
      allowed_tokens: [...ALLOWED_TOKENS].sort(),
      match_mode: 'exact',
    },
  }
}

async function mcpCall(name, args, { timeoutMs = 25_000 } = {}) {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), timeoutMs)
  try {
    const res = await fetch(MCP, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name, arguments: args },
      }),
      signal: ctl.signal,
    })
    if (!res.ok) throw new Error(`OneDex MCP HTTP ${res.status}`)
    const json = await res.json()
    if (json.error) throw new Error(json.error.message || 'RPC error')
    const result = json.result
    if (result?.structuredContent) return result.structuredContent
    const text = result?.content?.[0]?.text
    if (text) {
      try {
        return JSON.parse(text)
      } catch {
        return { text }
      }
    }
    return result || {}
  } finally {
    clearTimeout(timer)
  }
}

function pickMinOut(data) {
  const mo = data?.minOut
  if (mo && typeof mo === 'object') return String(mo.human || mo.amount || '')
  if (mo != null) return String(mo)
  return undefined
}

function pickMinOutRaw(data) {
  const mo = data?.minOut
  if (mo && typeof mo === 'object') return mo.raw || mo.amountRaw || data?.minOutRaw
  return data?.minOutRaw
}

/**
 * Full assisted path. Returns a plain object suitable for JSON response.
 * signingLink is present only when stage === 'ready_to_sign'.
 */
export async function runAssistedSwap(body) {
  const tokenIn = body?.tokenIn ?? body?.token_in
  const tokenOut = body?.tokenOut ?? body?.token_out
  const amountIn = body?.amountIn ?? body?.amount_in
  const sender = body?.sender
  const maxSlippageBps = body?.maxSlippageBps ?? body?.max_slippage_bps

  const policy = checkPolicy({ tokenIn, tokenOut, amountIn, sender, maxSlippageBps })
  if (!policy.allowed) {
    return {
      ok: false,
      stage: 'blocked',
      message: `Policy rejected: ${policy.reason}`,
      policy,
    }
  }

  let quote = null
  try {
    const rawQ = await mcpCall('get_quote', { tokenIn, tokenOut, amountIn })
    quote = {
      quotedOut: String(rawQ.quotedOut || rawQ.amountOut || ''),
      minOut: pickMinOut(rawQ),
      costSummary: String(rawQ.costSummary || rawQ.costs || ''),
      priceImpact: String(rawQ.priceImpact || ''),
      warnings: Array.isArray(rawQ.warnings) ? rawQ.warnings.map(String) : [],
    }
  } catch (e) {
    return {
      ok: false,
      stage: 'quote',
      message: `Quote failed: ${e instanceof Error ? e.message : String(e)}`,
      policy,
    }
  }

  let build = null
  let transaction = null
  try {
    const rawB = await mcpCall('build_swap_tx', { tokenIn, tokenOut, amountIn, sender })
    transaction = rawB.transaction || null
    build = {
      summary: String(rawB.summary || ''),
      minOut: pickMinOut(rawB),
      expiresAt: rawB.expiresAt ? String(rawB.expiresAt) : undefined,
      // signingLink withheld until simulation passes
      _signingLink: rawB.signingLink ? String(rawB.signingLink) : undefined,
    }
  } catch (e) {
    return {
      ok: false,
      stage: 'build',
      quote,
      message: `Build failed: ${e instanceof Error ? e.message : String(e)}`,
      policy,
    }
  }

  if (!transaction) {
    return {
      ok: false,
      stage: 'build',
      quote,
      build: { summary: build.summary, minOut: build.minOut, expiresAt: build.expiresAt },
      message: 'No transaction returned by build_swap_tx',
      policy,
    }
  }

  let simulation = null
  try {
    const rawS = await mcpCall('simulate_swap_tx', {
      transaction,
      minOut: pickMinOutRaw({ minOut: { raw: build.minOut }, minOutRaw: undefined }) || undefined,
    })
    const status = String(rawS.status || '').toLowerCase()
    const meets = rawS.meetsMinOut
    const statusOk = status === 'success' || status === 'ok'
    const meetsOk = meets === true || meets === 'true' || meets === 1
    simulation = {
      ok: statusOk && meetsOk,
      status,
      meetsMinOut: meetsOk ? true : meets === false || meets === 'false' ? false : null,
    }
  } catch (e) {
    return {
      ok: false,
      stage: 'simulate',
      quote,
      build: { summary: build.summary, minOut: build.minOut, expiresAt: build.expiresAt },
      message: `Simulation failed: ${e instanceof Error ? e.message : String(e)}`,
      policy,
    }
  }

  if (!simulation.ok || simulation.meetsMinOut !== true) {
    return {
      ok: false,
      stage: 'simulate',
      quote,
      build: { summary: build.summary, minOut: build.minOut, expiresAt: build.expiresAt },
      simulation,
      message: 'Simulation did not pass (status or minOut inconclusive/failed). Do not sign.',
      policy,
    }
  }

  return {
    ok: true,
    stage: 'ready_to_sign',
    quote,
    build: {
      summary: build.summary,
      minOut: build.minOut,
      expiresAt: build.expiresAt,
      signingLink: build._signingLink || null,
    },
    simulation,
    message: 'Ready. Open the signing link, verify receiver + amounts, then sign.',
    policy,
    requiresHumanSignature: true,
  }
}

export const XORUS_ASSISTED_SWAP_POLICY = Object.freeze({
  allowed_tokens: [...ALLOWED_TOKENS],
  max_amount_in: { ...MAX_AMOUNT_IN },
  max_slippage_bps: MAX_SLIPPAGE_BPS,
})
