import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const script=readFileSync(new URL('./check-xartists-vps-mail.sh',import.meta.url),'utf8')
const runbook=readFileSync(new URL('../../docs/ops/XARTISTS_OVH_MAIL_FORWARDING_2026-11-13.md',import.meta.url),'utf8')
test('VPS diagnostic has no mailbox or DNS write commands',()=>{
  assert.match(script,/set -euo pipefail/)
  assert.match(script,/postconf -h/)
  assert.match(script,/systemctl is-active/)
  assert.doesNotMatch(script,/systemctl (restart|reload|stop|enable)|postconf -e|postmap -|sed -i|docker exec|curl -X POST/)
  assert.doesNotMatch(script,/nelsontuduri@gmail\.com|DATABASE_URL|PRIVATE_KEY/)
})
test('runbook contains public aliases and insists on real mail receipt proof',()=>{
  for(const t of ['admin@xartists.art','contact@xartists.art','mail.xartists.art','OVHcloud','Postfix','SRS','SPF','DMARC','deux fournisseurs','Sans preuve'])
    assert.ok(runbook.includes(t),'Missing '+t)
  assert.doesNotMatch(runbook,/nelsontuduri@gmail\.com|nelsontuduriofficial@gmail\.com/)
  assert.match(runbook,/aucune boîte indépendante/)
})
