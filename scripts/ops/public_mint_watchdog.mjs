/**
 * Public, read-only xArtists mint-store and browse-only release watchdog.
 * All probes are GET requests to public endpoints. No wallets, PSP actions,
 * mint dispatch, SQL, credentials, or commercial activation.
 *
 * This is NOT a delivery proof or a recommendation to enable checkout.
 */
import { pathToFileURL } from 'node:url'

export const PROBE_URLS = Object.freeze({
  health: 'https://xartists-access-api.onrender.com/health',
  orders: 'https://xartists-access-api.onrender.com/v1/ops/orders-store/status',
  mint: 'https://xartists-access-api.onrender.com/v1/ops/mint-jobs-store/status',
  frontend: 'https://xartists-services-and-products.onrender.com/xArtists/build-info.json',
})

export function evaluatePublicMintReadiness({ health, orders, mint, frontend } = {}) {
  const checks = {
    'api_healthy': health?.ok === true && health?.service === 'access-api',
    'orders_use_postgres': health?.orders_backend === 'postgres',
    'orders_store_ready': orders?.ok === true && orders?.backend === 'postgres' &&
      orders?.table_ready === true,
    'mint_store_ready': mint?.ok === true && mint?.backend === 'postgres' &&
      mint?.table_ready === true,
    'paybox_checkout_closed': health?.paybox_checkout_enabled === false,
    'mint_dispatch_closed': health?.mint_dispatch_enabled === false,
    'mint_live_closed': health?.mint_live_enabled === false,
    'mint_dry_run_only': health?.mint_dry_run === true,
    'trading_closed': String(health?.lia_live_trading ?? '') === '0',
    'bridge_closed': health?.tro_solana_bridge === 'off',
    'auction_closed': health?.auction_enabled === false &&
      health?.auction_settle === false,
    'frontend_build_signed_by_commit': frontend?.renderer === 'sites-v3' &&
      /^[a-f0-9]{40}$/.test(String(frontend?.source_sha || '')) &&
      frontend?.base_url === '/xArtists/',
    'frontend_routes_present': Number.isInteger(frontend?.public_route_count) &&
      frontend.public_route_count >= 116,
    'frontend_trading_closed': frontend?.lia_live_trading === false,
  }
  return {
    ok: Object.values(checks).every(Boolean),
    scope: 'browse_only_readiness_not_nft_delivery',
    checks,
    failures: Object.entries(checks).filter(([, pass]) => !pass).map(([name]) => name),
  }
}

async function fetchJsonReadOnly(label, url, fetchImpl = fetch, attempts = 8) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetchImpl(url, {
        method: 'GET',
        redirect: 'error',
        headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(15_000),
      })
      if (res.status !== 200 || !res.headers.get('content-type')?.includes('application/json')) {
        throw new Error('invalid_http_or_content_type')
      }
      const body = await res.text()
      if (body.length > 16_384) throw new Error('response_too_large')
      const parsed = JSON.parse(body)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('invalid_json_shape')
      }
      return parsed
    } catch {
      if (attempt === attempts) throw new Error(label + '_unavailable')
      // Free Render services may be waking from idle; do not report an
      // intermittent initial 503 as a permanent schema failure.
      await new Promise(resolve => setTimeout(resolve, 5_000))
    }
  }
  throw new Error(label + '_unavailable')
}

export async function runPublicMintWatchdog(fetchImpl = fetch) {
  const data = {}
  for (const [key, url] of Object.entries(PROBE_URLS)) {
    data[key] = await fetchJsonReadOnly(key, url, fetchImpl)
  }
  return evaluatePublicMintReadiness(data)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = await runPublicMintWatchdog()
    console.log(JSON.stringify(result))
    if (!result.ok) process.exitCode = 1
  } catch (error) {
    // No raw network exception, response body, DSN, key or customer data.
    console.log(JSON.stringify({
      ok: false, scope: 'browse_only_readiness_not_nft_delivery',
      failures: [String(error.message).replace(/[^a-z_]/g, '').slice(0,64)],
    }))
    process.exitCode = 1
  }
}
