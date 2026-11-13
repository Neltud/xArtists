import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const read = path => readFileSync(new URL('../src/' + path, import.meta.url), 'utf8')
const soft = read('experience/softLaunch.ts')
const mods = read('experience/modules.ts')
const pages = read('experience/Pages.tsx')
const shell = read('experience/Shell.tsx')
const intelligence = read('components/intelligence/IntelligencePath.tsx')
const product = read('config/product.ts')
const readiness = read('experience/publicReadiness.ts')
const copy = read('experience/locale.ts')

test('exact soft-launch core remains 15 visitor modules; all 44 routes are registered', () => {
  const match = soft.match(/export const CORE_MODULE_IDS = new Set\(\[([\s\S]*?)\]\)/)
  assert.ok(match, 'single explicit core allowlist')
  const ids = [...match[1].matchAll(/'([^']+)'/g)].map(x=>x[1])
  assert.deepEqual([...ids].sort(), [
    'museum','market','maison','lia','agents','packs','studio',
    'gallery-builder','wallet','account','tro-crosschain','status',
    'legal','guide','app',
  ].sort())
  assert.equal(ids.length, new Set(ids).size, 'no duplicate core IDs')
  const registered=[...mods.matchAll(/^\s*module\('([^']+)'/gm)].map(x=>x[1])
  assert.equal(registered.length, 44)
  for (const id of ids) assert.ok(registered.includes(id), 'missing module '+id)
  assert.match(mods, /export function findModule\(path:string\)/)
  assert.match(mods, /m\.aliases\.includes\(normalized\)/)
})

test('advanced-only modules remain routable, not rendered in default module lists', () => {
  assert.match(soft, /new URLSearchParams\(window\.location\.search\)\.get\('lab'\) === '1'/)
  assert.match(soft, /return lab \|\| isCoreModule\(m\)/)
  assert.match(pages, /isSoftLaunchVisible\(m,lab\)/)
  assert.match(pages, /x\.id===m\.id\|\|isSoftLaunchVisible\(x\)/)
  assert.match(pages, /isSoftLaunchVisible\(x\)\)\.sort/)
  assert.match(pages, /to="\/directory\?lab=1"/)
  assert.match(shell, /isSoftLaunchVisible\(m,lab\)&&matchesModuleSearch/)
  assert.match(intelligence, /steps\.filter\(step=>lab\|\|step\.path!=='\/intelligence\/lab'\)/)
  assert.match(shell, /to="\/dao" onClick=\{closeMobile\}/)
  assert.match(shell, /to="\/auction" onClick=\{closeMobile\}/)
})

test('primary navigation prioritizes xOrus and accounts without hiding legal', () => {
  assert.match(shell, /\['lia','\/intelligence\/xorus',c\('lia'\)\]/)
  assert.doesNotMatch(shell, /\['dao','\/finance\/governance',c\('dao'\)\]/)
  assert.match(shell, /to:'\/intelligence\/xorus',label:'lia'/)
  for(const route of ['/account','/create/gallery','/marketplace','/agents','/xorus','/guide']){
    assert.ok(shell.includes('to="'+route+'" onClick={closeMobile}'),route)
  }
  for(const key of ['account','advancedModules']){
    const line=copy.split('\n').find(l=>l.startsWith('  '+key+': '))
    assert.ok(line,'missing locale '+key)
    assert.equal(JSON.parse(line.slice(line.indexOf('['),line.lastIndexOf(']')+1)).length,8)
  }
})

test('no editorial preview or roadmap module is branded financially live', () => {
  assert.doesNotMatch(product,/status: 'live',/)
  for(const id of ['studio','gallery-builder','agents','lia','account'])
    assert.match(readiness,new RegExp("(?:'"+id+"'|"+id+"): 'preview'"))
  for(const id of ['trading','staking','liquidity','hatom','burnify','sale'])
    assert.match(readiness,new RegExp("(?:'"+id+"'|"+id+"): 'roadmap'"))
  assert.doesNotMatch(soft+pages+shell,/paybox_checkout_enabled\s*=\s*true|mint_live_enabled\s*=\s*true|LIA_LIVE_TRADING\s*=\s*1/)
})
