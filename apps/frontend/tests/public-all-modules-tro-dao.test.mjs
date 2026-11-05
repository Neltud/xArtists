import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8')

test('DAO voting weight is exclusively staked TRO, never NFT/SFT or local balance', () => {
  const dao = read('../src/components/DaoGovernance.tsx')
  const locale = read('../src/experience/locale.ts')
  assert.match(dao, /const votingPower = Math\.max\(0, troStaked\)/)
  assert.match(dao, /daoPowerTroOnly/)
  assert.doesNotMatch(dao, /votingPower\s*=.*(?:sftUnits|nftUnits|walletBalance)/i)
  assert.doesNotMatch(dao, /loadSftUnits|SFT_STAKE_KEY|dao\.formula/)
  assert.match(dao, /onChain: false/)
  assert.doesNotMatch(dao, /sendTransaction|signTransaction|createTransaction/)
  const m = locale.match(/daoPowerTroOnly: (\[[^\n]*\]),/)
  assert.ok(m, 'missing translated staked-TRO-only governance explanation')
  const variants = JSON.parse(m[1])
  assert.equal(variants.length, 8)
  for (const sentence of variants) assert.ok(sentence.includes('$TRO'))
})

test('all registered module groups and sidebar destinations are discoverable by default', () => {
  const pages = read('../src/experience/Pages.tsx')
  const modules = read('../src/experience/modules.ts')
  const count = [...modules.matchAll(/\bmodule\('/g)].length
  assert.ok(count >= 35, `unexpected module count: ${count}`)
  assert.match(pages, /const list=modules\.filter\(m=>m\.group===group&&/)
  assert.match(pages, /modules\.filter\(x=>x\.group===m\.group\)/)
  assert.doesNotMatch(pages, /showLabModules\(\)/)
  assert.match(pages, /!isCoreModule\(m\)&&<span>\{c\('demoLabel'\)\}<\/span>/)
  assert.match(pages, /welcomeNoBridge/)
})
