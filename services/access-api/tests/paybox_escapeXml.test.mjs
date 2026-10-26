/**
 * P0.1 — escapeXml + billing XML safety for Paybox 3DSv2.
 * Run: node --test services/access-api/tests/paybox_escapeXml.test.mjs
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const payboxPath = path.resolve(__dirname, '../src/paybox.mjs')

const { buildBillingXml, buildShoppingCartXml, _escapeXmlForTests: escapeXml } = await import(
  'file://' + payboxPath
)

describe('escapeXml', () => {
  it('escapes the five XML special characters', () => {
    assert.equal(escapeXml(`a&b`), 'a&amp;b')
    assert.equal(escapeXml(`<script>`), '&lt;script&gt;')
    assert.equal(escapeXml(`x"y`), 'x&quot;y')
    assert.equal(escapeXml(`o'brien`), 'o&apos;brien')
  })

  it('handles empty / non-string', () => {
    assert.equal(escapeXml(''), '')
    assert.equal(escapeXml(null), 'null')
    assert.equal(escapeXml(undefined), 'undefined')
  })

  it('billing XML contains escaped entities for hostile input', () => {
    const xml = buildBillingXml({
      firstName: 'A&B',
      lastName: '<X>',
      address: '1 "Main" St',
      zip: "75'001",
      city: 'Paris & Co',
      countryCode: '250',
    })
    assert.match(xml, /A&amp;B/)
    assert.match(xml, /&lt;X&gt;/)
    assert.match(xml, /1 &quot;Main&quot; St/)
    assert.match(xml, /75&apos;001/)
    assert.match(xml, /Paris &amp; Co/)
    assert.doesNotMatch(xml, /<script/)
  })

  it('shopping cart quantity is numeric only (no injection surface)', () => {
    const xml = buildShoppingCartXml(11000, 1)
    assert.match(xml, /<totalQuantity>1<\/totalQuantity>/)
  })
})
