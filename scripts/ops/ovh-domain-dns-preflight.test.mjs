import test from 'node:test'
import assert from 'node:assert/strict'
import { assessDomainDns, probeDomainDns, DOMAIN } from './ovh-domain-dns-preflight.mjs'

const ok = records => ({ status: 'ok', records })
const absent = () => ({ status: 'absent', records: [] })
const zone = {
  NS: ok(['dns1.ovh.net', 'ns2.ovh.net']),
  SOA: ok([{ nsname: 'dns1.ovh.net', hostmaster: 'tech.ovh.net' }]),
  A: ok(['192.0.2.4']),
  AAAA: absent(),
  MX: ok([{ priority: 10, exchange: 'mx1.example.test' }]),
  TXT: ok([['v=spf1 include:example.test -all'], ['site-verification=do-not-log']]),
  DMARC: ok([['v=DMARC1; p=reject; rua=mailto:private@example.test']]),
}
test('all public DNS records are only a CANDIDATE: never proof of mail delivery or registrar renewal', () => {
  const v = assessDomainDns(zone)
  assert.equal(v.domain, DOMAIN)
  assert.equal(v.dns_delegation_observed, true)
  assert.equal(v.website_address_observed, true)
  assert.equal(v.mail_dns_candidate_only, true)
  assert.equal(v.production_contact_ready, false)
  assert.equal(v.email_mailbox_exists_verified, false)
  assert.equal(v.email_delivery_and_reply_verified, false)
  assert.equal(v.registrar_clienthold_cleared_verified, false)
  assert.equal(v.renewal_order_delivered_verified, false)
  assert.equal(v.website_https_served_verified, false)
  assert.equal(v.email_dkim_verified, false)
  assert.equal(v.ovh_mysql_is_render_postgres, false)
  assert.equal(JSON.stringify(v).includes('do-not-log'), false)
  assert.equal(JSON.stringify(v).includes('private@example.test'), false)
})
test('NXDOMAIN or empty zone is not a working domain or a working mailbox', () => {
  const z = Object.fromEntries(Object.keys(zone).map(x => [x, absent()]))
  const v = assessDomainDns(z)
  assert.equal(v.dns_delegation_observed, false)
  assert.equal(v.website_address_observed, false)
  assert.equal(v.mail_dns_candidate_only, false)
  assert.equal(v.issues.includes('dns_delegation_not_proven'), true)
  assert.equal(v.issues.includes('mail_mx_not_validated'), true)
})
test('a missing or duplicate SPF/DMARC denies mail DNS preflight', () => {
  for (const tweak of [
    { TXT: absent() },
    { TXT: ok([['v=spf1 include:a -all'], ['v=spf1 include:b -all']]) },
    { DMARC: absent() },
    { DMARC: ok([['v=DMARC1; p=none'], ['v=DMARC1; p=reject']]) },
    { MX: ok([{ priority: 0, exchange: '.' }]) },
    { MX: ok([]) },
  ]) {
    const v = assessDomainDns({ ...zone, ...tweak })
    assert.equal(v.mail_dns_candidate_only, false)
    assert.equal(v.production_contact_ready, false)
  }
})
test('DNS errors are not interpreted as NXDOMAIN or as a successful DNS', () => {
  const v = assessDomainDns({ ...zone, MX: { status: 'error', records: [] } })
  assert.equal(v.mail_dns_candidate_only, false)
  assert.equal(v.record_query_statuses.MX, 'error')
  assert.equal(v.issues.includes('mx_lookup_unavailable'), true)
  assert.equal(assessDomainDns(undefined).production_contact_ready, false)
  assert.equal(assessDomainDns({ ...zone, TXT: 'oops' }).spf_unique, false)
})
test('fake IP or no actual nameserver does not count as web ready', () => {
  const v = assessDomainDns({
    ...zone,
    NS: ok(['bad hostname']),
    A: ok(['not-an-ip']),
    AAAA: ok([]),
  })
  assert.equal(v.dns_delegation_observed, false)
  assert.equal(v.website_address_observed, false)
})
test('network probing is read-only, type-specific and runs without credentials', async () => {
  const calls = []
  const resolver = {
    resolveNs: async n => { calls.push(['NS', n]); return zone.NS.records },
    resolveSoa: async n => { calls.push(['SOA', n]); return zone.SOA.records[0] },
    resolve4: async n => { calls.push(['A', n]); return zone.A.records },
    resolve6: async n => {
      calls.push(['AAAA', n])
      throw Object.assign(new Error('ENODATA'), { code: 'ENODATA' })
    },
    resolveMx: async n => { calls.push(['MX', n]); return zone.MX.records },
    resolveTxt: async n => { calls.push(['TXT', n]); return n.startsWith('_dmarc.') ? zone.DMARC.records : zone.TXT.records },
  }
  const v = await probeDomainDns({ resolver })
  assert.equal(v.mail_dns_candidate_only, true)
  assert.equal(v.record_query_statuses.AAAA, 'absent')
  assert.deepEqual(calls.map(x => x[1]).sort(), [
    DOMAIN, DOMAIN, DOMAIN, DOMAIN, DOMAIN, DOMAIN, '_dmarc.' + DOMAIN,
  ].sort())
})
test('DNS resolution failure always produces a closed result, with no throw and no sends', async () => {
  const fail = async () => { throw new Error('dns unavailable') }
  const resolver = {
    resolveNs: fail, resolveSoa: fail, resolve4: fail, resolve6: fail,
    resolveMx: fail, resolveTxt: fail,
  }
  const v = await probeDomainDns({ resolver })
  assert.equal(v.mail_dns_candidate_only, false)
  assert.equal(v.production_contact_ready, false)
  assert.equal(v.issues.length >= 7, true)
  assert.equal(Object.values(v.record_query_statuses).every(s => s === 'error'), true)
})
