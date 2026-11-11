/**
 * Read-only DNS preflight for the xArtists business mail domain.
 * DNS can establish routing/authentication records, NEVER mailbox existence.
 * No SMTP connection, account creation, or secret access is performed.
 */
import { promises as dns } from 'node:dns'
import { pathToFileURL } from 'node:url'

const DEFAULT_DOMAIN = 'xartists.art'
const errText = error => String(error?.code || error?.message || error)
const flatTxt = records => records.flatMap(row => [row.join('')])

async function checked(task) {
  try { return { ok: true, value: await task() } }
  catch (error) { return { ok: false, error: errText(error) } }
}

export async function auditBusinessMailDns({ domain = DEFAULT_DOMAIN, resolver = dns } = {}) {
  if (typeof domain !== 'string' || !/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(domain)) {
    throw new TypeError('invalid_mail_domain')
  }
  const [mx, ns, spf, dmarc] = await Promise.all([
    checked(() => resolver.resolveMx(domain)),
    checked(() => resolver.resolveNs(domain)),
    checked(() => resolver.resolveTxt(domain)),
    checked(() => resolver.resolveTxt(`_dmarc.${domain}`)),
  ])
  const mxHosts = mx.ok ? mx.value.filter(item => Number.isSafeInteger(item.priority) &&
    typeof item.exchange === 'string' && item.exchange.endsWith('.') === false &&
    item.exchange !== '.').map(item => ({ priority: item.priority, host: item.exchange.toLowerCase() })) : []
  const nsHosts = ns.ok ? ns.value.filter(item => typeof item === 'string') : []
  const spfRecords = spf.ok ? flatTxt(spf.value).filter(s => /^v=spf1(?:\s|$)/i.test(s)) : []
  const dmarcRecords = dmarc.ok ? flatTxt(dmarc.value).filter(s => /^v=DMARC1(?:;|$)/i.test(s)) : []
  const dmarcPolicy = dmarcRecords.length === 1
    ? /(?:^|;)\s*p\s*=\s*(none|quarantine|reject)\s*(?:;|$)/i.exec(dmarcRecords[0])?.[1]?.toLowerCase() || null
    : null
  const checks = {
    delegated: nsHosts.length >= 2,
    mx_published: mxHosts.length > 0,
    spf_single: spfRecords.length === 1,
    dmarc_single_valid_policy: Boolean(dmarcPolicy),
  }
  return {
    domain,
    checks,
    dns_preflight_passed: Object.values(checks).every(Boolean),
    mx: mxHosts.sort((a, b) => a.priority - b.priority),
    ns: nsHosts,
    spf: spfRecords,
    dmarc: { policy: dmarcPolicy, records: dmarcRecords },
    errors: Object.fromEntries(Object.entries({ mx, ns, spf, dmarc })
      .filter(([, result]) => !result.ok).map(([key, result]) => [key, result.error])),
    dkim: 'provider_selector_not_verified',
    mailbox_verified: false,
    inbox_delivery_verified: false,
    outbound_reply_verified: false,
    published_contact_allowed: false,
    note: 'DNS checks do not establish any mailbox or successful message delivery. Verify provider configuration and independent live send/receive tests first.',
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  auditBusinessMailDns().then(result => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
    if (!result.dns_preflight_passed) process.exitCode = 1
  }).catch(error => {
    process.stderr.write(`${errText(error)}\n`)
    process.exitCode = 1
  })
}
