import {readFileSync} from 'node:fs'
import {test} from 'node:test'
import assert from 'node:assert/strict'

const root=path=>readFileSync(new URL('../../../'+path,import.meta.url),'utf8')
const docker=readFileSync(new URL('../Dockerfile',import.meta.url),'utf8')
const compose=root('deploy/ovh/compose.yaml')
const caddy=root('deploy/ovh/Caddyfile')
const env=root('deploy/ovh/api.env.template')
const guide=root('deploy/ovh/README.md')

test('OVH uses a reproducible, unprivileged standalone API image',()=>{
  assert.match(docker,/FROM node:22-alpine/)
  assert.match(docker,/npm ci --omit=dev --ignore-scripts/)
  assert.doesNotMatch(docker,/\|\|\s*npm install/)
  assert.match(docker,/USER node/)
  assert.match(docker,/HEALTHCHECK/)
})

test('public edge exposes HTTPS, not the Access API port',()=>{
  assert.match(compose,/caddy:2-alpine/)
  assert.match(compose,/read_only: true/)
  assert.match(compose,/no-new-privileges:true/)
  assert.match(compose,/cap_drop:/)
  assert.match(compose,/PORT: "8787"/)
  assert.match(compose,/expose:/)
  assert.doesNotMatch(compose,/["']?8787:8787/)
  assert.match(caddy,/reverse_proxy api:8787/)
  assert.match(caddy,/\{\$API_HOSTNAME\}/)
})

test('a parallel probe cannot enable financial, IPFS or trading actions',()=>{
  for(const flag of ['MINT_LIVE_ENABLED','CREATOR_MEDIA_UPLOAD_ENABLED',
    'STUDIO_GLB_UPLOAD_ENABLED','STRIPE_LIVE_CHECKOUT_ENABLED',
    'PAYBOX_CHECKOUT_ENABLED','LIA_LIVE_TRADING']){
    assert.ok(compose.includes(flag+': "0"'),flag)
  }
  assert.match(compose,/MINT_DRY_RUN: "1"/)
  assert.match(env,/^DATABASE_URL=\s*$/m)
  assert.match(env,/^ACCESS_JWT_SECRET=\s*$/m)
  assert.doesNotMatch(env,/sk_live_|whsec_|Bearer\s|erd1[a-z0-9]{58}/)
  assert.match(guide,/rollback|Revert the frontend API base/)
  assert.match(guide,/Compose startup never migrates/)
})
