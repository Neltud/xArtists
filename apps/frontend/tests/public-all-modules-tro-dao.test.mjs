import {architecture as a,catalogue,navigation as n} from './architecture-catalogue.mjs'
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

test('all routes remain registered while context and directory follow the shared hierarchy',()=>{
  assert.equal(catalogue.length,44)
  const pages=read('../src/experience/Pages.tsx')
  assert.match(pages,/contextualModules\(modules,m.id\)/)
  assert.match(pages,/showLabModules\(\)/)
  assert.match(pages,/isSoftLaunchVisible\(m,lab\)/)
  assert.match(pages,/xa-directory-stage-controls/)
  assert.match(pages,/StageBadge stage=\{publicStage\(m.id\)\}/)
  assert.match(pages,/welcomeNoBridge/)
})
