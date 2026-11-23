import {architecture as a,catalogue,navigation as n} from './architecture-catalogue.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

async function source(path) {
  return readFile(new URL(path, import.meta.url), 'utf8')
}
const [pages, shell, modules, core, dao, daoPage, locales, styles] = await Promise.all([
  source('../src/experience/Pages.tsx'),
  source('../src/experience/Shell.tsx'),
  source('../src/experience/modules.ts'),
  source('../src/experience/softLaunch.ts'),
  source('../src/components/DaoGovernance.tsx'),
  source('../src/pages/DaoPage.tsx'),
  source('../src/experience/locale.ts'),
  source('../src/experience/experience.css'),
])

test('Home presents task spaces and an optional personal entry',()=>{
  const home=pages.slice(pages.indexOf('export function Home()'),pages.indexOf('export function GroupPage'))
  assert.match(home,/PRIMARY_AREAS.map/)
  assert.equal(a.PRIMARY_AREAS.length,4)
  assert.match(home,/to="\/wallet"/)
  assert.match(home,/contextualModules\(modules,'studio'\)/)
  assert.doesNotMatch(home,/requestOpenConnect|sendTransaction|MintLive|CheckoutModal/)
  assert.doesNotMatch(home,/NetworkStrip|HomeHeroSculpture|LIA_CHAIN_PRIORITY/)
})

test('Governance and token share the participation area with DeFi kept secondary',()=>{
  assert.equal(a.areaFor('dao'),'ecosystem')
  assert.equal(a.areaFor('tro'),'ecosystem')
  assert.equal(a.PRIMARY_AREAS.find(x=>x.id==='ecosystem').to,'/finance')
  assert.equal(a.isNavigationVisible('dao'),true)
  assert.equal(a.isNavigationVisible('staking'),false)
  assert.match(shell,/PRIMARY_AREAS.map/)
  assert.match(pages,/matchesModuleSearch\(q,/)
})

test('DAO votes cannot be mistaken for official votes', () => {
  assert.match(daoPage, /daoIntroPlain/)
  assert.match(daoPage, /daoGovernanceUnavailable/)
  assert.match(dao, /onChain: false/)
  assert.doesNotMatch(dao, /onChain: live|TX SC à brancher|canVoteDao\(\)/)
  assert.match(dao, /daoDemoWarning/)
  assert.match(dao, /daoPracticeSaved/)
  assert.match(dao, /status: 'demo'/)
  assert.doesNotMatch(dao, /status: 'active'/)
  assert.doesNotMatch(dao, /sendTransaction|signTransaction|createTransaction/)
})

test('Homepage displays truthful independent chain & fiat states', () => {
  for (const name of ['welcomeMx','welcomeOpenSea','welcomeEuros','welcomeNoBridge']) {
    assert.match(pages, new RegExp(name))
    assert.match(locales, new RegExp(name+": \\["))
  }
  assert.match(pages, /to="\/marketplace\?tab=opensea"/)
  assert.match(pages, /to="\/offres"/)
  assert.doesNotMatch(pages.slice(pages.indexOf('export function Home()'), pages.indexOf('export function GroupPage')), /paybox_checkout_enabled=true|LIA_LIVE_TRADING=1|mint_live_enabled=true/)
})

test('Responsive entry uses semantic sections, landmark links, and reduced-motion support', () => {
  assert.match(pages, /aria-labelledby="xa-first-what"/)
  assert.match(pages, /aria-labelledby="xa-home-workflow-title"/)
  assert.match(pages, /<details className="xa-first-details">/)
  assert.match(styles, /\.xa-first-tiles\{display:grid/)
  assert.match(styles, /@media\(max-width:490px\)/)
  assert.match(styles, /prefers-reduced-motion:reduce/)
  assert.match(shell, /<nav className="xa-mobile-dock"/)
})

test('All new visitor copy has all eight locale variants', () => {
  for (const name of ['welcomeTitle','welcomeExplore','welcomeCreate','welcomeMarket','welcomeDao',
    'welcomeNetworks','welcomeEuros','welcomeToolsLead','daoIntroPlain','daoDemoWarning',
    'daoPracticeYes','daoPracticeNo','daoPracticeSaved','daoGovernanceUnavailable']) {
    const m = locales.match(new RegExp('  '+name+': (\\[[^\\n]*\\]),'))
    assert.ok(m, 'missing locale '+name)
    const row = JSON.parse(m[1])
    assert.equal(row.length, 8, 'not all locales present for '+name)
    for (const translated of row) assert.ok(typeof translated === 'string' && translated.trim().length>0)
  }
})
