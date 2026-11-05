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

test('Novice home presents four understandable journeys and no mandatory wallet', () => {
  const home = pages.slice(pages.indexOf('export function Home()'), pages.indexOf('export function GroupPage'))
  for (const id of ['visit','create','market','dao']) assert.match(home, new RegExp("id:'"+id+"'"))
  for (const dest of ["'/museum'","'/studio'","'/marketplace'","'/dao'"]) assert.ok(home.includes(dest))
  assert.match(home, /welcomeIntro/)
  assert.match(home, /welcomeNoBridge/)
  assert.match(home, /welcomeEuros/)
  assert.match(home, /<details className="xa-first-details">/)
  assert.doesNotMatch(home, /requestOpenConnect|sendTransaction|MintLive|CheckoutModal/)
  assert.doesNotMatch(home, /NetworkStrip|HomeHeroSculpture|LIA_CHAIN_PRIORITY/)
})

test('DAO is a primary nav destination on mobile, desktop, and module directory', () => {
  assert.match(modules, /module\('dao','\/finance\/governance',\['\/dao'\]/)
  assert.match(core, /'dao'/)
  assert.match(shell, /\['dao','\/finance\/governance',c\('dao'\)\]/)
  assert.match(shell, /to="\/dao" onClick=\{closeMobile\}/)
  assert.match(shell, /to="\/dao">\{c\('dao'\)\}/)
  assert.match(shell, /to:'\/finance\/governance',label:'dao'/)
  assert.match(pages, /const list=modules\.filter\(m=>\(group==='all'\|\|m\.group===group\)&&/)
  assert.match(shell, /const results=useMemo\(\(\)=>\{const needle=/)
  assert.doesNotMatch(shell.slice(shell.indexOf('export function Search'), shell.indexOf('function Header')), /isCoreModule\(m\)/)
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
  for (const name of ['welcomeMx','welcomeOpenSea','welcomeEuros','welcomeNoBridge','welcomeToolsLead']) {
    assert.match(pages, new RegExp(name))
    assert.match(locales, new RegExp(name+": \\["))
  }
  assert.match(pages, /to="\/marketplace\?tab=opensea"/)
  assert.match(pages, /to="\/offres"/)
  assert.doesNotMatch(pages.slice(pages.indexOf('export function Home()'), pages.indexOf('export function GroupPage')), /paybox_checkout_enabled=true|LIA_LIVE_TRADING=1|mint_live_enabled=true/)
})

test('Responsive entry uses semantic sections, landmark links, and reduced-motion support', () => {
  assert.match(pages, /aria-labelledby="xa-first-what"/)
  assert.match(pages, /aria-labelledby="xa-first-networks"/)
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
