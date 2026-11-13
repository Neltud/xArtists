import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const handoff=readFileSync(new URL('../../../docs/prompts/GROK_XARTISTS_AUDIT_ROADMAP_2026-11-13.md',import.meta.url),'utf8')
const index=readFileSync(new URL('../../../docs/security/grok-daily.md',import.meta.url),'utf8')

test('Grok handoff references current date and never implies a direct Grok run',()=>{
  assert.match(handoff,/13 novembre 2026/)
  assert.match(handoff,/6c7c1ff1e52866b14cb645159c782b1c3b47bfd4/)
  assert.match(handoff,/aucune réponse Grok API n.a été observée/)
  assert.match(handoff,/NON VÉRIFIÉ/)
  assert.match(index,/GROK_XARTISTS_AUDIT_ROADMAP_2026-11-13\.md/)
})
test('handoff prevents raw-data resale and unverified wallet signatures',()=>{
  for(const term of ['120 définitions','15 %','Sentinel','ABSTAIN','Stripe','Gmail'])
    assert.ok(handoff.includes(term),'Missing '+term)
  assert.match(handoff,/ne revend \*\*pas\*\* les données brutes/)
  assert.match(handoff,/sale_open=false/)
  assert.match(handoff,/aucune signature\/trade/)
  assert.doesNotMatch(handoff,/nelsontuduri@gmail\.com|nelsontuduriofficial@gmail\.com/)
  assert.doesNotMatch(handoff,/-----BEGIN.*PRIVATE KEY|sk_live_[A-Za-z0-9]+|whsec_[A-Za-z0-9]+/)
})
test('actual PR/issue references and billed review boundaries are explicit',()=>{
  for(const id of ['#561','#562','#563','#564','#548','#465','#506','#428','#281','#341','#487','#407','#430'])
    assert.ok(handoff.includes(id),'Missing '+id)
  assert.match(handoff,/workflow_dispatch/)
  assert.match(handoff,/XAI_API_KEY/)
  assert.match(handoff,/API xAI peut être facturé/)
  assert.match(handoff,/ChatGPT/)
})
