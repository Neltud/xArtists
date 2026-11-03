/**
 * Read-only canonical $TRO supply auditor. No wallet, RPC signing or bridge calls.
 * Usage: node scripts/tro_supply_audit.mjs
 * Unit tests call auditTroSupply with synthetic inputs (no external network).
 */
import { pathToFileURL } from 'node:url'

export const TRO_ID = 'TRO-94c925'
export const TRO_OWNER = 'erd1mmh2j5y8esv2tmmyeau3hr4xa2u2te3zc3j9wumn3v5vm8uvsczqnucj5l'
export const TRO_DECIMALS = 6
const API = 'https://api.multiversx.com'
const BRIDGE = 'https://xartists-access-api.onrender.com/v1/tro/bridge/status'

function positiveAtomic(value, label, errors) {
  if (typeof value !== 'string' || !/^\\d+$/.test(value)) {
    errors.push(`${label}: expected decimal atomic-unit string`)
    return 0n
  }
  return BigInt(value)
}

export function formatAtomic(amount, decimals = TRO_DECIMALS) {
  const digits = amount.toString().padStart(decimals + 1, '0')
  const base = digits.slice(0, -decimals)
  const fraction = digits.slice(-decimals).replace(/0+$/, '')
  return fraction ? `${base}.${fraction}` : base
}

export function auditTroSupply(token, supply, status) {
  const errors = []
  const warnings = []
  if (!token || token.identifier !== TRO_ID) errors.push('Wrong canonical MultiversX token identifier')
  if (!token || token.owner !== TRO_OWNER) errors.push('Canonical issuer/owner does not match approved repository reference')
  if (!token || token.decimals !== TRO_DECIMALS) errors.push('Wrong decimals; must be 6, never 18')
  if (!supply || typeof supply !== 'object') errors.push('Missing independent /supply payload')
  const initial = positiveAtomic(supply?.initialMinted, 'initialMinted', errors)
  const minted = positiveAtomic(supply?.minted, 'minted', errors)
  const burnt = positiveAtomic(supply?.burnt, 'burnt', errors)
  const actual = initial + minted - burnt
  if (actual < 0n) errors.push('Burned amount exceeds issued supply')
  if (initial !== 500_000_000_000n) warnings.push('Initial issuance differs from historical 500,000 TRO; verify governance')
  if (String(token?.initialMinted) !== String(supply?.initialMinted) ||
      String(token?.minted) !== String(supply?.minted) ||
      String(token?.burnt) !== String(supply?.burnt)) errors.push('Token and supply endpoints disagree')
  // The explorer rounds its whole-token supply, so do NOT equate its displayed number
  // with exact atomic supply; require the deviation to be strictly less than 1 token.
  const listed = Number(supply?.supply)
  if (!Number.isFinite(listed) || Math.abs(listed - Number(actual) / 10 ** TRO_DECIMALS) >= 1) {
    errors.push('Displayed supply disagrees with atomic accounting')
  }
  if (!status || status?.source?.tokenIdentifier !== TRO_ID ||
      status?.bridge?.status !== 'disabled' ||
      status?.destination?.mintAddress != null ||
      status?.bridge?.transferAvailable !== false ||
      status?.sale?.directSaleLive !== false) {
    errors.push('Bridge/sale unexpectedly activated or cannot be verified fail-closed')
  }
  if (token?.canMint) warnings.push('Issuer metadata reports canMint=true; obtain on-chain role / authority attestation')
  if (token?.canUpgrade) warnings.push('Issuer metadata reports canUpgrade=true; publish governance and upgrade controls')
  if (token?.totalLiquidity != null) warnings.push('Indexed liquidity is volatile and is NOT proof of Solana pool or bridge collateral')
  return {
    ok: errors.length === 0,
    launchReady: false,
    token: TRO_ID,
    decimals: TRO_DECIMALS,
    exactSupplyAtomic: errors.length === 0 ? actual.toString() : null,
    exactSupplyTro: errors.length === 0 ? formatAtomic(actual) : null,
    solanaMintAttested: false,
    bridgeOperational: false,
    errors,
    warnings,
  }
}

async function getJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000), headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`GET ${url}: HTTP ${res.status}`)
  return res.json()
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [token, supply, status] = await Promise.all([
      getJson(`${API}/tokens/${TRO_ID}`),
      getJson(`${API}/tokens/${TRO_ID}/supply`),
      getJson(BRIDGE),
    ])
    const audit = auditTroSupply(token, supply, status)
    console.log(JSON.stringify({ at: new Date().toISOString(), ...audit }, null, 2))
    if (!audit.ok) process.exitCode = 1
  } catch (err) {
    console.error(JSON.stringify({ ok: false, launchReady: false, error: String(err?.message || err) }))
    process.exitCode = 1
  }
}
