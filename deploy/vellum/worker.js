/**
 * Cloudflare Worker — proxy dApp → Vellum execute-workflow
 * Secrets: VELLUM_API_KEY
 * Optional: VELLUM_WORKFLOW_NAME (default xartists-8008-intents)
 *
 * Deploy: wrangler secret put VELLUM_API_KEY
 *         wrangler deploy
 * Puis GitHub secret VITE_VELLUM_8008_WEBHOOK = https://<worker>/vellum/8008
 */

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(),
      })
    }
    if (request.method !== 'POST') {
      return json({ error: 'POST only' }, 405)
    }
    const url = new URL(request.url)
    if (!url.pathname.endsWith('/vellum/8008') && url.pathname !== '/') {
      return json({ error: 'not found' }, 404)
    }
    if (!env.VELLUM_API_KEY) {
      return json({ error: 'VELLUM_API_KEY not configured' }, 500)
    }
    let body
    try {
      body = await request.json()
    } catch {
      return json({ error: 'invalid json' }, 400)
    }
    const workflow =
      body.workflow_deployment_name ||
      env.VELLUM_WORKFLOW_NAME ||
      'xartists-8008-intents'
    const inputs = body.inputs || [
      { name: 'intent_type', type: 'STRING', value: String(body.intent || '') },
      { name: 'payload_json', type: 'STRING', value: JSON.stringify(body.payload || {}) },
    ]
    const vellumRes = await fetch('https://predict.vellum.ai/v1/execute-workflow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': env.VELLUM_API_KEY,
      },
      body: JSON.stringify({
        workflow_deployment_name: workflow,
        external_id: body.external_id || undefined,
        inputs,
      }),
    })
    const text = await vellumRes.text()
    return new Response(text, {
      status: vellumRes.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(),
      },
    })
  },
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}
