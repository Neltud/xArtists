import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeLocalPaymentIntent as intent, normalizeLocalPaymentLog as log } from '../src/lib/localPaymentHistory.mjs'
test('invalid local entries cannot crash history', () => {
  for (const v of [null, undefined, 0, 'paid', [], true]) assert.equal(intent(v), null)
  assert.deepEqual(log([null, [], false]), [])
})
test('object-valued fields never reach React children', () => {
  const row = intent({packId:{}, provider:[], amount:{}, currency:{}})
  assert.equal(row.packId, 'Pack'); assert.equal(row.amount, '—')
  assert.equal(row.provider, 'local'); assert.equal(row.currency, 'EUR')
})
test('forged paid and delivered flags remain unverified local declarations', () => {
  for (const status of ['paid','delivered','owned','active']) {
    const row = intent({status,paper_only:false,providerVerified:true})
    assert.equal(row.kind, 'Déclaration locale · non vérifiée')
    assert.equal(row.status, undefined); assert.equal(row.providerVerified, undefined)
  }
})
test('amounts are bounded numeric display values', () => {
  for (const amount of [NaN, Infinity, -1, 'NaN', '-3', '1e300', '9'.repeat(200)]) assert.equal(intent({amount}).amount,'—')
  assert.equal(intent({amount:'3.79'}).amount, '3.79')
})
test('invalid dates and unbounded strings are sanitized', () => {
  for (const ts of [Infinity,NaN,-1,'2026-11-11',8640000000000001]) assert.equal(intent({ts}).ts,null)
  assert.equal(intent({packId:'a'.repeat(500)}).packId.length,160)
})
test('history processing keeps at most one hundred recent entries', () => {
  const rows=log(Array.from({length:150},(_,i)=>({amount:i})))
  assert.equal(rows.length,100); assert.equal(rows[0].amount,'50')
  assert.deepEqual(log({}),[])
})
