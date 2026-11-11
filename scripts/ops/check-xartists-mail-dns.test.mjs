import test from 'node:test'
import assert from 'node:assert/strict'
import { auditBusinessMailDns } from './check-xartists-mail-dns.mjs'

const records = {
  async resolveMx() { return [{ exchange: 'mail.xartists.art', priority: 1 }] },
  async resolveNs() { return ['dns107.ovh.net', 'ns107.ovh.net'] },
  async resolveTxt(name) {
    return name.startsWith('_dmarc.')
      ? [['v=DMARC1;p=reject;rua=mailto:adminsys@xartists.art;sp=reject;aspf=s;']]
      : [['v=spf1 a mx a:mail.xartists.art -all']]
  },
}

test('complete DNS is only a preflight, never evidence of a functioning mailbox', async () => {
  const report = await auditBusinessMailDns({ resolver: records })
  assert.equal(report.dns_preflight_passed, true)
  assert.equal(report.mx[0].host, 'mail.xartists.art')
  assert.equal(report.dmarc.policy, 'reject')
  assert.equal(report.mailbox_verified, false)
  assert.equal(report.inbox_delivery_verified, false)
  assert.equal(report.outbound_reply_verified, false)
  assert.equal(report.published_contact_allowed, false)
})

test('missing MX fails closed without crashing other record checks', async () => {
  const resolver = { ...records, async resolveMx() { const e = Error('not found'); e.code = 'ENODATA'; throw e } }
  const report = await auditBusinessMailDns({ resolver })
  assert.equal(report.dns_preflight_passed, false)
  assert.equal(report.checks.mx_published, false)
  assert.equal(report.errors.mx, 'ENODATA')
})

test('duplicate SPF, invalid policy and missing NS cannot pass', async () => {
  const resolver = {
    ...records,
    async resolveNs() { return [] },
    async resolveTxt(name) {
      return name.startsWith('_dmarc.')
        ? [['v=DMARC1;p=invalid']]
        : [['v=spf1 mx -all'], ['v=spf1 a -all']]
    },
  }
  const report = await auditBusinessMailDns({ resolver })
  assert.equal(report.checks.delegated, false)
  assert.equal(report.checks.spf_single, false)
  assert.equal(report.checks.dmarc_single_valid_policy, false)
  assert.equal(report.dns_preflight_passed, false)
})

test('malformed domain is rejected and never used as an arbitrary DNS lookup', async () => {
  await assert.rejects(auditBusinessMailDns({ domain: 'xartists.art; echo secret', resolver: records }),
    { name: 'TypeError', message: 'invalid_mail_domain' })
})

test('DNS provider errors cannot turn into a successful preflight', async () => {
  const resolver = { ...records, async resolveTxt() { throw Error('timeout') } }
  const report = await auditBusinessMailDns({ resolver })
  assert.equal(report.dns_preflight_passed, false)
  assert.equal(report.errors.spf, 'timeout')
  assert.equal(report.errors.dmarc, 'timeout')
})
