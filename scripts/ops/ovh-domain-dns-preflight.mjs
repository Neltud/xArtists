/**
 * xArtists / OVH domain preflight — PUBLIC DNS READ ONLY.
 *
 * No OVH API/login/secret, DNS write, SMTP login, email send, database
 * connection, checkout, wallet signing, or smart contract transaction.
 *
 * The probe NEVER proves registrar clientHold clearance, mail delivery,
 * website ownership, provider DKIM, SSL, or Render→Postgres identity.
 * Its output is a small safe summary; no raw TXT/token values are printed.
 */
import * as dns from 'node:dns/promises'
import { isIP } from 'node:net'
import { pathToFileURL } from 'node:url'

export const DOMAIN = 'xartists.art'

const QUERY_TYPES = Object.freeze(['NS', 'SOA', 'A', 'AAAA', 'MX', 'TXT', 'DMARC'])
const DNS_ABSENT = new Set(['ENOTFOUND', 'ENODATA', 'ENOENT', 'ENODOMAIN', 'NXDOMAIN'])

function asText(record) {
  if (Array.isArray(record)) return record.every(x => typeof x === 'string') ? record.join('') : ''
  return typeof record === 'string' ? record : ''
}
function hasValidMx(records) {
  return records.some(r => typeof r === 'object' && r !== null &&
    Number.isInteger(r.priority) && r.priority >= 0 &&
    typeof r.exchange === 'string' && /^[a-z0-9.-]{2,253}$/i.test(r.exchange) &&
    r.exchange !== '.')
}
function status(records, kind) {
  const x = records?.[kind]
  if (!x || typeof x !== 'object' || !['ok', 'absent', 'error'].includes(x.status) ||
      !Array.isArray(x.records) || x.records.length > 128) return { status: 'error', records: [] }
  return x
}

/** Pure summary of an UNTRUSTED DNS response. Never grants operational GO. */
export function assessDomainDns(records) {
  const values = Object.fromEntries(QUERY_TYPES.map(t => [t, status(records, t)]))
  const ns = values.NS.status === 'ok' && values.NS.records.some(s =>
    typeof s === 'string' && /^[a-z0-9.-]{3,253}$/i.test(s))
  const soa = values.SOA.status === 'ok' && values.SOA.records.some(s =>
    s && typeof s === 'object' && typeof s.nsname === 'string' && s.nsname.length > 2)
  const a = values.A.status === 'ok' && values.A.records.some(x => isIP(x) === 4)
  const aaaa = values.AAAA.status === 'ok' && values.AAAA.records.some(x => isIP(x) === 6)
  const mx = values.MX.status === 'ok' && hasValidMx(values.MX.records)
  const spfs = values.TXT.status === 'ok' ?
    values.TXT.records.map(asText).filter(s => /^v=spf1(?:\s|$)/i.test(s.trim())) : []
  const dmarcs = values.DMARC.status === 'ok' ?
    values.DMARC.records.map(asText).filter(s => /^v=DMARC1\s*;/i.test(s.trim()) &&
      /(?:^|;)\s*p=(none|quarantine|reject)(?:;|$)/i.test(s)) : []
  const spf = spfs.length === 1
  const dmarc = dmarcs.length === 1
  const issues = QUERY_TYPES.filter(t => values[t].status === 'error').map(t => t.toLowerCase() + '_lookup_unavailable')
  if (!(ns && soa)) issues.push('dns_delegation_not_proven')
  if (!(a || aaaa)) issues.push('web_address_not_resolved')
  if (!mx) issues.push('mail_mx_not_validated')
  if (!spf) issues.push('mail_spf_not_unique_or_missing')
  if (!dmarc) issues.push('mail_dmarc_not_unique_or_missing')

  return Object.freeze({
    domain: DOMAIN,
    mode: 'public_read_only',
    dns_delegation_observed: Boolean(ns && soa),
    website_address_observed: Boolean(a || aaaa),
    mail_dns_candidate_only: Boolean(mx && spf && dmarc),
    mx_observed: Boolean(mx),
    spf_unique: spf,
    dmarc_unique: dmarc,
    record_query_statuses: Object.fromEntries(QUERY_TYPES.map(t => [t, values[t].status])),
    issues,
    // False is intentional: public DNS cannot prove any of these.
    registrar_clienthold_cleared_verified: false,
    renewal_order_delivered_verified: false,
    website_https_served_verified: false,
    email_mailbox_exists_verified: false,
    email_delivery_and_reply_verified: false,
    email_dkim_verified: false,
    production_contact_ready: false,
    ovh_mysql_is_render_postgres: false,
    recommendation: 'manual_ovh_renewal_confirmation_and_email_send_receive_tests_required',
  })
}

async function safeQuery(fn) {
  try {
    const response = await fn()
    const records = Array.isArray(response) ? response : [response]
    return { status: 'ok', records }
  } catch (e) {
    return { status: DNS_ABSENT.has(e?.code) ? 'absent' : 'error', records: [] }
  }
}

/** Fetch public DNS metadata only; dependency injection supports offline tests. */
export async function probeDomainDns({ resolver = dns } = {}) {
  const input = {}
  const checks = [
    ['NS', () => resolver.resolveNs(DOMAIN)],
    ['SOA', () => resolver.resolveSoa(DOMAIN)],
    ['A', () => resolver.resolve4(DOMAIN)],
    ['AAAA', () => resolver.resolve6(DOMAIN)],
    ['MX', () => resolver.resolveMx(DOMAIN)],
    ['TXT', () => resolver.resolveTxt(DOMAIN)],
    ['DMARC', () => resolver.resolveTxt('_dmarc.' + DOMAIN)],
  ]
  const responses = await Promise.all(checks.map(async ([type, run]) => [type, await safeQuery(run)]))
  for (const [type, result] of responses) input[type] = result
  return assessDomainDns(input)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  probeDomainDns().then(result => {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n')
    // This is an informational probe: failed DNS does NOT fail CI, open payments or
    // trigger retries/registrar actions; review the issues array.
  }).catch(() => {
    process.stderr.write('read_only_dns_preflight_unavailable\n')
    process.exitCode = 2
  })
}
