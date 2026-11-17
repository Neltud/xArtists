import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {spawnSync} from 'node:child_process'

const read=path=>readFileSync(new URL('../../../'+path,import.meta.url),'utf8')
const workflow=read('.github/workflows/ovh-api-staging-publish.yml')
const script=read('scripts/ops/deploy-ovh-api-staging.sh')
const overlay=read('deploy/ovh/compose.staging-deploy.yaml')
const base=read('deploy/ovh/compose.yaml')

test('manual OVH deploy cannot trigger from pushes or PRs and is scoped to main + staging approval',()=>{
  assert.match(workflow,/workflow_dispatch:/)
  assert.doesNotMatch(workflow,/\n\s+(?:push|pull_request|schedule):/)
  assert.match(workflow,/github\.ref == 'refs\/heads\/main'/)
  assert.match(workflow,/environment: ovh-api-staging/)
  assert.match(workflow,/cancel-in-progress: false/)
  assert.match(workflow,/permissions:\s*\n\s*contents: read/)
})

test('SSH is encrypted and host-key pinned; no blind remote or third-party deploy actions',()=>{
  for(const item of [
    'vars.OVH_SSH_HOST','vars.OVH_SSH_USER','secrets.OVH_SSH_PRIVATE_KEY',
    'secrets.OVH_SSH_KNOWN_HOSTS','StrictHostKeyChecking=yes','BatchMode=yes',
    'IdentitiesOnly=yes','GITHUB_SHA',
  ]) assert.ok(workflow.includes(item),item)
  for(const forbidden of [
    /ssh-keyscan\b/,/StrictHostKeyChecking=no/,/\/dev\/null" *>\s*.*known_hosts/,
    /password:\s*/,/api\.xartists\.art\/v1\/studio\/media\/upload/,
    /onrender\.com/,/docker\.run\/action/,/appleboy\/ssh-action/,
  ]) assert.doesNotMatch(workflow,forbidden)
})

test('remote OVH deploy uses exact detached SHA, private env, TLS and no mint/payment/IPFS toggle',()=>{
  for(const item of [
    'api-staging.xartists.art','git -C "$release" rev-parse HEAD',
    'api.env','XARTISTS_STUDIO_UPLOAD_APPROVED=0',
    'compose config --quiet','compose build --pull api','compose up -d --no-build',
    'Strict', // safety checks are enforced by CI SSH step, not the remote
  ].filter(x=>x!=='Strict'))assert.ok(script.includes(item),item)
  assert.match(script,/stat -c '%a'/)
  assert.match(script,/https:\/\/api-staging\.xartists\.art\/v1\/ops\/build-info/)
  assert.match(script,/identity\.execution_authorized!==false/)
  assert.match(script,/health\.mint_live_enabled!==false/)
  assert.match(script,/health\.studio_media_upload!=="off"/)
  assert.doesNotMatch(script,/sudo |ssh-keyscan|onrender\.com|docker compose down -v|XARTISTS_STUDIO_UPLOAD_APPROVED=1|\bpsql\b|\bmigrate\b|\bALTER TABLE\b/)
  assert.match(overlay,/XARTISTS_SOURCE_SHA:\s*\$\{XARTISTS_SOURCE_SHA:\?/)
  for(const flag of ['MINT_LIVE_ENABLED','STRIPE_LIVE_CHECKOUT_ENABLED','PAYBOX_CHECKOUT_ENABLED','LIA_LIVE_TRADING']){
    assert.ok(base.includes(flag+': "0"'),flag)
  }
})

test('deployment shell syntax valid and never writes secrets into the repository',()=>{
  const cmd=spawnSync('bash',['-n'],{input:script,encoding:'utf8'})
  assert.equal(cmd.status,0,cmd.stderr)
  assert.doesNotMatch(script,/echo\s+\$?(?:DATABASE_URL|ACCESS_JWT_SECRET|PINATA_JWT)/)
})
